import { NextResponse } from 'next/server';
import { createRoute } from '@/lib/supabase/server';
import { sendVerificationEmail } from "@/lib/email";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { validateAndSanitize, registrationSchema, detectSqlInjection, sanitizeInput } from '@/lib/validation';

// This route handles user registration
export async function POST(request: Request) {
  try {
    const rawBody = await request.json();

    // Validate and sanitize input
    const { name, email, password } = validateAndSanitize(registrationSchema, rawBody);

    // Additional security checks
    if (detectSqlInjection(name) || detectSqlInjection(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input detected' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);

    const supabase = await createRoute();

    // Sign up with Supabase Auth. If email confirmations are enabled,
    // Supabase will create the user but not start a session until the email is verified.
    // Ensure the verification link redirects back to our callback route.
    const origin = (() => {
      try {
        const url = new URL((request as any).url);
        return url.origin;
      } catch {
        return process.env.NEXT_PUBLIC_SITE_URL || '';
      }
    })();

    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: origin ? `${origin}/auth/callback?type=signup` : undefined,
        data: {
          name: sanitizedName,
          email: sanitizedEmail
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);

      // If the user already exists (possibly unverified), attempt to resend verification email
      if (
        error.status === 422 ||
        error.code === 'user_already_exists' ||
        /already registered|already exists/i.test(error.message || '')
      ) {
        try {
          const origin = (() => {
            try {
              const url = new URL((request as any).url);
              return url.origin;
            } catch {
              return process.env.NEXT_PUBLIC_SITE_URL || '';
            }
          })();

          const resend = await supabase.auth.resend({
            type: 'signup',
            email: sanitizedEmail,
            options: {
              emailRedirectTo: origin ? `${origin}/auth/callback?type=signup` : undefined,
            },
          });

          if (resend.error) {
            // If resend fails, inform the client accordingly
            return new Response(
              JSON.stringify({
                error:
                  resend.error.message ||
                  'This email is already registered. Please sign in or try resetting your password.',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // Treat as success for UX: user must verify email
          return new Response(
            JSON.stringify({
              message:
                'This email is already registered. If you have not verified yet, we have resent the verification link. Please check your inbox to complete signup.',
              requiresVerification: true,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (resendErr: any) {
          return new Response(
            JSON.stringify({
              error:
                resendErr?.message ||
                'This email is already registered. Please sign in or reset your password.',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a confirmation link with service role (for custom verification email)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KE;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || '';

    if (serviceRoleKey) {
      try {
        const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: 'signup',
          email: sanitizedEmail,
          options: {
            emailRedirectTo: siteUrl ? `${siteUrl.replace(/\/$/, '')}/auth/callback?type=signup` : undefined,
          },
        });

        if (linkError) {
          console.error('Failed to generate verification link:', linkError);
        } else if (linkData?.action_link) {
          // Send custom verification email (non-blocking)
          sendVerificationEmail(sanitizedEmail, linkData.action_link, sanitizedName).catch((err) => {
            console.error('Failed to send verification email:', err);
          });
        }
      } catch (adminErr) {
        console.error('Admin generateLink/send verification failed:', adminErr);
      }
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is missing; custom verification email not sent.');
    }

    // Return success message (reflect email verification requirement)
    const requiresVerification = !data.session; // if confirmations enabled, session will be null
    const message = requiresVerification
      ? 'Registration successful! Please check your email to verify your account before signing in.'
      : 'Registration successful! You can now sign in.';

    return new Response(
      JSON.stringify({
        message,
        requiresVerification,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: sanitizedName
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error in registration:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Add route configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';