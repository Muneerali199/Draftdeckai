export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { generatePresentationOutline, generatePresentation } from '@/lib/gemini';
import { getSupabaseAdmin } from '@/lib/supabase/instance';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits } from '@/lib/credits-service';

const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
          controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({ error: 'Authentication required' }) + '\n\n'));
          controller.close();
          return;
        }

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
          controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({ error: 'Invalid authentication' }) + '\n\n'));
          controller.close();
          return;
        }

        const body = await request.json();
        const { prompt, pageCount = 8, template } = body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
          controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({ error: 'Missing or invalid prompt' }) + '\n\n'));
          controller.close();
          return;
        }

        const validatedPageCount = Math.min(100, Math.max(1, Number(pageCount)));

        controller.enqueue(encoder.encode('event: status\ndata: ' + JSON.stringify({ step: 'credits', message: 'Checking credits...' }) + '\n\n'));

        let { data: userCredits } = await supabaseAdmin
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!userCredits) {
          const { data: newCredits } = await supabaseAdmin
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

          if (newCredits) {
            userCredits = newCredits;
          }
        }

        if (userCredits && shouldResetCredits(userCredits.credits_reset_at)) {
          const resetAt = getCreditsResetDate();
          const { data: updatedCredits } = await supabaseAdmin
            .from('user_credits')
            .update({
              credits_used: 0,
              credits_reset_at: resetAt
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (updatedCredits) {
            userCredits = updatedCredits;
          }
        }

        const creditsPerSlide = ACTION_COSTS.presentation;
        const estimatedCreditCost = validatedPageCount * creditsPerSlide;
        const creditsRemaining = calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);

        if (creditsRemaining < estimatedCreditCost) {
          controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({
            error: 'Not enough credits',
            needsUpgrade: true,
            currentTier: userCredits.tier,
            creditsRemaining,
            creditsRequired: estimatedCreditCost
          }) + '\n\n'));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode('event: progress\ndata: ' + JSON.stringify({ step: 'outline', progress: 10, message: 'Generating presentation outline...' }) + '\n\n'));

        const outlines = await generatePresentationOutline({ prompt, pageCount: validatedPageCount });

        controller.enqueue(encoder.encode('event: outline\ndata: ' + JSON.stringify({ outlines } ) + '\n\n'));
        controller.enqueue(encoder.encode('event: progress\ndata: ' + JSON.stringify({ step: 'slides', progress: 30, message: 'Generating slides...' }) + '\n\n'));

        const slides = [];

        for (let i = 0; i < outlines.length; i++) {
          const progress = 30 + Math.floor(((i + 1) / outlines.length) * 60);
          controller.enqueue(encoder.encode('event: progress\ndata: ' + JSON.stringify({
            step: 'slides',
            progress,
            message: `Generating slide ${i + 1} of ${outlines.length}...`,
            currentSlide: i + 1,
            totalSlides: outlines.length
          }) + '\n\n'));

          try {
            const slide = await generatePresentationSlide(outlines[i], prompt, template);
            slides.push(slide);
          } catch (slideError) {
            console.error(`Error generating slide ${i + 1}:`, slideError);
            slides.push({
              title: outlines[i].title,
              content: outlines[i].content,
              error: true
            });
          }
        }

        controller.enqueue(encoder.encode('event: progress\ndata: ' + JSON.stringify({ step: 'saving', progress: 95, message: 'Saving and deducting credits...' }) + '\n\n'));

        const actualCreditCost = slides.filter(s => !s.error).length * creditsPerSlide;

        const { data: currentCredits } = await supabaseAdmin
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (currentCredits) {
          await supabaseAdmin
            .from('user_credits')
            .update({
              credits_used: currentCredits.credits_used + actualCreditCost,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

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

          console.log(`Deducted ${actualCreditCost} credits for ${slides.length}-slide presentation`);
        }

        controller.enqueue(encoder.encode('event: complete\ndata: ' + JSON.stringify({
          slides,
          credits: {
            used: actualCreditCost,
            remaining: calculateRemainingCredits(
              currentCredits?.credits_total || userCredits.credits_total,
              currentCredits?.credits_used + actualCreditCost || userCredits.credits_used + actualCreditCost
            )
          }
        }) + '\n\n'));

        controller.close();
      } catch (error) {
        console.error('Error in presentation stream:', error);
        controller.enqueue(encoder.encode('event: error\ndata: ' + JSON.stringify({
          error: 'Failed to generate presentation',
          details: error.message
        }) + '\n\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
