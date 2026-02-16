import { NextResponse } from 'next/server';
import { generateCodeDrivenPresentation } from '@/lib/qwen-code-presentation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function mapLegacySlides(outlines: any[]) {
  return outlines.map((outline: any, index: number) => {
    return {
      title: outline.title || `Slide ${index + 1}`,
      content: outline.content || outline.description || '',
      bullets: outline.bullets || outline.bulletPoints || [],
      charts: outline.chartData || null,
      image: outline.image || outline.imageUrl || `https://placehold.co/1024x576/EEE/31343C?text=Slide+${index + 1}`,
      layout: outline.layout || outline.type || 'title-content',
      imagePrompt: outline.imageQuery || outline.imagePrompt || ''
    };
  });
}

function normalizeThemeTokens(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  const validHex = /^#[0-9A-Fa-f]{6}$/;
  const allowedKeys = ['--dd-bg', '--dd-card', '--dd-fg', '--dd-accent', '--dd-border'];

  allowedKeys.forEach((key) => {
    const raw = input[key];
    if (typeof raw === 'string' && validHex.test(raw.trim())) {
      result[key] = raw.trim();
    }
  });

  return Object.keys(result).length ? result : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      outlines,
      prompt = '',
      generationMode = 'code-driven',
      settings
    } = body;

    if (!outlines || !Array.isArray(outlines)) {
      return NextResponse.json(
        { error: 'Missing or invalid outlines' },
        { status: 400 }
      );
    }

    console.log('Processing presentation with outline data...');
    console.log(`Found ${outlines.length} slides with images`);

    if (generationMode !== 'legacy' && !process.env.NEBIUS_API_KEY) {
      return NextResponse.json(
        { error: 'NEBIUS_API_KEY is required for Qwen code-driven generation.' },
        { status: 500 }
      );
    }

    const shouldTryCodeDriven = generationMode !== 'legacy';
    if (shouldTryCodeDriven) {
      try {
        const codeDrivenDeck = await generateCodeDrivenPresentation({
          prompt: String(prompt || outlines[0]?.title || 'Presentation'),
          outlines,
          themeHint: typeof settings?.theme === 'string' ? settings.theme : '',
          themeTokens: normalizeThemeTokens(settings?.themeTokens),
          model: typeof settings?.llmModel === 'string' ? settings.llmModel : undefined,
          settings: {
            language: typeof settings?.language === 'string' ? settings.language : undefined,
            audience: typeof settings?.audience === 'string' ? settings.audience : undefined,
            tone: typeof settings?.tone === 'string' ? settings.tone : undefined,
            textDensity: typeof settings?.textDensity === 'string' ? settings.textDensity : undefined,
            purpose: typeof settings?.purpose === 'string' ? settings.purpose : undefined,
            llmModel: typeof settings?.llmModel === 'string' ? settings.llmModel : undefined,
          },
        });

        const slides = codeDrivenDeck.slides.map((slide, index) => {
          const outline = outlines[index] || {};
          return {
            title: slide.title || `Slide ${index + 1}`,
            content: slide.body_text || outline.content || outline.description || '',
            bullets: slide.bullet_points || outline.bullets || outline.bulletPoints || [],
            charts: slide.visual_type === 'chart_data'
              ? (slide.chart_data || slide.visual_content || null)
              : (outline.chartData || null),
            image: outline.image || outline.imageUrl || null,
            layout: slide.layout || outline.layout || outline.type || 'split_right',
            imagePrompt: outline.imageQuery || outline.imagePrompt || '',
            visual_type: slide.visual_type,
            visual_content: slide.visual_content,
            theme: codeDrivenDeck.theme
          };
        });

        console.log(`Generated ${slides.length} code-driven slides`);
        return NextResponse.json({
          slides,
          theme: codeDrivenDeck.theme,
          mode: 'code-driven'
        });
      } catch (codeDrivenError) {
        console.error('Code-driven generation failed:', codeDrivenError);
        
        // Check for API configuration issues
        if (!process.env.NEBIUS_API_KEY) {
          return NextResponse.json(
            { error: 'NEBIUS_API_KEY is not configured. Please add it to your .env.local file. Get a free key at: https://tokenfactory.nebius.com/', status: 500 }
          );
        }
        
        // Handle 404 errors (invalid API key or model)
        if (codeDrivenError instanceof Error && codeDrivenError.message.includes('404')) {
          return NextResponse.json(
            { error: 'Nebius API returned 404. This usually means your API key is invalid or the model is unavailable. Please check your NEBIUS_API_KEY in .env.local.', status: 500 }
          );
        }
        
        const message = codeDrivenError instanceof Error ? codeDrivenError.message : 'Unknown Qwen generation error';
        return NextResponse.json(
          { error: `Qwen code-driven generation failed: ${message}` },
          { status: 502 }
        );
      }
    }

    const slides = mapLegacySlides(outlines);

    console.log(`Processed ${slides.length} slides with legacy transform`);
    return NextResponse.json({ slides, mode: 'legacy' });
  } catch (error) {
    console.error('Error processing presentation:', error);
    return NextResponse.json(
      { error: 'Failed to process presentation' },
      { status: 500 }
    );
  }
}
