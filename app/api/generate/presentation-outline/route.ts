export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { 
  generatePresentationText, 
  generateChartData 
} from '@/lib/mistral';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits, hasUnlimitedDeveloperCredits } from '@/lib/credits-service';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NEBIUS_BASE_URL =
  process.env.NEBIUS_BASE_URL ||
  'https://api.tokenfactory.us-central1.nebius.com/v1/';

type NebiusOutlineModel =
  | 'Qwen/Qwen3-235B-A22B-Instruct-2507'
  | 'deepseek-ai/DeepSeek-V3.2'
  | 'meta-llama/Meta-Llama-3.1-70B-Instruct';

function normalizeOutlineModel(value: unknown): NebiusOutlineModel {
  const model = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (model === 'deepseek-ai/deepseek-v3.2' || model === 'deepseek-v3.2' || model === 'deepseek') {
    return 'deepseek-ai/DeepSeek-V3.2';
  }
  if (model === 'qwen/qwen3-235b-a22b-instruct-2507' || model === 'qwen' || model === 'qwen3-235b') {
    return 'Qwen/Qwen3-235B-A22B-Instruct-2507';
  }
  return 'meta-llama/Meta-Llama-3.1-70B-Instruct';
}

function buildPromptWithSettings(prompt: string, settings: any): string {
  const language = typeof settings?.language === 'string' && settings.language.trim() ? settings.language.trim() : 'English';
  const audience = typeof settings?.audience === 'string' && settings.audience.trim() ? settings.audience.trim() : 'Business';
  const tone = typeof settings?.tone === 'string' && settings.tone.trim() ? settings.tone.trim() : 'Professional';
  const textDensity = typeof settings?.textDensity === 'string' && settings.textDensity.trim() ? settings.textDensity.trim() : 'concise';
  const purpose = typeof settings?.purpose === 'string' && settings.purpose.trim() ? settings.purpose.trim() : 'General presentation';

  return `${prompt}

Generation Requirements:
- Language: ${language}
- Audience: ${audience}
- Tone: ${tone}
- Text Density: ${textDensity}
- Purpose: ${purpose}
- If this is a project/product/technical deck and page count allows, include UX/user-flow, architecture diagram, and tech stack coverage.`;
}

/**
 * Helper to create a filler slide with contextual content
 * 
 * This function is called when the AI generates fewer slides than requested,
 * padding the presentation to reach the correct slide count. It intelligently
 * determines the slide type based on position and context.
 * 
 * @param slideNumber - The 1-based index of the slide being created
 * @param totalCount - The total number of slides in the presentation
 * @param topic - The presentation topic for contextual content generation
 * @returns A slide object with type, title, content, and bullet points
 * 
 * Slide type logic:
 * - First slide (1): 'title' - Main presentation title
 * - Last slide: 'conclusion' - Summary and wrap-up
 * - Middle slide (for decks > 2 slides): 'chart' - Data visualization
 * - All others: 'content' - Regular content slides
 */
function createFillerSlide(slideNumber: number, totalCount: number, topic: string) {
  const isFirst = slideNumber === 1;
  const isLast = slideNumber === totalCount;

  // For very small decks (1-2 slides), we intentionally do not create a chart slide.
  let chartPosition: number | null = null;
  if (totalCount > 2) {
    const middlePosition = Math.ceil(totalCount / 2);
    chartPosition = Math.min(
      Math.max(middlePosition, 2),
      totalCount - 1
    );
  }
  const isChartPosition =
    !isFirst && !isLast && chartPosition !== null && slideNumber === chartPosition;

  let type: 'title' | 'content' | 'conclusion' | 'chart';
  if (isFirst) {
    type = 'title';
  } else if (isLast) {
    type = 'conclusion';
  } else if (isChartPosition) {
    type = 'chart';
  } else {
    type = 'content';
  }

  let title: string;
  let content: string;

  switch (type) {
    case 'title':
      title = topic;
      content = `Overview of ${topic}`;
      break;
    case 'conclusion':
      title = 'Summary';
      content = `Key takeaways and next steps for ${topic}`;
      break;
    case 'chart':
      title = `Key Data for ${topic}`;
      content = `Visual representation of important metrics or trends related to ${topic}`;
      break;
    default:
      title = `Additional Point ${slideNumber}`;
      content = `Additional information related to ${topic}`;
      break;
  }

  return {
    slideNumber,
    type,
    title,
    content,
    bulletPoints: [
      'Supporting detail',
      'Further explanation',
      'Key takeaway'
    ],
    notes: ''
  };
}

// Fallback to Nebius/Qwen when Gemini fails
const nebiusClient = new OpenAI({
  baseURL: NEBIUS_BASE_URL,
  apiKey: process.env.NEBIUS_API_KEY,
});

