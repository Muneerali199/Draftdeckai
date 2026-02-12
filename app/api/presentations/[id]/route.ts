export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the presentation
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('type', 'presentation')
      .single();

    if (error || !data) {
      console.error('Error fetching presentation:', error);
      return NextResponse.json(
        { error: 'Presentation not found' },
        { status: 404 }
      );
    }

    // Check if presentation is public or user has access
    const content = data.content as any;
    if (!content?.isPublic) {
      // In a real app, you'd check if the user owns this presentation
      return NextResponse.json(
        { error: 'Presentation is private' },
        { status: 403 }
      );
    }

    // Return presentation data
    const resolvedThemeId = content.themeId || content.template || 'peach';

    return NextResponse.json({
      id: data.id,
      title: data.title,
      slides: content.slides || [],
      template: resolvedThemeId,
      themeId: resolvedThemeId,
      created_at: data.created_at,
      user_id: data.user_id
    });
  } catch (error) {
    console.error('Error in presentation view API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
