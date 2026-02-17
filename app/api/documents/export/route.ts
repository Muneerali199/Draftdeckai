import { NextRequest, NextResponse } from 'next/server';
import { createRoute } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRoute();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { documentId, format, content } = body;

    if (!documentId || !format || !content) {
      return NextResponse.json(
        { error: 'Document ID, format, and content are required' },
        { status: 400 }
      );
    }

    // Fetch the document to verify ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate export content based on format
    let exportContent: string | Buffer;
    let contentType: string;
    let fileExtension: string;

    if (format === 'pdf') {
      // For now, return HTML that can be printed to PDF
      exportContent = generateHTML(content);
      contentType = 'text/html';
      fileExtension = 'html';
    } else if (format === 'docx') {
      // For now, return markdown that can be converted to DOCX
      exportContent = generateMarkdown(content);
      contentType = 'text/markdown';
      fileExtension = 'md';
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }

    return new NextResponse(exportContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${content.title}.${fileExtension}"`,
      },
    });

  } catch (error) {
    console.error('Error in POST /api/documents/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateHTML(content: any): string {
  const { title, sections } = content;
  
  const sectionsHTML = sections?.map((section: any) => `
    <div class="section" style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #1a1a1a;">
        ${section.title}
      </h2>
      <div style="line-height: 1.6; color: #333; white-space: pre-wrap;">
        ${section.content}
      </div>
    </div>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 2rem;
      color: #1a1a1a;
    }
    .section {
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${sectionsHTML}
</body>
</html>
  `.trim();
}

function generateMarkdown(content: any): string {
  const { title, sections } = content;
  
  const sectionsMarkdown = sections?.map((section: any) => `
## ${section.title}

${section.content}

`).join('') || '';

  return `# ${title}

${sectionsMarkdown}`;
}
