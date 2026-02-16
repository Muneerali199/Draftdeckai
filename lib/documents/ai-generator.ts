/**
 * DraftDeckAI Productivity Engine - AI Document Generator
 * Generates structured documents with context awareness and visuals using Mistral AI
 */

import { 
  DocumentType, 
  DocumentInput, 
  GeneratedDocument, 
  DocumentOutline, 
  DocumentSection,
  ContextFile,
  DocumentTone,
  Citation,
  VisualTag,
} from '@/types/documents';
import { getBlueprint, getDefaultTone } from './blueprints';
import { extractVisualTags, parseMermaidFromResponse, createVisualTagFromMermaid, ParsedVisual } from './visual-tagging';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export interface GenerationOptions {
  documentType: DocumentType;
  input: DocumentInput;
  contextFiles?: ContextFile[];
  tone?: DocumentTone;
}

export interface OutlineOptions {
  documentType: DocumentType;
  input: DocumentInput;
  contextFiles?: ContextFile[];
}

/**
 * Call Mistral API
 */
async function callMistral(prompt: string, model: string = 'mistral-large-latest'): Promise<string> {
  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generate document outline based on blueprint
 */
export async function generateOutline(options: OutlineOptions): Promise<DocumentOutline> {
  const { documentType, input, contextFiles = [] } = options;
  const blueprint = getBlueprint(documentType);
  
  // Build context string from uploaded files
  const contextString = buildContextString(contextFiles);
  
  const prompt = `Create a detailed outline for a ${blueprint.name}.

Input Data:
${JSON.stringify(input, null, 2)}

Context from uploaded files:
${contextString}

Blueprint Structure:
${blueprint.sections.map(s => `${s.order}. ${s.title}: ${s.description}`).join('\n')}

Generate an outline with:
1. A compelling title
2. All required sections in order
3. Brief descriptions for each section
4. Where visuals should be included (indicate with [VISUAL: type] in description)

Return ONLY a JSON object with this structure:
{
  "title": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "description": "string (include [VISUAL: type] where appropriate)",
      "order": number
    }
  ]
}`;

  try {
    const response = await callMistral(prompt, 'mistral-large-latest');
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse outline response');
    
    const outlineData = JSON.parse(jsonMatch[0]);
    
    return {
      id: `outline-${Date.now()}`,
      title: outlineData.title,
      documentType,
      sections: outlineData.sections,
      approved: false,
    };
  } catch (error) {
    console.error('Error generating outline:', error);
    throw new Error('Failed to generate document outline');
  }
}

/**
 * Generate full document based on approved outline
 */
export async function generateDocument(options: GenerationOptions): Promise<GeneratedDocument> {
  const { documentType, input, contextFiles = [], tone: customTone } = options;
  const blueprint = getBlueprint(documentType);
  const tone = customTone || getDefaultTone(documentType);
  
  // First generate outline
  const outline = await generateOutline({ documentType, input, contextFiles });
  
  // Build context string
  const contextString = buildContextString(contextFiles);
  
  // Generate each section
  const sections: DocumentSection[] = [];
  const citations: Citation[] = [];
  
  for (const blueprintSection of blueprint.sections) {
    const section = await generateSection({
      blueprintSection,
      input,
      contextString,
      tone,
      contextFiles,
    });
    
    sections.push(section);
    
    // Extract citations from section content
    const sectionCitations = extractCitations(section.content, contextFiles);
    citations.push(...sectionCitations);
  }
  
  return {
    id: `doc-${Date.now()}`,
    title: outline.title,
    documentType,
    tone,
    outline,
    sections,
    contextFiles,
    citations,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

interface GenerateSectionOptions {
  blueprintSection: {
    id: string;
    title: string;
    description: string;
    order: number;
    optional?: boolean;
    visualTypes?: string[];
    promptTemplate: string;
  };
  input: DocumentInput;
  contextString: string;
  tone: DocumentTone;
  contextFiles: ContextFile[];
}

/**
 * Generate a single document section
 */
async function generateSection(options: GenerateSectionOptions): Promise<DocumentSection> {
  const { blueprintSection, input, contextString, tone, contextFiles } = options;
  
  // Replace template variables
  let prompt = blueprintSection.promptTemplate
    .replace('{{context}}', contextString)
    .replace('{{tone}}', tone);
  
  // Replace input variables
  Object.entries(input).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value || ''));
  });
  
  // Add tone-specific instructions
  prompt += getToneInstructions(tone);
  
  try {
    const content = await callMistral(prompt, 'mistral-large-latest');

    // Extract visual tags from content
    const { content: cleanedContent, visuals: parsedVisuals } = extractVisualTags(content);

    // Convert ParsedVisual[] to VisualTag[]
    const visualTags: VisualTag[] = parsedVisuals.map((v, idx) => ({
      id: `visual-${Date.now()}-${idx}`,
      type: v.type,
      title: v.title,
      description: v.content,
      mermaidCode: v.mermaidCode,
      chartData: v.chartData,
    }));

    // Process any mermaid diagrams in the content
    const mermaidCode = parseMermaidFromResponse(content);
    if (mermaidCode) {
      visualTags.push(createVisualTagFromMermaid('flowchart', mermaidCode, 'Generated Diagram'));
    }

    return {
      id: blueprintSection.id,
      title: blueprintSection.title,
      content: cleanedContent,
      order: blueprintSection.order,
      visualTags: visualTags,
    };
  } catch (error) {
    console.error(`Error generating section ${blueprintSection.id}:`, error);
    return {
      id: blueprintSection.id,
      title: blueprintSection.title,
      content: `Error generating section: ${blueprintSection.title}`,
      order: blueprintSection.order,
    };
  }
}

