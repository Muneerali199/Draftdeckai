import { NextRequest, NextResponse } from 'next/server';
import { createRoute } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { instruction, sectionId, content } = body;

    if (!instruction) {
      return NextResponse.json(
        { error: 'Improvement instruction is required' },
        { status: 400 }
      );
    }

    // Get the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (document.user_id !== user.id) {
      const { data: permission } = await supabase
        .from('share_permissions')
        .select('permission_level')
        .eq('document_id', params.id)
        .eq('shared_with', user.id)
        .single();

      if (!permission || permission.permission_level === 'view') {
        return NextResponse.json(
          { error: 'Edit permission required' },
          { status: 403 }
        );
      }
    }

    // Call Mistral API to improve the content
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
    const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

    const currentContent = content || document.content;
    const documentType = document.document_type || document.type;

    const prompt = `Improve the following document content based on this instruction: "${instruction}"

Document Type: ${documentType}
Document Title: ${document.title}

Current Content:
${typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2)}

Please provide an improved version that addresses the instruction while maintaining the document's structure and professional tone. Return ONLY the improved content without any additional commentary.`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
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
      console.error('Mistral API error:', error);
      return NextResponse.json(
        { error: 'Failed to improve document with AI' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const improvedContent = data.choices?.[0]?.message?.content || '';

    // Create a version before updating
    const { data: versionData } = await supabase
      .rpc('get_next_version_number', { doc_id: params.id });
    
    await supabase
      .from('document_versions')
      .insert({
        document_id: params.id,
        user_id: user.id,
        version_number: versionData || 1,
        content: document.content,
        change_summary: `AI Improvement: ${instruction}`,
        created_at: new Date().toISOString()
      });

    // Update the document with improved content
    let updatedContent = document.content;
    if (sectionId && document.metadata?.sections) {
      // Update specific section
      const sections = document.metadata.sections.map((section: any) => {
        if (section.id === sectionId) {
          return { ...section, content: improvedContent };
        }
        return section;
      });
      updatedContent = { ...document.content, sections };
    } else {
      // Update entire content
      updatedContent = improvedContent;
    }

    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update({
        content: updatedContent,
        metadata: {
          ...document.metadata,
          last_improved_at: new Date().toISOString(),
          improvement_instruction: instruction,
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to save improved document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      document: updatedDocument,
      improvedContent,
      message: 'Document improved successfully'
    });

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/improve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
