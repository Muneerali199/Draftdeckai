// Credit system types and constants
// The actual operations are done via the /api/credits endpoint

export type Tier = 'free' | 'basic' | 'pro' | 'enterprise';
export type ActionType = 'resume' | 'presentation' | 'diagram' | 'letter' | 'ats_check' | 'cover_letter';

// Credit reset period - Monthly on the 1st of each month
export const CREDIT_RESET_PERIOD = 'monthly';

// Credit limits by tier
export const TIER_LIMITS: Record<Tier, number> = {
  free: 20,
  basic: 50,
  pro: 200,
  enterprise: 999999, // Effectively unlimited
};

// Credit costs by action type
// Note: presentation cost is PER SLIDE (e.g., 5 slides = 5 credits)
export const ACTION_COSTS: Record<ActionType, number> = {
  resume: 1,
  presentation: 1, // Per slide
  diagram: 1,
  letter: 1,
  ats_check: 1,
  cover_letter: 1,
};

// Tier display names
export const TIER_NAMES: Record<Tier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

// Tier features
export const TIER_FEATURES: Record<Tier, string[]> = {
  free: [
    '20 credits/month',
    'Basic resume templates',
    'PDF export',
    'Email support',
  ],
  basic: [
    '50 credits/month',
    'All resume templates',
    'PDF & DOCX export',
    'ATS optimization',
    'Priority email support',
  ],
  pro: [
    '200 credits/month',
    'All templates + Premium',
    'All export formats',
    'Advanced ATS optimization',
    'Custom domain hosting',
    'Priority support',
  ],
  enterprise: [
    'Unlimited credits',
    'All features included',
    'White-label options',
    'API access',
    'Dedicated support',
    'Custom integrations',
  ],
};

// Developer/testing credit bypass
const DEVELOPER_BYPASS_EMAILS = new Set([
  'alimuneerali245@gmail.com',
]);

export function hasUnlimitedDeveloperCredits(email?: string | null): boolean {
  if (!email) return false;
  return DEVELOPER_BYPASS_EMAILS.has(email.trim().toLowerCase());
}

// Helper to check if a tier has enough credits for an action
export function canPerformAction(
  creditsRemaining: number,
  action: ActionType
): boolean {
  return creditsRemaining >= ACTION_COSTS[action];
}

// Helper to get credit cost description
export function getActionCostDescription(action: ActionType): string {
  const cost = ACTION_COSTS[action];
  return `${cost} credit${cost > 1 ? 's' : ''}`;
}

/**
 * Calculate the date when credits should be reset (1st day of next month)
 * Credits reset monthly on the 1st at 00:00:00 UTC
 * @returns ISO 8601 formatted date string for credit reset
 */
export function getCreditsResetDate(): string {
  const now = new Date();
  // Get the first day of next month at 00:00:00 UTC
  const resetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1, // Next month
    1, // 1st day
    0, 0, 0, 0 // 00:00:00
  ));
  return resetDate.toISOString();
}

/**
 * Check if credits need to be reset based on reset date
 * @param resetDate - The scheduled reset date (ISO string or Date object)
 * @returns true if the reset date has passed, false otherwise
 */
export function shouldResetCredits(resetDate: string | Date): boolean {
  return new Date(resetDate) < new Date();
}

/**
 * Calculate remaining credits, ensuring result is never negative
 * @param creditsTotal - Total credits available for the user
 * @param creditsUsed - Credits already consumed
 * @returns Remaining credits (0 or positive integer)
 */
export function calculateRemainingCredits(creditsTotal: number, creditsUsed: number): number {
  const remaining = creditsTotal - creditsUsed;
  return remaining < 0 ? 0 : remaining;
}
