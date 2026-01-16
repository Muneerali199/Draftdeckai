import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.warn('MISTRAL_API_KEY is not set in environment variables');
}

const mistral = apiKey ? new Mistral({ apiKey }) : null;

export interface ImageDescription {
  slideNumber: number;
  description: string;
  searchQuery: string;
}

export interface ChartData {
  slideNumber: number;
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

/**
 * Helper to generate a filler slide with a consistent structure
 * 
 * This function is called when the Mistral AI generates fewer slides than requested,
 * padding the presentation to reach the correct slide count.
 * 
 * @param slideNumber - The 1-based index of the slide being created
 * @param pageCount - The total number of slides expected in the presentation
 * @param topic - The presentation topic for contextual content generation
 * @returns A slide object with slideNumber, title, type, bulletPoints, content, and notes
 */
function createMistralFillerSlide(slideNumber: number, pageCount: number, topic: string) {
  return {
    slideNumber,
    title: slideNumber === 1 ? `Presentation on ${topic}` : (slideNumber === pageCount ? 'Summary' : `Additional Point ${slideNumber}`),
    type: slideNumber === 1 ? 'title' : (slideNumber === pageCount ? 'conclusion' : 'content'),
    bulletPoints: ['Supporting detail', 'Further explanation', 'Key takeaway'],
    content: `Additional information related to ${topic}`,
    notes: 'Speaker notes',
  };
}

/**
 * Helper to safely extract and parse JSON from AI response
 * Handles markdown code blocks, preamble text, and potential truncation
 */
function extractAndParseJSON(content: string, context: string = ''): any {
  if (!content) return null;

  try {
    // 1. Try parsing directly
    return JSON.parse(content);
  } catch (e) {
    // 2. Extract from Markdown code blocks (```json ... ```)
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        // Continue to regex extraction
      }
    }

    // 3. Extract using brace matching (finding the first { and last })
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const jsonStr = content.substring(jsonStart, jsonEnd + 1);
      try {
        return JSON.parse(jsonStr);
      } catch (e3) {
        // If standard parsing fails after brace extraction, log the failure for troubleshooting.
        // Usually the brace extraction allows it to work if it was just surrounded by non-JSON text.
        console.warn(`JSON parsing failed after extraction for ${context}. Raw:`, jsonStr.substring(0, 100) + '...');
      }
    }
  }

  // Fallback: If we assume the entire content IS the "content" field of a JSON object (rescue mode)
  // Only valid if we expected a specific structure. For now return null.
  console.error(`Failed to extract valid JSON from ${context} response. length: ${content.length}`);
  return null;
}

/**
 * Generate image descriptions for presentation slides using Mistral AI
 */
export async function generateImageDescriptions(
  slideOutlines: any[],
  topic: string
): Promise<ImageDescription[]> {
  if (!mistral) {
    console.error('Mistral client not initialized');
    return [];
  }

  try {
    const prompt = `You are a professional presentation designer. Generate HIGHLY SPECIFIC and CONTEXTUAL image search queries for a presentation about "${topic}".

Slide Outlines:
${slideOutlines.map((slide, idx) => `
Slide ${idx + 1}: ${slide.title}
Content: ${slide.content || slide.bulletPoints?.join(', ') || ''}
Context: ${slide.context || topic}
`).join('\n')}

IMPORTANT: Each search query MUST be:
1. HIGHLY SPECIFIC to both the MAIN TOPIC ("${topic}") AND the slide content
2. Include 3-5 relevant keywords that directly relate to the subject matter
3. Professional and suitable for stock photography
4. Different from other slides to ensure variety

Return ONLY a JSON array (no markdown, no explanations):
[
  {
    "slideNumber": 1,
    "description": "Detailed visual description",
    "searchQuery": "${topic.split(' ').slice(0, 2).join(' ')} [specific-keywords-from-slide-title]"
  }
]

Example for topic "Artificial Intelligence":
- Slide 1 (Introduction): "artificial intelligence technology futuristic network"
- Slide 2 (Benefits): "artificial intelligence benefits business automation"
- Slide 3 (Applications): "artificial intelligence healthcare medical diagnosis"

Make each query UNIQUE and HIGHLY RELEVANT to both the presentation topic AND the specific slide!`;

    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      maxTokens: 2000,
    });

    let content = response.choices?.[0]?.message?.content || '[]';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);

    // Safely extract JSON array
    const extracted = extractAndParseJSON(content, 'generateImageDescriptions');
    if (extracted && Array.isArray(extracted)) {
      return extracted;
    }

    // Fallback regex if helper failed specifically for arrays
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch (e) { }
    }
    return [];
  } catch (error) {
    console.error('Error generating image descriptions with Mistral:', error);
    return [];
  }
}

