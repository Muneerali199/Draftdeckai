import { NextRequest, NextResponse } from 'next/server';
import { createRoute } from '@/lib/supabase/server';

export async function GET(
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

    // Fetch document to check ownership
    const { data: document } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (document.user_id !== user.id) {
      const { data: permission } = await supabase
        .from('share_permissions')
        .select('*')
        .eq('document_id', params.id)
        .eq('shared_with', user.id)
        .single();

      if (!permission) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Fetch versions
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', params.id)
      .order('version_number', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      );
    }

    return NextResponse.json(versions);

  } catch (error) {
    console.error('Error in GET /api/documents/[id]/versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { content, change_summary } = body;

    // Fetch document to check ownership
    const { data: document } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!document) {
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

    // Get next version number
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    // Create version
    const { data: version, error } = await supabase
      .from('document_versions')
      .insert({
        document_id: params.id,
        version_number: versionNumber,
        content: content,
        change_summary: change_summary || 'Manual save',
        created_by: user.id,
        created_by_name: user.user_metadata?.full_name || user.email || 'Anonymous',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating version:', error);
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json(version);

  } catch (error) {
    console.error('Error in POST /api/documents/[id]/versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
