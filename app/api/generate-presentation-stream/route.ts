import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createEnhancedPresentationPrompt } from '@/lib/prompts/enhanced-presentation-prompt';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits } from '@/lib/credits-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // ✅ AUTHENTICATION CHECK
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const { topic, audience, outline, settings } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Calculate slide count from outline or default
    const slideCount = outline?.length || 8;

    // ✅ GET USER CREDITS
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
        return Response.json(
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

    // ✅ CHECK CREDITS
    const creditsPerSlide = ACTION_COSTS.presentation;
    const estimatedCreditCost = slideCount * creditsPerSlide;
    const creditsRemaining = calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);
    
    if (creditsRemaining < estimatedCreditCost) {
      return Response.json(
        { 
          error: 'Not enough credits',
          message: `You need ${estimatedCreditCost} credits to generate a ${slideCount}-slide presentation. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining,
          creditsRequired: estimatedCreditCost
        },
        { status: 402 }
      );
    }

    console.log(`🎨 Generating ENHANCED presentation: "${topic}" for ${audience}`);
    console.log(`💳 Will deduct ${estimatedCreditCost} credits for ${slideCount} slides`);

    // Create the ENHANCED prompt for 10x better presentations
    const prompt = createEnhancedPresentationPrompt(
      topic,
      audience || 'business professionals',
      outline,
      settings
    );

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // ✅ DEDUCT CREDITS BEFORE STARTING GENERATION
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({ 
        credits_used: userCredits.credits_used + estimatedCreditCost,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
    } else {
      // Log the usage
      await supabaseAdmin
        .from('credit_usage_log')
        .insert({
          user_id: user.id,
          action: 'presentation',
          credits_used: estimatedCreditCost,
          metadata: { 
            slideCount,
            topic,
            audience
          }
        });
      
      console.log(`💳 Deducted ${estimatedCreditCost} credits for ${slideCount}-slide presentation`);
    }

    // Start streaming in the background
    (async () => {
      try {
        console.log('📡 Starting Qwen3-235B stream with ENHANCED prompt...');

        const completion = await openai.chat.completions.create({
          model: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
          messages: [
            {
              role: 'system',
              content: `You are an elite presentation designer who creates presentations 10X BETTER than Gamma.
Your presentations feature:
- Professional mockups (phone, laptop, dashboard views)
- Rich data visualizations with realistic numbers
- Before/After comparisons
- Timeline/Roadmap views
- Stats grids with impressive metrics
- Feature grids with icons
- Testimonials with social proof
- Logo clouds for credibility

Always return valid TOON format starting with ---SLIDE---
Never include explanatory text, just the slide content.`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 12000,
          temperature: 0.7,
          stream: true,
        });

        let fullContent = '';

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';

          if (content) {
            fullContent += content;

            // Send chunk to client
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }

        console.log('✅ ENHANCED stream complete');
        console.log(`📊 Generated ${fullContent.length} characters`);

        // Send completion signal with credit info
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ 
            done: true,
            credits: {
              used: estimatedCreditCost,
              remaining: creditsRemaining - estimatedCreditCost
            }
          })}\n\n`)
        );
      } catch (error) {
        console.error('❌ Stream error:', error);
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
          )
        );
      } finally {
        await writer.close();
      }
    })();

    // Return the readable stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return Response.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}