/**
 * Generate chart data for presentation slides using Mistral AI
 */
export async function generateChartData(
  slideOutlines: any[],
  topic: string
): Promise<ChartData[]> {
  if (!mistral) {
    console.error('Mistral client not initialized');
    return [];
  }

  try {
    const prompt = `You are a data visualization expert. Given the following presentation outline about "${topic}", identify which slides would benefit from charts and generate appropriate data visualizations.

Slide Outlines:
${slideOutlines.map((slide, idx) => `
Slide ${idx + 1}: ${slide.title}
Content: ${slide.bulletPoints?.join(', ') || slide.content}
`).join('\n')}

For slides that would benefit from charts (skip title, conclusion, and purely text-based slides), provide chart data.

Return ONLY a JSON array with this structure:
[
  {
    "slideNumber": 3,
    "type": "bar",
    "title": "Market Growth Comparison",
    "labels": ["2021", "2022", "2023", "2024"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [45, 59, 80, 91]
      }
    ]
  }
]

Chart types: "bar", "line", "pie", "doughnut"
Generate realistic, relevant data that supports the slide content.`;

    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    let content = response.choices?.[0]?.message?.content || '[]';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error generating chart data with Mistral:', error);
    return [];
  }
}

/**
 * Enhance slide content with visual suggestions using Mistral AI
 */
export async function enhanceSlideWithVisuals(
  slideTitle: string,
  slideContent: string,
  slideNumber: number
): Promise<{
  image?: ImageDescription;
  chart?: ChartData;
}> {
  if (!mistral) {
    console.error('Mistral client not initialized');
    return {};
  }

  try {
    const prompt = `You are a presentation design expert. For this slide, suggest appropriate visuals:

Slide ${slideNumber}: ${slideTitle}
Content: ${slideContent}

Provide:
1. An image description and search query
2. If data visualization would help, provide chart specifications

Return ONLY valid JSON:
{
  "image": {
    "slideNumber": ${slideNumber},
    "description": "...",
    "searchQuery": "..."
  },
  "chart": {
    "slideNumber": ${slideNumber},
    "type": "bar|line|pie|doughnut",
    "title": "...",
    "labels": ["..."],
    "datasets": [{"label": "...", "data": [numbers]}]
  }
}

Omit "chart" if not applicable.`;

    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 1000,
    });

    let content = response.choices?.[0]?.message?.content || '{}';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch (error) {
    console.error('Error enhancing slide with Mistral:', error);
    return {};
  }
}

/**
 * Generate presentation text content using Mistral AI - ULTRA PREMIUM VERSION
 * Creates presentations 10x better than Gamma with diverse slide types and rich content
 */
