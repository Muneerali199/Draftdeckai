import nodemailer from 'nodemailer';

// Helper to create a reusable Nodemailer transporter.
// In development (no EMAIL_HOST provided) it will fallback to Ethereal test account.
async function createTransporter() {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Fallback: create a test account for local development
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
 * Sends a welcome email to a newly registered user.
 * @param to The recipient email address.
 * @param name Optional recipient name for personalisation.
 * @returns The result from Nodemailer and an optional previewUrl when using Ethereal.
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const transporter = await createTransporter();

  const subject = 'Welcome to DocMagic!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome${name ? `, ${name}` : ''}!</h2>
      <p>Thank you for joining <strong>DocMagic</strong>, your AI-powered document creation platform.</p>
      <p>We're excited to help you create professional resumes, presentations, CVs, and letters in seconds.</p>
      <p>If you have any questions, just reply to this email—we're always happy to help.</p>
      <p style="margin-top: 30px;">Cheers,<br/>The DocMagic Team</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@docmagic.com',
    to,
    subject,
    html,
  });

  const previewUrl = process.env.EMAIL_HOST ? null : nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Welcome email preview URL: ${previewUrl}`);
  }
  return { info, previewUrl };
} 

/**
 * Sends a verification email with a custom CTA button.
 */
export async function sendVerificationEmail(to: string, confirmationUrl: string, name?: string) {
  const transporter = await createTransporter();

  const safeName = name ? `, ${name}` : '';
  const subject = 'Verify your email to start using Docmagic';

  const html = `
<div style="background:#0b1220;padding:40px 16px;font-family:Arial,sans-serif;color:#ffffff">
  <div style="max-width:520px;margin:auto;background:#0f172a;border-radius:14px;padding:32px">
    <div style="text-align:center;margin-bottom:28px">
      <h1 style="margin:0;font-size:26px;background:linear-gradient(90deg,#22c55e,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Docmagic</h1>
      <p style="color:#94a3b8;font-size:14px;margin-top:6px">AI-powered documents & resumes</p>
    </div>
    <h2 style="font-size:20px;margin-bottom:12px">Welcome to Docmagic 👋${safeName}</h2>
    <p style="font-size:15px;line-height:1.6;color:#e5e7eb">Thanks for joining <b>Docmagic</b>. You're just one step away from creating powerful resumes and documents with AI.</p>
    <p style="font-size:15px;line-height:1.6;color:#e5e7eb">Please verify your email address to activate your account.</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${confirmationUrl}" style="display:inline-block;background:#22c55e;color:#000;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;">Verify Email</a>
    </div>
    <p style="font-size:13px;color:#94a3b8">If you didn’t create a Docmagic account, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid #1f2937;margin:28px 0">
    <p style="font-size:12px;color:#64748b;text-align:center">© 2026 Docmagic · docmagic.me</p>
  </div>
</div>`;

  const text = `Welcome to Docmagic${safeName}\n\nPlease verify your email to activate your account:\n${confirmationUrl}\n\nIf you didn’t create a Docmagic account, you can ignore this email.`;

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@docmagic.com',
    to,
    subject,
    html,
    text,
  });

  const previewUrl = process.env.EMAIL_HOST ? null : nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Verification email preview URL: ${previewUrl}`);
  }

  return { info, previewUrl };
}