async function generateWithNebius(
  prompt: string,
  pageCount: number,
  model: NebiusOutlineModel = 'meta-llama/Meta-Llama-3.1-70B-Instruct'
) {
  console.log('🔄 Using Nebius/Qwen as fallback...');
  
  const completion = await nebiusClient.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a professional presentation designer. Generate exactly ${pageCount} slides for a presentation.
Return a JSON array of slides with this structure:
[
  {
    "slideNumber": 1,
    "type": "title",
    "title": "Main Title",
    "subtitle": "Subtitle text",
    "content": "Brief description",
    "bulletPoints": ["Point 1", "Point 2", "Point 3"]
  }
]
Slide types: title, content, bullets, stats, comparison, timeline, conclusion
Make content professional, engaging, and visually focused.`
      },
      {
        role: 'user',
        content: `Create a ${pageCount}-slide presentation about: ${prompt}`
      }
    ],
    max_tokens: 4000,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || '[]';
  
  // Extract JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsedSlides = JSON.parse(jsonMatch[0]);
      
      // Ensure we have the correct number of slides
      if (parsedSlides.length !== pageCount) {
        console.warn(`⚠️ Nebius generated ${parsedSlides.length} slides instead of ${pageCount}. Adjusting...`);
        
        // If too many slides, trim to pageCount
        if (parsedSlides.length > pageCount) {
          return parsedSlides.slice(0, pageCount);
        }
        
        // If too few slides, generate filler slides based on topic
        while (parsedSlides.length < pageCount) {
          parsedSlides.push(createFillerSlide(parsedSlides.length + 1, pageCount, prompt));
        }
      }
      
      return parsedSlides;
    } catch (e) {
      console.error('Failed to parse Nebius response:', e);
    }
  }
  
  // Fallback: create basic slides with exact pageCount using helper
  return Array.from({ length: pageCount }, (_, i) => {
    if (i === 0) {
      return {
        slideNumber: 1,
        type: 'title',
        title: prompt,
        content: 'Content for this slide',
        bulletPoints: ['Key point 1', 'Key point 2', 'Key point 3']
      };
    }
    return createFillerSlide(i + 1, pageCount, prompt);
  });
}


export async function POST(request: Request) {
  try {
    // ✅ AUTHENTICATION CHECK
    const authHeader = request.headers.get('Authorization');
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
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    const body = await request.json();
    const { prompt, pageCount = 8, outlineOnly = false, settings } = body;
    const selectedModel = normalizeOutlineModel(settings?.llmModel);
    const promptWithSettings = buildPromptWithSettings(prompt, settings);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Validate pageCount to prevent invalid or abusive credit calculations
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
      const { data: updatedCredits, error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetAt,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to reset credits in database, applying local reset instead:', updateError);
        userCredits = {
          ...userCredits,
          credits_used: 0,
          credits_reset_at: resetAt,
        };
      } else if (updatedCredits) {
        userCredits = updatedCredits;
      } else {
        console.error('Credits reset did not return an updated record, applying local reset instead');
        userCredits = {
          ...userCredits,
          credits_used: 0,
          credits_reset_at: resetAt,
        };
      }
    }

    // Check if user has enough credits - use validated page count for calculation
    const creditsPerSlide = ACTION_COSTS.presentation;
    const estimatedCreditCost = validatedPageCount * creditsPerSlide;
    const creditsRemaining = hasUnlimitedCredits
      ? Number.MAX_SAFE_INTEGER
      : calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);
    
    if (!hasUnlimitedCredits && creditsRemaining < estimatedCreditCost) {
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

    console.log('📝 Step 1: Generating slide text content...');
    
    // Step 1: Generate text content - Use Mistral first, then Nebius fallback
    let outlines;
    const nebiusFirst = selectedModel !== 'meta-llama/Meta-Llama-3.1-70B-Instruct';
    if (nebiusFirst) {
      console.log(`Using Nebius model for outline generation: ${selectedModel}`);
      outlines = await generateWithNebius(promptWithSettings, validatedPageCount, selectedModel);
    } else {
      try {
        console.log('Using Mistral Large for text generation');
        outlines = await generatePresentationText(prompt, validatedPageCount, {
          language: settings?.language,
          audience: settings?.audience,
          tone: settings?.tone,
          textDensity: settings?.textDensity,
          purpose: settings?.purpose,
        });

        if (!outlines || outlines.length === 0) {
          throw new Error('Mistral generated no content');
        }

        console.log('Generated with Mistral');
      } catch (mistralError: any) {
        console.error('Mistral failed:', mistralError.message);
        console.log('Falling back to Nebius...');
        outlines = await generateWithNebius(promptWithSettings, validatedPageCount, selectedModel);
      }
    }
    
    console.log(`✅ Generated ${outlines.length} slides`);

    // If outlineOnly is requested, return here without generating images/charts
    if (outlineOnly) {
      console.log('🚀 Returning outline only as requested');
      return NextResponse.json({ 
        outlines: outlines,
        stats: {
          totalSlides: outlines.length,
          withImages: 0,
          withCharts: 0,
        }
      });
    }

    console.log('🎨 Step 2: Generating images with FLUX AI...');
    
    // Step 2: Generate images with FLUX (skip Mistral)
    const { generatePresentationImages } = await import('@/lib/flux-image-generator');
    const { getEnhancedImagePrompt } = await import('@/lib/presentation-styles');
    
    // Create enhanced image prompts from slide content
    const imagePrompts = outlines.map((outline: any) => {
      const slideType = outline.type || 'content';
      const title = outline.title || '';
      const content = outline.content || outline.bulletPoints?.join(', ') || '';
      
      // Create detailed, contextual prompt for stunning images
      let basePrompt = '';
      
      if (slideType === 'title' || slideType === 'cover') {
        basePrompt = `Stunning hero image for presentation titled "${title}", ${prompt}, inspiring and professional`;
      } else if (slideType === 'conclusion' || slideType === 'summary') {
        basePrompt = `Inspiring conclusion image for "${title}", uplifting and motivational, ${prompt}`;
      } else {
        basePrompt = `Professional visual representation of "${title}", ${content.substring(0, 80)}, ${prompt}`;
      }
      
      // Enhance with style-specific keywords
      return getEnhancedImagePrompt(basePrompt, 'modern');
    });
    
    // Generate all images with FLUX (using 512x512 - smaller, faster)
    const imageUrls = await generatePresentationImages(imagePrompts, "512x512");
    
    console.log(`✅ Generated ${imageUrls.length} images with FLUX`);
    console.log('📊 Step 3: Generating chart data with Mistral AI...');
    
    // Step 3: Generate chart data with Mistral AI (keep this for now)
    let chartDataList: any[] = [];
    try {
      chartDataList = await generateChartData(outlines, prompt);
      console.log(`✅ Generated ${chartDataList.length} charts`);
    } catch (error) {
      console.error('Error generating charts:', error);
      console.log('⚠️ Skipping chart generation due to rate limit');
    }
    
    console.log('✨ Step 4: Combining slides with images and charts...');
    
    // Step 4: Combine everything
    const enhancedOutlines = outlines.map((outline: any, index: number) => {
      const chartData = chartDataList.find((chart: any) => chart.slideNumber === index + 1);
      
      return {
        ...outline,
        image: imageUrls[index] || `https://placehold.co/512x512/EEE/31343C?text=Slide+${index + 1}`,
        imageQuery: imagePrompts[index],
        imageDescription: `AI-generated image for ${outline.title}`,
        imageUrl: imageUrls[index] || `https://placehold.co/512x512/EEE/31343C?text=Slide+${index + 1}`,
        chartData: chartData || null,
        bullets: outline.bulletPoints || outline.bullets || [],
      };
    });
    
    console.log('✨ Step 5: Presentation enhancement complete!');
    console.log(`📊 Final stats: ${enhancedOutlines.length} slides, ${imageUrls.length} FLUX images, ${chartDataList.length} charts`);
    
    // ✅ DEDUCT CREDITS based on actual slides generated
    const actualCreditCost = enhancedOutlines.length * creditsPerSlide;
    if (!hasUnlimitedCredits) {
      const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({ 
          credits_used: userCredits.credits_used + actualCreditCost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
        // Don't fail the request, just log the error
      } else {
        // Log the usage
        const { error: logError } = await supabaseAdmin
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            action: 'presentation',
            credits_used: actualCreditCost,
            metadata: { 
              pageCount: enhancedOutlines.length,
              prompt_length: prompt.length 
            }
          });
        
        if (logError) {
          console.error('Failed to log credit usage:', logError);
        }
        
        console.log(`💳 Deducted ${actualCreditCost} credits for ${enhancedOutlines.length}-slide presentation`);
      }
    }
    
    return NextResponse.json({ 
      outlines: enhancedOutlines,
      stats: {
        totalSlides: enhancedOutlines.length,
        withImages: enhancedOutlines.filter((o: any) => o.imageUrl).length,
        withCharts: enhancedOutlines.filter((o: any) => o.chartData).length,
      },
      credits: {
        used: hasUnlimitedCredits ? 0 : actualCreditCost,
        remaining: hasUnlimitedCredits
          ? Number.MAX_SAFE_INTEGER
          : calculateRemainingCredits(
            userCredits.credits_total,
            userCredits.credits_used + actualCreditCost
          )
      }
    });
  } catch (error) {
    console.error('Error generating presentation outline:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation outline', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