export async function generatePresentationText(
  topic: string,
  pageCount: number = 8
): Promise<any[]> {
  if (!mistral) {
    console.error('Mistral client not initialized');
    return [];
  }

  try {
    // Calculate slide type distribution for optimal variety
    const slideTypeDistribution = getSlideTypeDistribution(pageCount);

    const prompt = `You are a WORLD-CLASS presentation designer creating a PREMIUM presentation that's 10X better than Gamma or Canva.

Topic: "${topic}"
Total Slides: ${pageCount}

REQUIRED SLIDE TYPE DISTRIBUTION:
${slideTypeDistribution.map((type, i) => `Slide ${i + 1}: ${type}`).join('\n')}

Generate a JSON array of ${pageCount} slides. Each slide MUST follow this structure:

[
  {
    "slideNumber": 1,
    "type": "hero",
    "title": "Bold, Compelling Title That Hooks the Audience",
    "subtitle": "Engaging subtitle that explains the core value",
    "cta": "Action button text"
  },
  {
    "slideNumber": 2,
    "type": "stats",
    "title": "Impressive Results",
    "stats": [
      { "value": "94%", "label": "Customer Satisfaction", "context": "year over year", "trend": "up" },
      { "value": "$2.4M", "label": "Revenue Generated", "context": "this quarter", "trend": "up" },
      { "value": "10x", "label": "Faster Processing", "context": "vs competitors", "trend": "up" }
    ]
  },
  {
    "slideNumber": 3,
    "type": "comparison",
    "title": "Before vs After",
    "comparison": {
      "leftTitle": "❌ The Old Way",
      "left": ["Problem 1", "Problem 2", "Problem 3"],
      "rightTitle": "✨ The New Way",
      "right": ["Solution 1", "Solution 2", "Solution 3"],
      "highlight": "right"
    }
  },
  {
    "slideNumber": 4,
    "type": "feature-grid",
    "title": "Key Features",
    "icons": [
      { "icon": "Zap", "label": "Fast", "description": "Lightning quick processing" },
      { "icon": "Shield", "label": "Secure", "description": "Enterprise-grade security" },
      { "icon": "Globe", "label": "Global", "description": "Available worldwide" },
      { "icon": "Users", "label": "Collaborative", "description": "Team-friendly design" }
    ]
  },
  {
    "slideNumber": 5,
    "type": "data-viz",
    "title": "Growth Trajectory",
    "chartData": {
      "type": "line",
      "data": [
        { "name": "Q1", "value": 45 },
        { "name": "Q2", "value": 78 },
        { "name": "Q3", "value": 125 },
        { "name": "Q4", "value": 189 }
      ]
    }
  },
  {
    "slideNumber": 6,
    "type": "process",
    "title": "How It Works",
    "bullets": [
      "📤 Step 1: Upload your data",
      "🤖 Step 2: AI processes automatically",
      "📊 Step 3: Get instant insights",
      "🚀 Step 4: Take action"
    ]
  },
  {
    "slideNumber": 7,
    "type": "timeline",
    "title": "Our Journey",
    "timeline": [
      { "date": "2022", "title": "Founded", "description": "Started with a vision" },
      { "date": "2023", "title": "Growth", "description": "Reached 10K users" },
      { "date": "2024", "title": "Expansion", "description": "Went global" }
    ]
  },
  {
    "slideNumber": 8,
    "type": "testimonial",
    "title": "Customer Love",
    "testimonial": {
      "quote": "This completely transformed our workflow. Game changer!",
      "author": "Jane Smith",
      "role": "CEO",
      "company": "Tech Corp"
    }
  }
]

CRITICAL SLIDE TYPE GUIDELINES:

1. **hero** - Opening slide with bold title + subtitle + CTA
2. **stats** - 3-4 impressive numbers with value, label, context, trend (up/down/neutral)
3. **comparison** - Side-by-side with leftTitle, left[], rightTitle, right[], highlight
4. **feature-grid** - 3-4 features with icon name, label, description
5. **data-viz** - Chart with type (bar/line/pie) and data array [{name, value}]
6. **process** - Step-by-step bullets with emojis
7. **timeline** - Milestones with date, title, description
8. **testimonial** - Quote with author, role, company
9. **bullets** - Key points with compelling text
10. **closing** - Final CTA with stats or call-to-action

ICON OPTIONS for feature-grid: Zap, Shield, Users, Globe, Target, Rocket, Heart, Star, Check, TrendUp, Clock, Lock, Award, Lightbulb, BarChart, DollarSign, Smartphone, Cloud, Code, Palette

RULES:
1. Use SPECIFIC numbers (94% not 90%, $2.4M not $2M)
2. Each bullet max 10 words
3. Every slide must be UNIQUE and visually different
4. Create content that tells a COMPELLING STORY
5. Make stats realistic and impressive

Return ONLY the JSON array. No markdown, no explanation.`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest', // Use large model for better quality
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 5000, // Increased for richer content
    });

    let content = response.choices?.[0]?.message?.content || '[]';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsedSlides = JSON.parse(jsonMatch[0]);

      // Ensure we have the correct number of slides
      if (parsedSlides.length !== pageCount) {
        console.warn(`⚠️ AI generated ${parsedSlides.length} slides instead of ${pageCount}. Adjusting...`);

        // If too many slides, trim to pageCount
        if (parsedSlides.length > pageCount) {
          return parsedSlides.slice(0, pageCount);
        }

        // If too few slides, generate professional filler slides
        while (parsedSlides.length < pageCount) {
          const slideNum = parsedSlides.length + 1;
          parsedSlides.push(createProfessionalFillerSlide(slideNum, pageCount, topic));
        }
      }

      // Enrich slides with proper structure
      return parsedSlides.map((slide: any, index: number) => enrichSlideData(slide, index + 1, topic));
    }
    return [];
  } catch (error) {
    console.error('Error generating presentation text with Mistral:', error);
    throw error;
  }
}

