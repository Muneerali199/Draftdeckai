import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Enhanced rate limiting configuration
const RATE_LIMITS = {
  API: { windowMs: 60 * 1000, max: 100 }, // 1 minute, 100 requests
  AUTH: { windowMs: 15 * 60 * 1000, max: 10 }, // 15 minutes, 10 requests
  GENERATE: { windowMs: 5 * 60 * 1000, max: 20 }, // 5 minutes, 20 requests
  EXPORT: { windowMs: 2 * 60 * 1000, max: 30 }, // 2 minutes, 30 requests
};

// In-memory stores
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const ipBlocklist = new Set<string>();

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith('/api/auth/')) {
    return RATE_LIMITS.AUTH;
  } else if (pathname.startsWith('/api/generate/')) {
    return RATE_LIMITS.GENERATE;
  } else if (pathname.startsWith('/api/export/')) {
    return RATE_LIMITS.EXPORT;
  }
  return RATE_LIMITS.API;
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; reset: number } {
  // Check blocklist first
  if (ipBlocklist.has(ip)) {
    return { allowed: false, remaining: 0, reset: Date.now() + 5 * 60 * 1000 };
  }

  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  const key = `${ip}:${pathname}`;
  
  let data = rateLimitStore.get(key);
  
  // Reset if window expired
  if (!data || now > data.reset) {
    data = { count: 1, reset: now + config.windowMs };
    rateLimitStore.set(key, data);
    return { allowed: true, remaining: config.max - 1, reset: data.reset };
  }

  // Check if limit exceeded
  if (data.count >= config.max) {
    // Add to blocklist temporarily
    ipBlocklist.add(ip);
    setTimeout(() => ipBlocklist.delete(ip), 5 * 60 * 1000); // 5 minutes
    return { allowed: false, remaining: 0, reset: data.reset };
  }

  // Increment count
  data.count++;
  rateLimitStore.set(key, data);
  
  return { allowed: true, remaining: config.max - data.count, reset: data.reset };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Static asset optimization
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    const response = NextResponse.next();
    
    // Aggressive caching for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Vary', 'Accept-Encoding');
    
    // Performance headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    return response;
  }

  // API routes - apply rate limiting
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = checkRateLimit(ip, pathname);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RATE_LIMITS.API.max.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.reset / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', RATE_LIMITS.API.max.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.reset / 1000).toString());
    
    // Performance monitoring for AI endpoints
    if (pathname.startsWith('/api/generate/') || pathname.startsWith('/api/analyze-ats')) {
      response.headers.set('X-Endpoint-Type', 'ai-generation');
    }
    
    return response;
  }

  // HTML pages - add performance headers
  if (pathname.match(/\.html$/) || !pathname.includes('.')) {
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Performance headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Cache HTML pages moderately
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
    
    return response;
  }

  // Default response
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - Static files (_next/static, _next/image, favicon.ico)
     * - Public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};