import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const type = requestUrl.searchParams.get("type");

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
      
      // Handle different auth types
      if (type === "recovery") {
        // Password reset flow - redirect to reset password page
        const resetUrl = new URL("/auth/reset-password", requestUrl.origin);
        return Response.redirect(resetUrl.toString());
      }
      
      if (type === "signup") {
        // Email confirmation after signup: send welcome email now that the account is verified
        try {
          const { data: userData } = await supabase.auth.getUser();
          const userEmail = userData.user?.email;
          const userName = (userData.user as any)?.user_metadata?.name;
          if (userEmail) {
            await sendWelcomeEmail(userEmail, userName);
          }
        } catch (e) {
          console.error("Failed to send welcome email after verification:", e);
        }
        // Redirect to home with confirmed flag
        const confirmUrl = new URL("/?confirmed=true", requestUrl.origin);
        return Response.redirect(confirmUrl.toString());
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