/**
 * Get optimal slide type distribution based on slide count
 */
function getSlideTypeDistribution(pageCount: number): string[] {
  const distribution: string[] = [];

  // Always start with hero
  distribution.push('hero');

  // Calculate remaining slots
  let remaining = pageCount - 2; // Reserve 1 for hero, 1 for closing

  // Add diverse types based on count
  const typeRotation = [
    'stats', 'feature-grid', 'comparison', 'data-viz',
    'process', 'timeline', 'testimonial', 'bullets'
  ];

  let typeIndex = 0;
  while (remaining > 0) {
    distribution.push(typeRotation[typeIndex % typeRotation.length]);
    typeIndex++;
    remaining--;
  }

  // Always end with closing
  distribution.push('closing');

  return distribution.slice(0, pageCount);
}

/**
 * Create a professional filler slide with the correct type
 */
function createProfessionalFillerSlide(slideNumber: number, pageCount: number, topic: string): any {
  const isClosing = slideNumber === pageCount;

  if (isClosing) {
    return {
      slideNumber,
      type: 'closing',
      title: `Ready to Get Started with ${topic}?`,
      subtitle: 'Take the next step today',
      cta: 'Learn More →',
      stats: [
        { value: 'Free', label: 'Consultation', context: 'No commitment' }
      ]
    };
  }

  // Cycle through different types for variety
  const types = ['stats', 'feature-grid', 'bullets', 'process'];
  const typeIndex = (slideNumber - 2) % types.length;
  const type = types[typeIndex];

  switch (type) {
    case 'stats':
      return {
        slideNumber,
        type: 'stats',
        title: `Key Metrics for ${topic}`,
        stats: [
          { value: '85%', label: 'Success Rate', context: 'proven results', trend: 'up' },
          { value: '3x', label: 'Efficiency Gain', context: 'average improvement', trend: 'up' },
          { value: '24/7', label: 'Availability', context: 'always on', trend: 'neutral' }
        ]
      };
    case 'feature-grid':
      return {
        slideNumber,
        type: 'feature-grid',
        title: `Why Choose ${topic}`,
        icons: [
          { icon: 'Check', label: 'Reliable', description: 'Trusted by thousands' },
          { icon: 'Zap', label: 'Fast', description: 'Quick implementation' },
          { icon: 'Shield', label: 'Secure', description: 'Enterprise-grade' }
        ]
      };
    case 'process':
      return {
        slideNumber,
        type: 'process',
        title: `Getting Started with ${topic}`,
        bullets: [
          '📋 Step 1: Define your goals',
          '🔍 Step 2: Assess your needs',
          '🚀 Step 3: Implement the solution',
          '📈 Step 4: Measure results'
        ]
      };
    default:
      return {
        slideNumber,
        type: 'bullets',
        title: `More About ${topic}`,
        bulletPoints: [
          'Important consideration for success',
          'Key factor to keep in mind',
          'Best practice recommendation'
        ]
      };
  }
}