/**
 * Build context string from uploaded files
 */
function buildContextString(contextFiles: ContextFile[]): string {
  if (contextFiles.length === 0) return 'No context files provided.';
  
  return contextFiles.map((file, index) => `
[Source ${index + 1}: ${file.name}]
Type: ${file.type}
Content:
${file.content.substring(0, 5000)}${file.content.length > 5000 ? '...' : ''}
`).join('\n---\n');
}

/**
 * Get tone-specific instructions
 */
function getToneInstructions(tone: DocumentTone): string {
  switch (tone) {
    case 'startup':
      return `

Tone Instructions (Startup Mode):
- Use punchy, short sentences
- Active voice
- Heavy use of bullet points
- Enthusiastic and energetic language
- Focus on innovation and disruption
- Use emojis sparingly for emphasis`;
    
    case 'academic':
      return `

Tone Instructions (Academic Mode):
- Use passive voice where appropriate
- Formal vocabulary
- Strict paragraph structure
- Evidence-based arguments
- Objective and impartial tone
- Proper citations required`;
    
    case 'professional':
      return `

Tone Instructions (Professional Mode):
- Clear and concise language
- Balanced mix of active and passive voice
- Structured paragraphs
- Business-appropriate terminology
- Confident but not arrogant
- Focus on results and outcomes`;
    
    case 'casual':
      return `

Tone Instructions (Casual Mode):
- Conversational tone
- Short sentences
- Friendly and approachable
- Use contractions
- Minimal jargon
- Engaging and relatable`;
    
    default:
      return '';
  }
}

/**
 * Extract citations from content
 */
function extractCitations(content: string, contextFiles: ContextFile[]): Citation[] {
  const citations: Citation[] = [];
  const citationRegex = /\[source:\s*([^\]]+)\]/gi;
  let match;
  
  while ((match = citationRegex.exec(content)) !== null) {
    const sourceName = match[1].trim();
    const contextFile = contextFiles.find(f => f.name === sourceName);
    
    citations.push({
      id: `cite-${Date.now()}-${citations.length}`,
      source: sourceName,
      content: match[0],
      contextFileId: contextFile?.id,
    });
  }
  
  return citations;
}

/**
 * Regenerate a specific section
 */
export async function regenerateSection(
  document: GeneratedDocument,
  sectionId: string,
  feedback?: string
): Promise<GeneratedDocument> {
  const blueprint = getBlueprint(document.documentType);
  const blueprintSection = blueprint.sections.find(s => s.id === sectionId);
  
  if (!blueprintSection) {
    throw new Error('Section not found');
  }
  
  const contextString = buildContextString(document.contextFiles);
  
  // Find input from document (this is simplified - in real implementation, store input)
  const input = {} as DocumentInput; // Would need to store and retrieve original input
  
  const newSection = await generateSection({
    blueprintSection,
    input,
    contextString,
    tone: document.tone,
    contextFiles: document.contextFiles,
  });
  
  // Update section in document
  const updatedSections = document.sections.map(s => 
    s.id === sectionId ? newSection : s
  );
  
  return {
    ...document,
    sections: updatedSections,
    updatedAt: new Date(),
  };
}

/**
 * Update document outline
 */
export function updateOutline(
  outline: DocumentOutline,
  updates: Partial<DocumentOutline>
): DocumentOutline {
  return {
    ...outline,
    ...updates,
  };
}

/**
 * Approve outline and mark it ready for content generation
 */
export function approveOutline(outline: DocumentOutline): DocumentOutline {
  return {
    ...outline,
    approved: true,
  };
}
