import nodemailer from 'nodemailer';

// Helper to create a reusable Nodemailer transporter.
// Supports both EMAIL_* and SMTP_* environment variable naming conventions.
// In development (no email config provided) it will fallback to Ethereal test account.
async function createTransporter() {
  // Support both naming conventions
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT || '587';
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@draftdeckai.com';

  if (host && user && pass) {
    console.log(`[Email] Using SMTP: ${host}:${port}`);
    return nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: create a test account for local development
  console.log('[Email] No SMTP config found, using Ethereal test account');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

/**
 * Get the "from" email address from environment variables
 */
function getFromAddress(): string {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'DraftDeckAI <noreply@draftdeckai.com>';
}

/**
 * Sends a welcome email to a newly registered user.
 * @param to The recipient email address.
 * @param name Optional recipient name for personalisation.
 * @returns The result from Nodemailer and an optional previewUrl when using Ethereal.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  try {
    const transporter = await createTransporter();

    const subject = 'Welcome to DraftDeckAI! 🎉';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#0f172a;border-radius:16px;padding:40px;border:1px solid #1e293b;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="margin:0;font-size:28px;background:linear-gradient(90deg,#facc15,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">DraftDeckAI</h1>
        <p style="color:#94a3b8;font-size:14px;margin-top:8px;">AI-powered document creation</p>
      </div>
      
      <!-- Content -->
      <h2 style="color:#ffffff;font-size:22px;margin-bottom:16px;">Welcome${name ? `, ${name}` : ''}! 🎉</h2>
      <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Thank you for joining <strong style="color:#facc15;">DraftDeckAI</strong>! You're now ready to create professional documents with AI.
      </p>
      <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Create stunning resumes, presentations, cover letters, and diagrams in seconds.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://draftdeckai.com'}" 
           style="display:inline-block;background:linear-gradient(90deg,#facc15,#3b82f6);color:#000;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
          Start Creating ✨
        </a>
      </div>
      
      <!-- Footer -->
      <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;">
      <p style="color:#64748b;font-size:12px;text-align:center;">
        If you have any questions, just reply to this email—we're happy to help!
      </p>
      <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px;">
        © 2026 DocMagic · docmagic.me
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Welcome${name ? `, ${name}` : ''}!\n\nThank you for joining DraftDeckAI! You're now ready to create professional documents with AI.\n\nCreate stunning resumes, presentations, cover letters, and diagrams in seconds.\n\nVisit: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://draftdeckai.com'}\n\nCheers,\nThe DraftDeckAI Team`;

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Welcome email preview URL: ${previewUrl}`);
    }
    console.log(`[Email] Welcome email sent to ${to}`);
    return { info, previewUrl };
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Sends a verification email with a custom CTA button.
 * This is used when you want to send a custom verification email instead of Supabase's default.
 */
export async function sendVerificationEmail(to: string, confirmationUrl: string, name?: string) {
  try {
    const transporter = await createTransporter();

    const safeName = name ? `, ${name}` : '';
    const subject = 'Verify your email to start using DraftDeckAI ✉️';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#0f172a;border-radius:16px;padding:40px;border:1px solid #1e293b;">
      <!-- Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="margin:0;font-size:28px;background:linear-gradient(90deg,#22c55e,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">DraftDeckAI</h1>
        <p style="color:#94a3b8;font-size:14px;margin-top:8px;">AI-powered document creation</p>
      </div>
      
      <!-- Content -->
      <h2 style="color:#ffffff;font-size:22px;margin-bottom:16px;">Welcome to DraftDeckAI 👋${safeName}</h2>
      <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin-bottom:16px;">
        Thanks for joining <strong style="color:#22c55e;">DraftDeckAI</strong>! You're just one step away from creating powerful resumes and documents with AI.
      </p>
      <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin-bottom:24px;">
        Please verify your email address to activate your account.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmationUrl}" 
           style="display:inline-block;background:#22c55e;color:#000;padding:14px 32px;border-radius:12px;font-weight:600;text-decoration:none;font-size:16px;">
          Verify Email ✓
        </a>
      </div>
      
      <!-- Alternative Link -->
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:24px;">
        Or copy and paste this link into your browser:<br>
        <a href="${confirmationUrl}" style="color:#38bdf8;word-break:break-all;">${confirmationUrl}</a>
      </p>
      
      <!-- Footer -->
      <hr style="border:none;border-top:1px solid #1e293b;margin:32px 0;">
      <p style="color:#64748b;font-size:12px;text-align:center;">
        If you didn't create a DraftDeckAI account, you can safely ignore this email.
      </p>
      <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px;">
        © 2026 DraftDeckAI · draftdeckai.com
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Welcome to DraftDeckAI${safeName}!\n\nThanks for joining DraftDeckAI! You're just one step away from creating powerful resumes and documents with AI.\n\nPlease verify your email to activate your account:\n${confirmationUrl}\n\nIf you didn't create a DraftDeckAI account, you can safely ignore this email.\n\n© 2026 DraftDeckAI`;

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      html,
      text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Email] Verification email preview URL: ${previewUrl}`);
    }
    console.log(`[Email] Verification email sent to ${to}`);
    return { info, previewUrl };
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    throw error;
  }
}