/**
 * Enrich slide data with proper structure for rendering
 */
function enrichSlideData(slide: any, slideNumber: number, topic: string): any {
  const enriched = {
    ...slide,
    slideNumber,
    // Ensure bulletPoints exists for backward compatibility
    bulletPoints: slide.bulletPoints || slide.bullets || [],
    // Convert icons format if needed
    icons: slide.icons?.map((icon: any) => ({
      icon: icon.icon || 'Star',
      label: icon.label || 'Feature',
      description: icon.description || ''
    })),
    // Ensure stats have proper format
    stats: slide.stats?.map((stat: any) => ({
      value: stat.value || '0',
      label: stat.label || 'Metric',
      context: stat.context || '',
      trend: stat.trend || 'neutral'
    })),
    // Add description for outline compatibility
    description: slide.subtitle || slide.content || getSlideDescription(slide, topic)
  };

  return enriched;
}

/**
 * Generate a description from slide content
 */
function getSlideDescription(slide: any, topic: string): string {
  if (slide.stats?.length) {
    return `Key metrics: ${slide.stats.map((s: any) => `${s.value} ${s.label}`).join(', ')}`;
  }
  if (slide.comparison) {
    return `Comparison showing benefits of the new approach`;
  }
  if (slide.timeline?.length) {
    return `Timeline with ${slide.timeline.length} key milestones`;
  }
  if (slide.icons?.length) {
    return `${slide.icons.length} key features and benefits`;
  }
  if (slide.testimonial) {
    return `Customer testimonial from ${slide.testimonial.author || 'satisfied customer'}`;
  }
  if (slide.chartData) {
    return `${slide.chartData.type} chart visualization`;
  }
  return `Professional content about ${topic}`;
}


/**
 * Generate alternative image suggestions for a slide
 */
export async function generateAlternativeImages(
  slideTitle: string,
  slideContent: string,
  count: number = 5
): Promise<ImageDescription[]> {
  if (!mistral) {
    console.error('Mistral client not initialized');
    return [];
  }

  try {
    const prompt = `Generate ${count} diverse, professional image suggestions for this slide:

Title: ${slideTitle}
Content: ${slideContent}

Return ONLY a JSON array with ${count} different image options:
[
  {
    "slideNumber": 1,
    "description": "Detailed description of professional image",
    "searchQuery": "concise search query"
  }
]

Provide variety in:
- Perspectives (close-up, wide angle, aerial)
- Styles (photography, illustration, abstract)
- Subjects (people, objects, concepts)
- Moods (energetic, calm, professional)`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9, // Higher temperature for more variety
      maxTokens: 1500,
    });

    let content = response.choices?.[0]?.message?.content || '[]';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error('Error generating alternative images with Mistral:', error);
    return [];
  }
}

/**
 * Generate professional letter using Mistral AI
 */
