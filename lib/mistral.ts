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
        // If standard parsing fails, try to clean newlines in strings which is common invalid JSON from LLMs
        // This is a naive cleanup but helps with unescaped newlines in values
        try {
          // Replace unescaped newlines within quotes? Hard to do safely with regex.
          // Let's try to just log for now, usually the brace extraction allows it to work if it was just surrounded by text.
          console.warn(`JSON parsing failed after extraction for ${context}. Raw:`, jsonStr.substring(0, 100) + '...');
        } catch (e4) { }
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
 * Generate presentation text content using Mistral AI
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
    const prompt = `Create a professional presentation outline for: "${topic}"

Generate ${pageCount} slides with:
1. Cover slide with engaging title
2. Content slides with clear structure
3. Conclusion slide

Return ONLY a JSON array with this structure:
[
  {
    "title": "Engaging Title",
    "type": "title|content|conclusion|chart",
    "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "content": "Optional paragraph content",
    "notes": "Speaker notes"
  }
]

Guidelines:
- Use professional, clear language
- Make bullet points concise and impactful
- Mix different types for visual variety
- Ensure logical flow between slides`;

    const response = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 3000,
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

        // If too few slides, generate filler slides based on topic using helper
        while (parsedSlides.length < pageCount) {
          parsedSlides.push(createMistralFillerSlide(parsedSlides.length + 1, pageCount, topic));
        }
      }

      return parsedSlides;
    }
    return [];
  } catch (error) {
    console.error('Error generating presentation text with Mistral:', error);
    throw error;
  }
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
    const systemPrompt = `You are an expert diagram designer. Generate a professional ${diagramType} diagram using Mermaid syntax.

USER REQUEST: ${prompt}
DIAGRAM TYPE: ${diagramType}

Return ONLY valid JSON:
{
  "type": "${diagramType}",
  "title": "Descriptive title for the diagram",
  "description": "Brief explanation of what the diagram shows",
  "code": "Valid Mermaid syntax code",
  "suggestions": [
    "Improvement suggestion 1",
    "Enhancement suggestion 2"
  ]
}

MERMAID SYNTAX GUIDELINES:

For FLOWCHART:
- Use "flowchart TD" (top-down) or "flowchart LR" (left-right)
- Nodes: A[Rectangle], B{Diamond/Decision}, C((Circle)), D>Flag]
- Connections: A --> B, A -.-> B (dotted), A ==> B (thick)
- Labels: A -->|Yes| B, A -->|No| C

For SEQUENCE DIAGRAM:
- Use "sequenceDiagram"
- participant A as Alice
- A->>B: Message
- A-->>B: Response (dotted)
- activate A / deactivate A

For CLASS DIAGRAM:
- Use "classDiagram"
- class Animal { +String name +makeSound() }
- Animal <|-- Dog (inheritance)

For ER DIAGRAM:
- Use "erDiagram"
- CUSTOMER ||--o{ ORDER : places
- CUSTOMER { string name string email }

For STATE DIAGRAM:
- Use "stateDiagram-v2"
- [*] --> State1
- State1 --> State2

For GANTT CHART:
- Use "gantt"
- dateFormat YYYY-MM-DD
- section Section Name
- Task Name :done, a1, 2024-01-01, 30d

For PIE CHART:
- Use "pie title Chart Title"
- "Label" : value

For MINDMAP:
- Use "mindmap"
- root((Central Idea))

For TIMELINE:
- Use "timeline"
- title Timeline Title
- 2024 : Event Description

REQUIREMENTS:
1. Generate syntactically correct Mermaid code
2. Make it relevant to the user's request
3. Use clear, professional naming
4. Ensure visual clarity and logic`;

    const response = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    let content = response.choices?.[0]?.message?.content || '{}';
    if (Array.isArray(content)) content = content.join('');
    if (typeof content !== 'string') content = String(content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse diagram response');
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
