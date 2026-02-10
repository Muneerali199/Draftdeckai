# DraftDeckAI Email Templates

Copy and paste these HTML templates into your Supabase Dashboard under **Authentication > Email Templates**.

## 1. Confirm Signup
**Subject:** Confirm your DraftDeckAI account

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0f1a; font-family:Arial, Helvetica, sans-serif; color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f1a; padding:24px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#111827; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.4); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px; text-align:center; background:linear-gradient(135deg,#2563eb,#22c55e);">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff;">DraftDeckAI</h1>
              <p style="margin:6px 0 0; font-size:13px; color:#e0f2fe;">AI-powered documents & resumes</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <h2 style="margin:0 0 12px; font-size:20px; color:#ffffff;">Confirm your email</h2>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#d1d5db;">
                Welcome to DraftDeckAI! You're just one step away from creating professional documents with AI.
                Please confirm your email address to activate your account.
              </p>
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:14px 28px; background:#22c55e; color:#0b0f1a; text-decoration:none; font-weight:600; font-size:15px; border-radius:10px;">
                      Confirm Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px; font-size:13px; color:#9ca3af;">
                This link will expire for security reasons.
              </p>
              <p style="margin:0; font-size:13px; color:#9ca3af;">
                If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 24px; background:#0b1220; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6b7280;">© 2026 DraftDeckAI • All rights reserved</p>
              <p style="margin:6px 0 0; font-size:12px; color:#6b7280;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>
        <!-- End container -->
      </td>
    </tr>
  </table>
</body>
</html>
```

## 2. Reset Password
**Subject:** Reset your password

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0; padding:0; background-color:#0b0f1a; font-family:Arial, Helvetica, sans-serif; color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f1a; padding:24px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:#111827; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.4); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px; text-align:center; background:linear-gradient(135deg,#2563eb,#22c55e);">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff;">DraftDeckAI</h1>
              <p style="margin:6px 0 0; font-size:13px; color:#e0f2fe;">AI-powered documents & resumes</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <h2 style="margin:0 0 12px; font-size:20px; color:#ffffff;">Reset your password</h2>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#d1d5db;">
                We received a request to reset the password for your DraftDeckAI account.
                Click the button below to create a new password.
              </p>
              <!-- Button -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .RecoveryURL }}" style="display:inline-block; padding:14px 28px; background:#22c55e; color:#0b0f1a; text-decoration:none; font-weight:600; font-size:15px; border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px; font-size:13px; color:#9ca3af;">
                This link will expire for security reasons.
              </p>
              <p style="margin:0; font-size:13px; color:#9ca3af;">
                If you did not request a password reset, you can safely ignore this email.
                Your account will remain secure.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:18px 24px; background:#0b1220; text-align:center;">
              <p style="margin:0; font-size:12px; color:#6b7280;">© 2026 DraftDeckAI • All rights reserved</p>
              <p style="margin:6px 0 0; font-size:12px; color:#6b7280;">This is an automated message. Please do not reply.</p>
            </td>
          </tr>
        </table>
        <!-- End container -->
      </td>
    </tr>
  </table>
</body>
</html>
```
