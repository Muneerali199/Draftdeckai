export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow 60 seconds for AI generation (Vercel Hobby limit)

import { NextResponse } from 'next/server';
import { generateLetterWithMistral, generateCoverLetterFromJob } from '@/lib/mistral';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits } from '@/lib/credits-service';

// Service role client for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // ✅ AUTHENTICATION CHECK
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create letters.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create letters.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      fromName,
      fromAddress,
      toName,
      toAddress,
      letterType,
      // For job-based cover letter generation
      jobDescription,
      jobUrl,
      fromEmail,
      skills,
      experience
    } = body;

    // Determine which action type to use for credit calculation
    // Cover letters require both job description and sender name to be present
    const isCoverLetter = jobDescription && fromName;
    const actionType = isCoverLetter ? 'cover_letter' : 'letter';

    // Check user credits
    const creditCost = ACTION_COSTS[actionType];

    // Get or create user credits
    let { data: userCredits } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record exists, create one
    if (!userCredits) {
      const { data: newCredits, error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          tier: 'free',
          credits_total: TIER_LIMITS.free,
          credits_used: 0,
          credits_reset_at: getCreditsResetDate()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create credits record:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize credits' },
          { status: 500 }
        );
      }
      userCredits = newCredits;
    }

    // Check if credits need reset
    if (userCredits && shouldResetCredits(userCredits.credits_reset_at)) {
      const resetAt = getCreditsResetDate();
      const { data: updatedCredits } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetAt,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedCredits) {
        userCredits = updatedCredits;
      }
    }

    // Check if user has enough credits
    const creditsRemaining = calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);

    if (creditsRemaining < creditCost) {
      return NextResponse.json(
        {
          error: 'Not enough credits',
          message: `You need ${creditCost} credits to generate a ${isCoverLetter ? 'cover letter' : 'letter'}. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining
        },
        { status: 402 }
      );
    }

    // Check if this is a job-based cover letter request
    if (isCoverLetter) {
      console.log('📝 Generating cover letter from job description with Mistral...');

      const coverLetter = await generateCoverLetterFromJob({
        jobDescription,
        jobUrl,
        fromName,
        fromEmail,
        fromAddress,
        skills,
        experience
      });

      // ✅ DEDUCT CREDITS after successful generation
      const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: userCredits.credits_used + creditCost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
      } else {
        await supabaseAdmin
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            action: actionType,
            credits_used: creditCost,
            metadata: { type: 'cover_letter', has_job_description: true }
          });

        console.log(`💳 Deducted ${creditCost} credits for cover letter generation`);
      }

      return NextResponse.json(coverLetter);
    }

    // Standard letter generation
    if (!prompt || !fromName || !toName || !letterType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`📝 Generating ${letterType} letter with Mistral...`);

    const letter = await generateLetterWithMistral({
      prompt,
      fromName,
      fromAddress,
      toName,
      toAddress,
      letterType,
    });

    // Format the response to ensure it has the expected structure
    const formattedResponse = {
      from: {
        name: letter.from?.name || fromName,
        address: letter.from?.address || fromAddress || ""
      },
      to: {
        name: letter.to?.name || toName,
        address: letter.to?.address || toAddress || ""
      },
      date: letter.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      subject: letter.subject || "Re: " + prompt.substring(0, 30) + "...",
      content: letter.content || letter.letter || "Letter content not available."
    };

    console.log('✅ Letter generated successfully with Mistral');

    // ✅ DEDUCT CREDITS after successful generation
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({
        credits_used: userCredits.credits_used + creditCost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
    } else {
      await supabaseAdmin
        .from('credit_usage_log')
        .insert({
          user_id: user.id,
          action: actionType,
          credits_used: creditCost,
          metadata: { letter_type: letterType, prompt_length: prompt.length }
        });

      console.log(`💳 Deducted ${creditCost} credits for letter generation`);
    }

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error generating letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate letter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}