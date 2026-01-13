import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REFERRAL_BONUS_CREDITS = 5;

// GET: Get user's referral info
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

    // Get user's referral code
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('referral_code, referral_credits_earned')
      .eq('user_id', user.id)
      .single();

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('Error getting referral info:', creditsError);
      return NextResponse.json(
        { error: 'Failed to get referral info' },
        { status: 500 }
      );
    }

    // Get count of successful referrals
    const { count: referralCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'completed');

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const referralLink = credits?.referral_code 
      ? `${baseUrl}/auth/register?ref=${credits.referral_code}`
      : null;

    return NextResponse.json({
      referralCode: credits?.referral_code || null,
      referralLink,
      referralCount: referralCount || 0,
      totalCreditsEarned: credits?.referral_credits_earned || 0,
      creditsPerReferral: REFERRAL_BONUS_CREDITS,
    });

  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { error: 'Failed to get referral info' },
      { status: 500 }
    );
  }
}

// POST: Process a referral (called after successful signup)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referralCode, newUserId } = body;

    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: 'Missing referral code or user ID' },
        { status: 400 }
      );
    }

    // Find the referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_credits')
      .select('user_id, referral_credits_earned, credits_total')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      console.log('Invalid referral code:', referralCode);
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 200 } // Don't fail the signup for invalid referral
      );
    }

    // Prevent self-referral
    if (referrer.user_id === newUserId) {
      return NextResponse.json(
        { success: false, message: 'Cannot use your own referral code' },
        { status: 200 }
      );
    }

    // Check if this user was already referred
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newUserId)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { success: false, message: 'User already referred' },
        { status: 200 }
      );
    }

    // Create referral record
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.user_id,
        referred_id: newUserId,
        referral_code: referralCode.toUpperCase(),
        credits_awarded: REFERRAL_BONUS_CREDITS,
        status: 'completed',
      });

    if (insertError) {
      console.error('Error creating referral:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to process referral' },
        { status: 200 }
      );
    }

    // Award bonus credits to the referrer
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_total: referrer.credits_total + REFERRAL_BONUS_CREDITS,
        referral_credits_earned: (referrer.referral_credits_earned || 0) + REFERRAL_BONUS_CREDITS,
      })
      .eq('user_id', referrer.user_id);

    if (updateError) {
      console.error('Error awarding referral credits:', updateError);
    }

    // Update the new user's record to track who referred them
    await supabase
      .from('user_credits')
      .update({ referred_by: referrer.user_id })
      .eq('user_id', newUserId);

    return NextResponse.json({
      success: true,
      message: 'Referral processed successfully',
      creditsAwarded: REFERRAL_BONUS_CREDITS,
    });

  } catch (error) {
    console.error('Referral processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
