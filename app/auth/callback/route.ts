import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Process referral for new user
async function processReferral(referralCode: string, newUserId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const REFERRAL_BONUS_CREDITS = 5;

  try {
    // Find the referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('user_credits')
      .select('user_id, referral_credits_earned, credits_total')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      console.log('Invalid referral code:', referralCode);
      return false;
    }

    // Prevent self-referral
    if (referrer.user_id === newUserId) {
      console.log('User tried to use own referral code');
      return false;
    }

    // Check if this user was already referred
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', newUserId)
      .single();

    if (existingReferral) {
      console.log('User already referred');
      return false;
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
      return false;
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

    // Award bonus credits to the new user AND update referred_by
    // First fetch current credits to be safe (though usually it's the default amount)
    const { data: newUserCredits } = await supabase
      .from('user_credits')
      .select('credits_total')
      .eq('user_id', newUserId)
      .single();
    
    const currentCredits = newUserCredits?.credits_total || 20; // Default fallback

    await supabase
      .from('user_credits')
      .update({ 
        referred_by: referrer.user_id,
        credits_total: currentCredits + REFERRAL_BONUS_CREDITS
      })
      .eq('user_id', newUserId);

    console.log('Referral processed successfully');
    return true;
  } catch (error) {
    console.error('Error processing referral:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const type = requestUrl.searchParams.get("type");
  const referralCode = requestUrl.searchParams.get("ref");

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Auth callback error:", error);
        // If there's an error, redirect to sign in with error message
        const errorUrl = new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin);
        return Response.redirect(errorUrl.toString());
      }
      
      // Get the user data after successful authentication
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      // Handle different auth types
      if (type === "recovery") {
        // Password reset flow - redirect to reset password page
        const resetUrl = new URL("/auth/reset-password", requestUrl.origin);
        return Response.redirect(resetUrl.toString());
      }
      
      if (type === "signup") {
        // Email confirmation after signup: send welcome email now that the account is verified
        try {
          const userEmail = user?.email;
          const userName = (user as any)?.user_metadata?.name;
          if (userEmail) {
            await sendWelcomeEmail(userEmail, userName);
          }
        } catch (e) {
          console.error("Failed to send welcome email after verification:", e);
        }
        
        // Process referral: Check URL first, then user metadata
        let finalReferralCode = referralCode;
        if (!finalReferralCode && user?.user_metadata?.referral_code) {
          finalReferralCode = user.user_metadata.referral_code;
        }

        if (finalReferralCode && user?.id) {
          await processReferral(finalReferralCode, user.id);
        }
        
        // Redirect to home with confirmed flag
        const confirmUrl = new URL("/?confirmed=true", requestUrl.origin);
        return Response.redirect(confirmUrl.toString());
      }
      
      // For OAuth signups (Google/GitHub), check if this is a new user
      if (user) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 60000; // Created within last minute
        
        if (isNewUser) {
          // Send welcome email for OAuth signups
          try {
            const userEmail = user.email;
            const userName = user.user_metadata?.name || user.user_metadata?.full_name;
            if (userEmail) {
              await sendWelcomeEmail(userEmail, userName);
            }
          } catch (e) {
            console.error("Failed to send welcome email for OAuth signup:", e);
          }
          
          // Process referral for OAuth signups if code is present
          if (referralCode && user.id) {
            await processReferral(referralCode, user.id);
          }
          
          // Redirect new OAuth users with a welcome flag
          const welcomeUrl = new URL("/?welcome=true", requestUrl.origin);
          return Response.redirect(welcomeUrl.toString());
        }
      }
      
      // Default redirect
      const nextUrl = new URL(next, requestUrl.origin);
      return Response.redirect(nextUrl.toString());
    } catch (err) {
      console.error("Auth callback exception:", err);
      const failUrl = new URL("/auth/signin?error=Authentication%20failed", requestUrl.origin);
      return Response.redirect(failUrl.toString());
    }
  }

  // No code provided, redirect to home
  const homeUrl = new URL("/", requestUrl.origin);
  return Response.redirect(homeUrl.toString());
}
