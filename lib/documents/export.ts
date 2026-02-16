/**
 * DraftDeckAI Productivity Engine - Document Export
 * Exports generated documents to various formats
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { GeneratedDocument, DocumentSection, VisualTag } from '@/types/documents';

export type ExportFormat = 'docx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeVisuals?: boolean;
  includeCitations?: boolean;
}

/**
 * Export document to specified format
 */
export async function exportDocument(
  document: GeneratedDocument,
  options: ExportOptions
): Promise<void> {
  switch (options.format) {
    case 'docx':
      await exportToDocx(document, options);
      break;
    case 'pdf':
      await exportToPdf(document, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Export to DOCX format
 */
async function exportToDocx(document: GeneratedDocument, options: ExportOptions): Promise<void> {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: document.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Document type and date
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Document Type: ${formatDocumentType(document.documentType)}`,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${document.createdAt.toLocaleDateString()}`,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Sections
  document.sections.forEach((section) => {
    // Section heading
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Section content
    const contentParagraphs = parseContentToParagraphs(section.content);
    children.push(...contentParagraphs);

    // Visuals
    if (options.includeVisuals && section.visualTags && section.visualTags.length > 0) {
      section.visualTags.forEach((visual) => {
        children.push(...createVisualParagraphs(visual));
      });
    }
  });

  // Citations
  if (options.includeCitations && document.citations.length > 0) {
    children.push(
      new Paragraph({
        text: 'References',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 },
      })
    );

    document.citations.forEach((citation) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[${citation.id}] ${citation.source}`,
              size: 20,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    });
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Generate blob and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${sanitizeFilename(document.title)}.docx`);
}

/**
 * Export to PDF format (using browser print to PDF)
 */
async function exportToPdf(document: GeneratedDocument, options: ExportOptions): Promise<void> {
  // Create HTML content for PDF
  const htmlContent = generatePdfHtml(document, options);

  // Open in new window and print
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Please allow popups to export PDF');
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * Generate HTML for PDF export
 */
function generatePdfHtml(document: GeneratedDocument, options: ExportOptions): string {
  const sectionsHtml = document.sections
    .map((section) => {
      const visualsHtml =
        options.includeVisuals && section.visualTags
          ? section.visualTags
              .map((visual) => `
            <div class="visual-placeholder" style="border: 1px dashed #ccc; padding: 20px; margin: 20px 0; text-align: center; background: #f9f9f9;">
              <p style="color: #666; margin: 0;">[${visual.title}]</p>
              <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">${visual.type} diagram would be rendered here</p>
            </div>
          `)
              .join('')
          : '';

      return `
        <div class="section" style="margin-bottom: 40px;">
          <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
            ${section.title}
          </h2>
          <div class="content" style="line-height: 1.6; color: #444;">
            ${formatContentForHtml(section.content)}
          </div>
          ${visualsHtml}
        </div>
      `;
    })
    .join('');

  const citationsHtml =
    options.includeCitations && document.citations.length > 0
      ? `
      <div class="citations" style="margin-top: 60px; border-top: 2px solid #333; padding-top: 20px;">
        <h2 style="color: #333;">References</h2>
        <ul style="line-height: 1.8; color: #444;">
          ${document.citations
            .map((c) => `<li>[${c.id}] ${c.source}</li>`)
            .join('')}
        </ul>
      </div>
    `
      : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${document.title}</title>
      <meta charset="UTF-8">
      <style>
        @page { margin: 2cm; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        h1 { text-align: center; color: #1a1a1a; }
        .subtitle { text-align: center; color: #666; font-style: italic; margin-bottom: 40px; }
        h2 { color: #2c2c2c; }
        ul, ol { margin-left: 20px; }
        p { margin-bottom: 12px; }
        strong { color: #1a1a1a; }
      </style>
    </head>
    <body>
      <h1>${document.title}</h1>
      <div class="subtitle">
        <p>Document Type: ${formatDocumentType(document.documentType)}</p>
        <p>Generated: ${document.createdAt.toLocaleDateString()}</p>
      </div>
      
      ${sectionsHtml}
      
      ${citationsHtml}
    </body>
    </html>
  `;
}

/**
 * Parse markdown-like content to Word paragraphs
 */
function parseContentToParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n');

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      // Empty line - add spacing
      return;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 150 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    }
    // Bullet points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.substring(2),
          bullet: { level: 0 },
          spacing: { after: 100 },
        })
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      paragraphs.push(
        new Paragraph({
          text,
          numbering: { reference: 'my-numbering', level: 0 },
          spacing: { after: 100 },
        })
      );
    }
    // Regular paragraph
    else {
      // Parse inline formatting
      const children = parseInlineFormatting(trimmed);
      paragraphs.push(
        new Paragraph({
          children,
          spacing: { after: 150 },
        })
      );
    }
  });

  return paragraphs;
}

/**
 * Parse inline formatting (bold, italic)
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Simple parsing - can be enhanced
  runs.push(new TextRun({ text, size: 22 }));
  return runs;
}

/**
 * Create paragraphs for visual elements
 */
function createVisualParagraphs(visual: VisualTag): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Visual title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `[${visual.title}]`,
          italics: true,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  // Placeholder for visual
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `[${visual.type.toUpperCase()} DIAGRAM - See visual in online version]`,
          italics: true,
          color: '666666',
        }),
      ],
      spacing: { after: 200 },
    })
  );

  return paragraphs;
}

/**
 * Format content for HTML export
 */
function formatContentForHtml(content: string): string {
  return content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\* \* \*$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|l])(.+)$/gm, '<p>$1</p>');
}

/**
 * Format document type for display
 */
function formatDocumentType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sanitize filename
 */
function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Preview document as HTML (for in-app viewing)
 */
export function generateDocumentPreview(document: GeneratedDocument): string {
  return generatePdfHtml(document, { format: 'pdf', includeVisuals: true, includeCitations: true });
}
