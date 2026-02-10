# Security Guide for DraftDeckAI

This document outlines the security measures implemented in DraftDeckAI and best practices for maintaining a secure deployment.

## 🔒 Security Features Implemented

### 1. Authentication & Authorization
- **Supabase Auth Integration**: Secure JWT-based authentication
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Automatic token refresh and secure session handling
- **Password Requirements**: Strong password validation (8+ chars, mixed case, numbers)

### 2. Input Validation & Sanitization
- **Zod Schema Validation**: Type-safe input validation for all API endpoints
- **SQL Injection Protection**: Pattern detection and input sanitization
- **XSS Prevention**: HTML sanitization and Content Security Policy
- **Rate Limiting**: API endpoint protection against abuse

### 3. Security Headers
- **Content Security Policy (CSP)**: Prevents XSS and code injection
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Strict-Transport-Security**: Enforces HTTPS connections
- **X-XSS-Protection**: Browser XSS filtering
- **Referrer-Policy**: Controls referrer information

### 4. API Security
- **CORS Configuration**: Restrictive cross-origin policies
- **Webhook Signature Verification**: Stripe webhook security
- **Environment Variable Validation**: Runtime checks for required secrets
- **Error Handling**: Secure error responses without sensitive data exposure

### 5. Data Protection
- **Environment Variables**: No hardcoded secrets in code
- **Secure Headers**: All sensitive data transmitted securely
- **Input Length Limits**: Prevents buffer overflow attacks
- **File Upload Validation**: Type and size restrictions

## 🛡️ Security Configuration

### Environment Variables
Ensure these environment variables are properly configured:

```bash
# Required Security Variables
NEXTAUTH_SECRET=your-nextauth-secret-here-use-openssl-rand-base64-32
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Optional but Recommended
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Rate Limiting Configuration
Current rate limits (per IP address):
- **Authentication endpoints**: 10 requests per 15 minutes
- **Generation endpoints**: 20 requests per 15 minutes
- **General API endpoints**: 100 requests per 15 minutes

### Content Security Policy
The CSP header allows:
- Scripts from self and Stripe
- Styles from self and Google Fonts
- Images from self, data URLs, and HTTPS sources
- Connections to Supabase, Stripe, and Gemini API

## 🚨 Security Best Practices

### For Developers

1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Validate all inputs**: Use the validation schemas in `lib/validation.ts`
3. **Sanitize user content**: Use provided sanitization functions
4. **Check authentication**: Verify user sessions in protected API routes
5. **Log security events**: Use `logSecurityEvent()` for monitoring

### For Deployment

1. **Use HTTPS**: Always deploy with SSL/TLS certificates
2. **Environment isolation**: Separate development and production environments
3. **Regular updates**: Keep dependencies updated for security patches
4. **Monitor logs**: Watch for security events and failed authentication attempts
5. **Backup strategy**: Regular database backups with encryption

### For Users

1. **Strong passwords**: Enforce minimum password requirements
2. **Account security**: Monitor for suspicious login attempts
3. **Data privacy**: Only collect necessary user information
4. **Secure sessions**: Automatic logout after inactivity

## 🔍 Security Monitoring

### Logging
Security events are logged for:
- Failed authentication attempts
- Rate limit violations
- Invalid input detection
- Webhook signature failures
- CSRF protection triggers

### Monitoring Checklist
- [ ] Review authentication logs regularly
- [ ] Monitor API rate limit violations
- [ ] Check for unusual traffic patterns
- [ ] Verify webhook signature validations
- [ ] Monitor database access patterns

## 🚀 Deployment Security

### Vercel Deployment
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000" }
      ]
    }
  ]
}
```

### Netlify Deployment
Security headers are configured in `netlify.toml` with:
- CSP policy
- Frame protection
- XSS protection
- CORS restrictions

## 🔧 Security Testing

### Manual Testing
1. Test authentication flows
2. Verify rate limiting works
3. Check input validation
4. Test CORS policies
5. Verify webhook signatures

### Automated Testing
Consider implementing:
- Security scanning in CI/CD
- Dependency vulnerability checks
- Automated penetration testing
- Regular security audits

## 📞 Security Incident Response

### If you discover a security vulnerability:
1. **Do not** create a public issue
2. Email security concerns to: [your-security-email]
3. Include detailed reproduction steps
4. Allow time for investigation and patching

### Incident Response Plan:
1. Assess the severity and impact
2. Implement immediate containment
3. Develop and test a fix
4. Deploy the fix to production
5. Notify affected users if necessary
6. Document lessons learned

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Stripe Security](https://stripe.com/docs/security)

---

**Last Updated**: January 2025
**Security Review**: Required every 6 months