export async function generateLetterWithMistral({
  prompt,
  fromName,
  fromAddress,
  toName,
  toAddress,
  letterType
}: {
  prompt: string;
  fromName: string;
  fromAddress?: string;
  toName: string;
  toAddress?: string;
  letterType: string;
}) {
  if (!mistral) {
    throw new Error('Mistral client not initialized - MISTRAL_API_KEY is not set');
  }

  try {
    const systemPrompt = `You are an expert professional letter writer. Create a ${letterType} letter from ${fromName} to ${toName}.

LETTER REQUEST: ${prompt}

LETTER TYPE: ${letterType}
FROM: ${fromName}${fromAddress ? `, ${fromAddress}` : ''}
TO: ${toName}${toAddress ? `, ${toAddress}` : ''}

Generate a professional letter in JSON format:
{
  "from": {
    "name": "${fromName}",
    "address": "${fromAddress || ''}"
  },
  "to": {
    "name": "${toName}",
    "address": "${toAddress || ''}"
  },
  "date": "Current date in Month Day, Year format",
  "subject": "Clear, concise subject line",
  "content": "Full letter content with proper formatting, paragraphs, salutation, body, and closing"
}

LETTER TYPE GUIDELINES:
- Cover Letter: Highlight relevant skills/experience for job applications. Include strong opening, relevant achievements, and call to action.
- Business Letter: Formal tone, clear purpose, professional structure.
- Thank You Letter: Express sincere gratitude with specific details about what you're thankful for.
- Recommendation Letter: Highlight strengths, achievements, and qualities of the person being recommended.
- Complaint Letter: Professional tone, clear description of issue, proposed resolution.
- Resignation Letter: Professional, positive tone, clear last day, brief reason if appropriate.
- Invitation Letter: Warm tone, clear event details, RSVP information.
- Apology Letter: Sincere acknowledgment, responsibility, solution/prevention.

REQUIREMENTS:
1. Proper business letter format with salutation and closing
2. Professional, clear, and grammatically correct
3. Relevant to the specific request and letter type
4. Appropriate length and detail level

5. FORMATTING: Use Markdown formatting strictly within the content field. Use **bold** for key skills and achievements. Use bullet points * at the start of lines for lists.

Return ONLY valid JSON.`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    let content = response.choices?.[0]?.message?.content || '{}';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);

    // Extract JSON using new robust helper
    const letterData = extractAndParseJSON(content, 'generateLetterWithMistral');

    if (letterData) {
      return {
        from: {
          name: letterData.from?.name || fromName,
          address: letterData.from?.address || fromAddress || ""
        },
        to: {
          name: letterData.to?.name || toName,
          address: letterData.to?.address || toAddress || ""
        },
        date: letterData.date || new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        subject: letterData.subject || "Re: " + prompt.substring(0, 30) + "...",
        content: letterData.content || letterData.letter || "Letter content not available."
      };
    }

    // FALLBACK: If JSON parsing totally fails, assume the entire content is the letter body.
    // This is better than crashing.
    console.warn('JSON parsing failed for letter. Using raw content as fallback body.');
    return {
      from: { name: fromName, address: fromAddress || "" },
      to: { name: toName, address: toAddress || "" },
      date: new Date().toLocaleDateString('en-US'),
      subject: "Generated Letter", // Generic subject since we couldn't parse it
      content: content // The raw text from AI
    };
  } catch (error) {
    console.error('Error generating letter with Mistral:', error);
    throw error;
  }
}

/**
 * Generate diagram using Mistral AI with Mermaid syntax
 */
export async function generateDiagramWithMistral({
  prompt,
  diagramType = 'flowchart'
}: {
  prompt: string;
  diagramType?: string;
}) {
  if (!mistral) {
    throw new Error('Mistral client not initialized - MISTRAL_API_KEY is not set');
  }

  try {
    // Simplified, focused system prompt that produces reliable results
    const systemPrompt = `Generate a ${diagramType} diagram using Mermaid syntax.

USER REQUEST: ${prompt}

Return ONLY this JSON format (no markdown, no code blocks):
{"type":"${diagramType}","title":"Diagram Title","description":"What it shows","code":"mermaid code here","suggestions":["improvement 1","improvement 2"]}

QUICK RULES:
${diagramType === 'flowchart' ? `- Use: flowchart TD (or LR)
- Nodes: A[text], B{decision}, C((circle))
- Links: A --> B, A -->|label| B
- Keep simple, under 20 nodes` : ''}
${diagramType === 'sequence' ? `- Use: sequenceDiagram
- Format: participant Name
- Messages: Name1->>Name2: Message
- Keep 3-5 participants max` : ''}
${diagramType === 'classDiagram' ? `- Use: classDiagram
- Format: class Name { attributes, methods }
- Relations: A <|-- B (inheritance)` : ''}
${diagramType === 'erDiagram' ? `- Use: erDiagram
- Format: ENTITY1 ||--o{ ENTITY2 : relation
- Add attributes in braces` : ''}
${diagramType === 'stateDiagram' ? `- Use: stateDiagram-v2
- Format: [*] --> State1
- Transitions: State1 --> State2 : trigger` : ''}

CRITICAL: Generate ONLY valid, error-free Mermaid code. Test syntax mentally. No deprecated features.`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.5,
      maxTokens: 1500,
    });

    let content = response.choices?.[0]?.message?.content || '{}';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);
    
    // Clean up the response - remove markdown code blocks and extra text
    content = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[\s\S]*?(\{)/, '$1')  // Remove any text before first {
      .trim();
    
    // Extract JSON - more robust matching
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Raw content:', content.substring(0, 200));
      throw new Error(`Failed to extract JSON from response`);
    }
    
    try {
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the result has required fields
      if (!result.code || typeof result.code !== 'string') {
        throw new Error('Response missing valid diagram code field');
      }
      
      // Clean and validate the code
      const cleanCode = result.code.trim();
      if (cleanCode.length < 5) {
        throw new Error('Generated code is too short - possibly invalid');
      }
      
      // Return with cleaned code
      result.code = cleanCode;
      return result;
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0].substring(0, 100));
      throw new Error('Failed to parse diagram code from response');
    }
  } catch (error) {
    console.error('Error generating diagram with Mistral:', error);
    throw error;
  }
}

