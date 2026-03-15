import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TIER_LIMITS, ACTION_COSTS, TIER_NAMES, TIER_FEATURES, hasUnlimitedDeveloperCredits, type Tier, type ActionType } from '@/lib/credits-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get user's credit info
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    // Get user credits
    let { data: credits, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record, create one
    if (error?.code === 'PGRST116' || !credits) {
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);

      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          tier: 'free',
          credits_total: TIER_LIMITS.free,
          credits_used: 0,
          credits_reset_at: resetDate.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating credits:', insertError);
        // Return default free tier info
        return NextResponse.json({
          tier: 'free',
          tierName: TIER_NAMES.free,
          creditsTotal: TIER_LIMITS.free,
          creditsUsed: 0,
          creditsRemaining: TIER_LIMITS.free,
          features: TIER_FEATURES.free,
          resetDate: resetDate.toISOString(),
          actionCosts: ACTION_COSTS,
        });
      }

      credits = newCredits;
    }

    // Check if credits need reset
    if (credits && new Date(credits.credits_reset_at) < new Date()) {
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);

      const { data: updatedCredits } = await supabase
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetDate.toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedCredits) {
        credits = updatedCredits;
      }
    }

    const tier = (credits?.tier || 'free') as Tier;
    const tierToShow = hasUnlimitedCredits ? 'enterprise' : tier;
    const creditsTotal = hasUnlimitedCredits
      ? Number.MAX_SAFE_INTEGER
      : (credits?.credits_total || TIER_LIMITS[tier]);
    const creditsUsed = hasUnlimitedCredits ? 0 : (credits?.credits_used || 0);

    return NextResponse.json({
      tier: tierToShow,
      tierName: TIER_NAMES[tierToShow],
      creditsTotal,
      creditsUsed,
      creditsRemaining: creditsTotal - creditsUsed,
      features: TIER_FEATURES[tierToShow],
      resetDate: credits?.credits_reset_at,
      actionCosts: ACTION_COSTS,
      subscriptionStatus: credits?.subscription_status || 'active',
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Failed to get credits info' },
      { status: 500 }
    );
  }
}

// POST: Use credits for an action
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    const hasUnlimitedCredits = hasUnlimitedDeveloperCredits(user.email);

    const body = await request.json();
    const { action, metadata } = body as { action: ActionType; metadata?: any };

    if (!action || !ACTION_COSTS[action]) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }

    // Get user credits
    let { data: credits, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no credits record, create one
    if (error?.code === 'PGRST116' || !credits) {
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);

      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: user.id,
          tier: 'free',
          credits_total: TIER_LIMITS.free,
          credits_used: 0,
          credits_reset_at: resetDate.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to initialize credits' },
          { status: 500 }
        );
      }

      credits = newCredits;
    }

    // Check if credits need reset
    if (credits && new Date(credits.credits_reset_at) < new Date()) {
      const resetDate = new Date();
      resetDate.setDate(resetDate.getDate() + 30);

      const { data: updatedCredits } = await supabase
        .from('user_credits')
        .update({
          credits_used: 0,
          credits_reset_at: resetDate.toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedCredits) {
        credits = updatedCredits;
      }
    }

    const creditsRemaining = credits.credits_total - credits.credits_used;
    const creditsRequired = ACTION_COSTS[action];

    if (hasUnlimitedCredits) {
      return NextResponse.json({
        success: true,
        creditsUsed: 0,
        creditsRemaining: Number.MAX_SAFE_INTEGER,
        tier: 'enterprise',
      });
    }

    // Check if user has enough credits
    if (creditsRemaining < creditsRequired) {
      return NextResponse.json({
        success: false,
        error: 'Not enough credits',
        creditsRemaining,
        creditsRequired,
        tier: credits.tier,
        needsUpgrade: true,
        message: `You need ${creditsRequired} credits but only have ${creditsRemaining}. Please upgrade your plan to continue.`,
      }, { status: 402 }); // 402 Payment Required
    }

    // Use the credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_used: credits.credits_used + creditsRequired,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json(
        { error: 'Failed to use credits' },
        { status: 500 }
      );
    }

    // Log the usage
    await supabase
      .from('credit_usage_log')
      .insert({
        user_id: user.id,
        credits_used: creditsRequired,
        action_type: action,
        metadata: metadata || {},
      });

    return NextResponse.json({
      success: true,
      creditsUsed: creditsRequired,
      creditsRemaining: creditsRemaining - creditsRequired,
      tier: credits.tier,
    });

  } catch (error) {
    console.error('Credits API error:', error);
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}
