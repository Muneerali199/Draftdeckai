// lib/config.ts

// Primary production URL (your canonical domain)
const PRODUCTION_URL = "https://draftdeckai.com";

// Environment detection helpers
const isProduction = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1";
const isNetlify = process.env.NETLIFY === "true";

// Stripe Configuration
export const STRIPE_CONFIG = {
  // Enable Stripe integration (set to true in production when ready)
  ENABLED: process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true',
  
  // Public key (safe to expose)
  PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  
  // Server-side keys (never expose these in client-side code)
  SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Price IDs for different plans
  PRICE_IDS: {
    MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    YEARLY: process.env.STRIPE_PRICE_ID_YEARLY || '',
  },
  
  // URLs
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel`,
} as const;

// Check if Stripe is properly configured
export const isStripeEnabled = STRIPE_CONFIG.ENABLED && 
  !!STRIPE_CONFIG.PUBLISHABLE_KEY && 
  !!STRIPE_CONFIG.SECRET_KEY;

// Strict type checking for Stripe config
const STRICT_STRIPE_CONFIG: {
  ENABLED: boolean;
  PUBLISHABLE_KEY: string;
  SECRET_KEY: string;
  WEBHOOK_SECRET: string;
  PRICE_IDS: {
    MONTHLY: string;
    YEARLY: string;
  };
  SUCCESS_URL: string;
  CANCEL_URL: string;
} = STRIPE_CONFIG;

// Get the appropriate base URL based on environment
export function getBaseUrl(): string {
  // 1. Use explicit env variable if set (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return ensureHttps(process.env.NEXT_PUBLIC_APP_URL);
  }

  // 2. Vercel-specific URL
  if (isVercel && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Netlify-specific URL
  if (isNetlify && process.env.URL) {
    return ensureHttps(process.env.URL);
  }

  // 4. Default production URL (for static exports)
  return PRODUCTION_URL;
}

// For client-side usage where you need current origin
export function getClientBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getBaseUrl();
}

// Helper to ensure URLs use HTTPS
function ensureHttps(url: string): string {
  if (!url.startsWith("http")) {
    return `https://${url}`;
  }
  return url.replace(/^http:/, "https:");
}

// Common paths (adjust as needed)
export const PATHS = {
  home: "/",
  authCallback: "/auth/callback",
  api: {
    submit: "/api/submit",
  },
};

// Full URL generators
export const getAuthCallbackUrl = () => `${getBaseUrl()}${PATHS.authCallback}`;
export const getApiUrl = (path: keyof typeof PATHS.api) => 
  `${getBaseUrl()}${PATHS.api[path]}`;