/**
 * Generate cover letter tailored to a job description using Mistral AI
 */
export async function generateCoverLetterFromJob({
  jobDescription,
  jobUrl,
  fromName,
  fromEmail,
  fromAddress,
  skills,
  experience
}: {
  jobDescription: string;
  jobUrl?: string;
  fromName: string;
  fromEmail?: string;
  fromAddress?: string;
  skills?: string[];
  experience?: string;
}) {
  if (!mistral) {
    throw new Error('Mistral client not initialized - MISTRAL_API_KEY is not set');
  }

  try {
    const systemPrompt = `You are an expert career coach and cover letter writer. Create a compelling, ATS-optimized cover letter.

JOB DESCRIPTION:
${jobDescription}

APPLICANT INFO:
Name: ${fromName}
Email: ${fromEmail || 'Not provided'}
Address: ${fromAddress || 'Not provided'}
${skills ? `Key Skills: ${skills.join(', ')}` : ''}
${experience ? `Experience Summary: ${experience}` : ''}

Generate a tailored cover letter in JSON format:
{
  "from": {
    "name": "${fromName}",
    "email": "${fromEmail || ''}",
    "address": "${fromAddress || ''}"
  },
  "to": {
    "name": "Hiring Manager",
    "company": "Extracted company name from job description",
    "address": ""
  },
  "date": "Current date",
  "subject": "Application for [Job Title]",
  "content": "Full cover letter content",
  "keywordMatch": ["list", "of", "matched", "keywords"],
  "tips": ["Improvement tip 1", "Tip 2"]
}

COVER LETTER REQUIREMENTS:
1. Strong opening hook that grabs attention
2. Match applicant skills to job requirements
3. Include specific achievements with metrics where possible
4. Show company research and genuine interest
5. Clear call to action in closing
6. Professional but personable tone
7. ATS-friendly formatting

8. FORMATTING: Use Markdown formatting strictly within the content field. Use **bold** for key skills and achievements. Use bullet points * at the start of lines for lists.

Return ONLY valid JSON.`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      maxTokens: 2500,
    });

    let content = response.choices?.[0]?.message?.content || '{}';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);

    // Use robust extraction
    const coverLetterData = extractAndParseJSON(content, 'generateCoverLetterFromJob');

    if (coverLetterData) {
      return coverLetterData;
    }

    // Fallback for cover letter (construct a valid shape from raw text)
    console.warn('JSON parsing failed for cover letter. Using raw content as fallback.');
    return {
      from: {
        name: fromName,
        email: fromEmail || "",
        address: fromAddress || ""
      },
      to: {
        name: "Hiring Manager",
        company: "Company Name",
        address: ""
      },
      date: new Date().toLocaleDateString('en-US'),
      subject: "Application for Position",
      content: content, // Raw text
      keywordMatch: [],
      tips: ["Could not extract tips due to parsing error"]
    };
  } catch (error) {
    console.error('Error generating cover letter with Mistral:', error);
    throw error;
  }
}
