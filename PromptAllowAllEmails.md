# AI Agent Prompt: Remove Email Domain Restrictions (Option 1)

## Objective
Remove the restrictive email domain whitelist from the resume builder to allow all valid email addresses including custom domains (e.g., john@company.com, jane@startup.io, contact@agency.org).

## Current State
The email validation in `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/lib/validation.ts` currently:
- Only allows whitelisted providers (Gmail, Outlook, Yahoo, etc.)
- Only allows educational domains (.edu, .ac.uk, etc.)
- Rejects all custom domain emails with error: "Please use a valid email from a recognized provider"

## Files to Modify

### 1. `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/lib/validation.ts` (PRIMARY)

**Current Code (lines 1-29):**
```typescript
import { z } from 'zod';

const TRUSTED_EMAIL_DOMAINS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'mail.com', 'gmx.com', 'yandex.com', 'tutanota.com'
];

const isValidEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  if (TRUSTED_EMAIL_DOMAINS.includes(domain)) return true;
  
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || domain.endsWith('.edu.au') || 
      domain.endsWith('.edu.cn') || domain.endsWith('.edu.in')) return true;
  
  if (/^\d+@qq\.com$/.test(email) || /^\d{10,}@/.test(email)) return false;
  
  return false;
};

export const emailSchema = z
  .string()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine(isValidEmailDomain, {
    message: 'Please use a valid email from a recognized provider (Gmail, Outlook, Yahoo, etc.)'
  });
```

**Required Changes:**
1. Remove the `TRUSTED_EMAIL_DOMAINS` array entirely (lines 3-7)
2. Simplify `isValidEmailDomain` function to only check for spam patterns (lines 9-21)
3. Update `emailSchema` to remove the domain whitelist refinement (lines 23-29)
4. Update error message to be generic

**New Code Should Be:**
```typescript
import { z } from 'zod';

const isValidEmailDomain = (email: string): boolean => {
  // Only block obvious spam patterns (numeric-only QQ emails and suspicious numeric usernames)
  if (/^\d+@qq\.com$/.test(email) || /^\d{10,}@/.test(email)) return false;
  
  // Allow all other valid email formats including custom domains
  return true;
};

export const emailSchema = z
  .string()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine(isValidEmailDomain, {
    message: 'Please enter a valid email address'
  });
```

### 2. UI Components - Update Error Messages and Placeholders

Search for and update the following files to reflect the new email policy:

**Files to check and update:**
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume/resume-creation-options.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume/mobile-resume-builder.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume/resume-generator.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/resume/guided-resume-generator.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/letter/letter-generator.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/components/letter/letter-dashboard.tsx`

**What to look for:**
1. Placeholder text like "john@gmail.com" or "john.doe@example.com" - keep these as examples
2. Error messages mentioning "Gmail, Outlook, Yahoo" - remove these references
3. Any helper text about "recognized providers" - remove or update

**Example updates:**
- Change: `placeholder="john@gmail.com"` → keep as is (it's just an example)
- Remove: Any tooltip or helper text saying "Must be Gmail, Outlook, Yahoo, etc."
- Update: Error messages from "Please use a valid email from a recognized provider" → "Please enter a valid email address"

### 3. Auth Pages (if applicable)

Check these files for email validation references:
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/app/auth/register/page.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/app/auth/signin/page.tsx`
- `/mnt/WindowsData/Users/MAYANK SAHU/Desktop/LinuxFiles/docmagic/DocMagic/app/api/auth/register/route.ts`

**Note:** Auth pages likely use the same `emailSchema` from validation.ts, so they should automatically work after updating the schema.

## Implementation Steps

1. **Update validation.ts**
   - Remove TRUSTED_EMAIL_DOMAINS array
   - Simplify isValidEmailDomain function
   - Update emailSchema error message
   - Keep spam detection for numeric QQ emails

2. **Search for UI references**
   - Use grep to find any hardcoded error messages about "Gmail, Outlook, Yahoo"
   - Update or remove these references
   - Keep placeholders as examples (they're fine)

3. **Test the changes**
   - Test with valid custom domain: "john@company.com" → should pass
   - Test with valid Gmail: "john@gmail.com" → should pass
   - Test with spam pattern: "12345@qq.com" → should fail
   - Test with invalid format: "not-an-email" → should fail
   - Test with educational domain: "student@university.edu" → should pass

## Testing Checklist

After implementation, verify:

- [ ] Custom domain emails work: `test@mycompany.com`, `user@startup.io`, `contact@agency.org`
- [ ] Standard providers still work: `user@gmail.com`, `user@outlook.com`
- [ ] Educational domains work: `student@mit.edu`, `researcher@oxford.ac.uk`
- [ ] Spam patterns are blocked: `123456@qq.com`, `9876543210@anydomain.com`
- [ ] Invalid formats are rejected: `notanemail`, `@nodomain.com`, `noat sign.com`
- [ ] Error messages are generic and don't mention specific providers
- [ ] All resume builder forms accept custom domain emails
- [ ] Letter/cover letter forms accept custom domain emails
- [ ] Auth registration accepts custom domain emails (if using same schema)

## Edge Cases to Handle

1. **International domains**: `user@münchen.de` (should work with proper validation)
2. **Subdomains**: `user@mail.company.com` (should work)
3. **New TLDs**: `user@company.tech`, `user@startup.app` (should work)
4. **Plus addressing**: `user+tag@gmail.com` (should work)
5. **Very long emails**: Max 254 characters (already enforced)

## Rollback Plan

If issues arise:
1. The TRUSTED_EMAIL_DOMAINS array can be restored
2. The validation logic can be made stricter again
3. Consider adding a feature flag to toggle between strict and permissive modes

## Success Criteria

✅ Users can enter any valid email address with custom domains
✅ No references to "Gmail, Outlook, Yahoo" in error messages
✅ Spam detection still works for numeric-only patterns
✅ All existing functionality continues to work
✅ No breaking changes to API or database schema

## Notes

- This change affects validation only, not database schema
- No migration needed
- Backward compatible - existing valid emails remain valid
- The regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` allows any domain with at least one dot
- Consider adding DNS/MX validation in the future for enhanced verification (optional)
