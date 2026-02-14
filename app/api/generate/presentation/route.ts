export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { generatePresentation, generatePresentationOutline } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabase/instance';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits } from '@/lib/credits-service';

const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    // ✅ AUTHENTICATION CHECK
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create presentations.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create presentations.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { prompt, pageCount = 8, template } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    // Validate pageCount
    const validatedPageCount = Number(pageCount);
    if (
      !Number.isInteger(validatedPageCount) ||
      validatedPageCount < 1 ||
      validatedPageCount > 100
    ) {
      return NextResponse.json(
        { error: 'Invalid pageCount. Please provide an integer between 1 and 100.' },
        { status: 400 }
      );
    }

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

    // Check if user has enough credits - use validated page count
    const creditsPerSlide = ACTION_COSTS.presentation;
    const estimatedCreditCost = validatedPageCount * creditsPerSlide;
    const creditsRemaining = calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);
    
    if (creditsRemaining < estimatedCreditCost) {
      const creditWord = estimatedCreditCost === 1 ? 'credit' : 'credits';
      const slideWord = validatedPageCount === 1 ? 'slide' : 'slides';
      return NextResponse.json(
        { 
          error: 'Not enough credits',
          message: `You need ${estimatedCreditCost} ${creditWord} to generate a ${validatedPageCount}-${slideWord} presentation. You have ${creditsRemaining} ${creditsRemaining === 1 ? 'credit' : 'credits'} remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining,
          creditsRequired: estimatedCreditCost
        },
        { status: 402 }
      );
    }

    // Generate presentation outline first
    const outlines = await generatePresentationOutline({ prompt, pageCount: validatedPageCount });

    // Generate full presentation with visuals
    const slides = await generatePresentation({ outlines, prompt, template });

    // ✅ DEDUCT CREDITS based on actual slides generated
    const actualCreditCost = slides.length * creditsPerSlide;
    
    // Refetch user credits to avoid race conditions with resets
    const { data: currentCredits } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!currentCredits) {
      console.error('User credits not found after generation');
      // Return success but log error - user already got their content
      return NextResponse.json({
        slides,
        credits: {
          used: actualCreditCost,
          remaining: 0
        },
        warning: 'Credits could not be deducted. Please contact support.'
      });
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        credits_used: currentCredits.credits_used + actualCreditCost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      // Return success but log error - user already got their content
      return NextResponse.json({
        slides,
        credits: {
          used: actualCreditCost,
          remaining: calculateRemainingCredits(
            currentCredits.credits_total,
            currentCredits.credits_used
          )
        },
        warning: 'Credits could not be deducted. Please contact support.'
      });
    } else {
      // Log the usage
      await supabaseAdmin
        .from('credit_usage_log')
        .insert({
          user_id: user.id,
          action: 'presentation',
          credits_used: actualCreditCost,
          metadata: { 
            pageCount: slides.length,
            prompt_length: prompt.length 
          }
        });
      
      console.log(`💳 Deducted ${actualCreditCost} credits for ${slides.length}-slide presentation`);
    }

    return NextResponse.json({
      slides,
      credits: {
        used: actualCreditCost,
        remaining: calculateRemainingCredits(
          currentCredits.credits_total,
          currentCredits.credits_used + actualCreditCost
        )
      }
    });
  } catch (error) {
    console.error('Error generating presentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}