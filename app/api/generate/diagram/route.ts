export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { generateDiagramWithMistral } from '@/lib/mistral';
import { createClient } from '@supabase/supabase-js';
import { ACTION_COSTS, TIER_LIMITS, getCreditsResetDate, shouldResetCredits, calculateRemainingCredits, hasUnlimitedDeveloperCredits } from '@/lib/credits-service';

// Service role client for credit operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // ✅ AUTHENTICATION CHECK
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create diagrams.' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to create diagrams.' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    const body = await request.json();
    const { prompt, diagramType = 'flowchart' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Check user credits
    const creditCost = ACTION_COSTS.diagram;
    
    // Get or create user credits
    let { data: userCredits } = await supabaseAdmin
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record exists, create one
    if (!userCredits) {
      const { data: newCredits, error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({
          user_id: user.id,
          tier: 'free',
          credits_total: TIER_LIMITS.free,
          credits_used: 0,
          credits_reset_at: getCreditsResetDate()
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to create credits record:', insertError);
        return NextResponse.json(
          { error: 'Failed to initialize credits' },
          { status: 500 }
        );
      }
      userCredits = newCredits;
    }

    // Check if credits need reset
    if (userCredits && shouldResetCredits(userCredits.credits_reset_at)) {
      const resetAt = getCreditsResetDate();
      const { data: updatedCredits } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetAt,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedCredits) {
        userCredits = updatedCredits;
      }
    }

    // Check if user has enough credits
    const creditsRemaining = hasUnlimitedCredits
      ? Number.MAX_SAFE_INTEGER
      : calculateRemainingCredits(userCredits.credits_total, userCredits.credits_used);
    
    if (!hasUnlimitedCredits && creditsRemaining < creditCost) {
      return NextResponse.json(
        { 
          error: 'Not enough credits',
          message: `You need ${creditCost} credits to generate a diagram. You have ${creditsRemaining} credits remaining.`,
          needsUpgrade: true,
          currentTier: userCredits.tier,
          creditsRemaining
        },
        { status: 402 }
      );
    }

    console.log(`📊 Generating ${diagramType} diagram with Mistral...`);
    
    let diagram;
    try {
      diagram = await generateDiagramWithMistral({ prompt, diagramType });
    } catch (genError) {
      console.error('Diagram generation failed:', genError);
      const errorMsg = genError instanceof Error ? genError.message : 'Unknown error during generation';
      return NextResponse.json(
        { 
          error: 'Diagram generation failed',
          message: errorMsg.includes('parse') ? 'Invalid response format from AI. Please try again with a different description.' : errorMsg,
          details: errorMsg,
          hint: 'Try being more specific in your description or use shorter text for labels.'
        },
        { status: 500 }
      );
    }
    
    // Validate diagram response
    if (!diagram || !diagram.code) {
      console.error('Invalid diagram response:', diagram);
      return NextResponse.json(
        { 
          error: 'Invalid diagram response',
          message: 'The AI did not generate valid diagram code. Please try again with a simpler description.',
          details: 'Missing code field in response',
          hint: 'Try: "Simple flowchart with 5 steps for user login process"'
        },
        { status: 500 }
      );
    }

    // Validate Mermaid syntax
    const diagramCode = diagram.code.trim();
    const validDiagramTypes = ['flowchart', 'graph', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline'];
    const hasValidStart = validDiagramTypes.some(type => diagramCode.toLowerCase().startsWith(type.toLowerCase()));
    
    if (!hasValidStart) {
      console.error('Invalid diagram type in code:', diagramCode.substring(0, 50));
      return NextResponse.json(
        { 
          error: 'Invalid diagram syntax',
          message: `Diagram must start with one of: ${validDiagramTypes.join(', ')}`,
          details: `Generated code starts with: ${diagramCode.substring(0, 30)}...`,
          hint: 'Regenerate or manually edit to start with a valid diagram type.'
        },
        { status: 422 }
      );
    }

    // Basic syntax validation
    if (diagramCode.length < 10) {
      return NextResponse.json(
        { 
          error: 'Diagram too short',
          message: 'Generated diagram is too simple. Please provide a more detailed description.',
          hint: 'Try a more detailed prompt, for example: "Create a flowchart for an ecommerce checkout process"'
        },
        { status: 422 }
      );
    }
    
    console.log('✅ Diagram generated successfully with Mistral');
    
    // ✅ DEDUCT CREDITS after successful generation
    if (!hasUnlimitedCredits) {
      const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({ 
          credits_used: userCredits.credits_used + creditCost,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to deduct credits:', updateError);
        // Don't fail the request, just log the error
      } else {
        // Log the usage
        await supabaseAdmin
          .from('credit_usage_log')
          .insert({
            user_id: user.id,
            action: 'diagram',
            credits_used: creditCost,
            metadata: { diagram_type: diagramType, prompt_length: prompt.length }
          });
        
        console.log(`💳 Deducted ${creditCost} credits for diagram generation`);
      }
    }
    
    return NextResponse.json(diagram);
  } catch (error) {
    console.error('Error generating diagram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to generate diagram',
        message: 'An unexpected error occurred. Please try again.',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
