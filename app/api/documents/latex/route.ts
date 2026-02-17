import { NextRequest, NextResponse } from 'next/server';
import { createRoute } from '@/lib/supabase/server';
import { generateDocumentLatex } from '@/lib/documents/latex-generator';

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
    const { documentId, title, documentType, sections } = body;

    if (!documentId || !title || !sections) {
      return NextResponse.json(
        { error: 'Document ID, title, and sections are required' },
        { status: 400 }
      );
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate LaTeX code
    const latexCode = generateDocumentLatex({
      title,
      documentType: documentType || 'document',
      sections,
      author: user.user_metadata?.full_name || user.email || 'DraftDeckAI User',
      date: new Date().toLocaleDateString(),
    });

    // Return as downloadable file
    return new NextResponse(latexCode, {
      headers: {
        'Content-Type': 'application/x-tex',
        'Content-Disposition': `attachment; filename="${title.replace(/[^a-zA-Z0-9]/g, '_')}.tex"`,
      },
    });

  } catch (error) {
    console.error('Error in POST /api/documents/latex:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
