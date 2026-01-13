# Email Verification Setup Guide

This guide explains how to set up email verification for DocMagic so users receive verification emails when they sign up.

## Quick Setup (5 minutes)

### Step 1: Enable Email Confirmation in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. **Enable** the "Confirm email" toggle ✅
5. Click **Save**

### Step 2: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (add your production URL)
4. Click **Save**

### Step 3: Customize Email Template (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. Customize the email:

```html
<h2>Welcome to DocMagic!</h2>
<p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

4. Click **Save**

## That's It! 🎉

Supabase will now automatically send verification emails when users sign up. The flow works like this:

1. User signs up on `/auth/register`
2. Supabase creates the user (unverified)
3. Supabase sends verification email
4. User clicks the link in the email
5. User is redirected to `/auth/callback?type=signup`
6. User is logged in and redirected to the app

---

## Advanced: Custom SMTP (Recommended for Production)

For production, you should use your own SMTP server so emails come from your domain.

### Option A: Configure SMTP in Supabase (Easiest)

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Toggle on **Enable Custom SMTP**
3. Enter your SMTP details:
   - **Host**: `smtp.gmail.com` (or your email provider)
   - **Port**: `587`
   - **User**: Your email address
   - **Pass**: Your app password
   - **Sender email**: `noreply@yourdomain.com`
   - **Sender name**: `DocMagic`
4. Click **Save**

### Option B: Use DocMagic's Custom Email System

If you want more control over email design, configure SMTP in your `.env.local`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=DocMagic <your-email@gmail.com>
```

#### Getting Gmail App Password:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a password for "Mail"
5. Use this password in `EMAIL_PASS`

---

## OAuth Setup (Google & GitHub)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Go to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client IDs**:
   - Application type: Web application
   - Authorized redirect URIs: 
     - `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. In Supabase: **Authentication** → **Providers** → **Google**
   - Enable the provider
   - Paste Client ID and Client Secret
   - Save

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new **OAuth App**:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret
4. In Supabase: **Authentication** → **Providers** → **GitHub**
   - Enable the provider
   - Paste Client ID and Client Secret
   - Save

---

## Troubleshooting

### Emails not being sent?

1. **Check Supabase logs**: Go to **Authentication** → **Logs** to see if emails are being attempted
2. **Check spam folder**: Supabase emails sometimes go to spam
3. **Verify "Confirm email" is ON**: Authentication → Providers → Email
4. **Check Site URL**: Must match exactly with your app URL
5. **Check Redirect URLs**: Must include your callback URL

### Users can sign in without verification?

- Make sure "Confirm email" is **enabled** in Authentication → Providers → Email
- Existing users created before enabling won't require verification

### OAuth not working?

1. Check that the provider is enabled in Supabase
2. Verify the callback URL matches exactly
3. Make sure Client ID and Secret are correct
4. Check browser console for errors

---

## Testing Email Locally

When `EMAIL_HOST` is not configured, DocMagic uses [Ethereal](https://ethereal.email/) for testing.

1. Sign up a new user
2. Check the terminal/console for a preview URL like:
   ```
   [Email] Verification email preview URL: https://ethereal.email/message/...
   ```
3. Open that URL to see the email

---

## Need Help?

- Check the [Supabase Auth docs](https://supabase.com/docs/guides/auth)
- Open an issue on GitHub
- Join our Discord community
