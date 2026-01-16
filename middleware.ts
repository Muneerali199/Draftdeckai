import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SECURITY_CONFIG, getSecurityHeaders, isAllowedOrigin, logSecurityEvent } from '@/lib/security';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
function rateLimit(ip: string, endpoint: string): boolean {
  const now = Date.now();
  const key = `${ip}:${endpoint}`;

  // Determine rate limit based on endpoint
  let limit = SECURITY_CONFIG.RATE_LIMITS.API.requests;
  let windowMs = SECURITY_CONFIG.RATE_LIMITS.API.windowMs;

  if (endpoint.startsWith('/api/auth/')) {
    limit = SECURITY_CONFIG.RATE_LIMITS.AUTH.requests;
    windowMs = SECURITY_CONFIG.RATE_LIMITS.AUTH.windowMs;
  } else if (endpoint.startsWith('/api/generate/')) {
    limit = SECURITY_CONFIG.RATE_LIMITS.GENERATE.requests;
    windowMs = SECURITY_CONFIG.RATE_LIMITS.GENERATE.windowMs;
  }

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint, limit }, ip);
    return false;
  }

  record.count++;
  return true;
}

// Custom fetch with timeout
const createFetchWithTimeout = (timeoutMs: number = 30000) => {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error('Request timeout in middleware:', { url: input, timeout: timeoutMs });
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }

      if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message?.includes('Connect Timeout Error')) {
        console.error('Connection timeout in middleware:', error);
        throw new Error('Unable to connect to authentication service');
      }

      throw error;
    }
  };
};

export async function middleware(req: NextRequest) {
  let res = NextResponse.next();

  // ✅ IMPORTANT: Create Supabase client and refresh session FIRST
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
      global: {
        fetch: createFetchWithTimeout(30000), // 30 second timeout
      },
    }
  );

  try {
    await supabase.auth.getSession(); // This refreshes the auth cookies!
  } catch (error) {
    console.error('Session refresh error in middleware:', error);
  }

  // Get client IP for rate limiting
  const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!rateLimit(ip, req.nextUrl.pathname)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          }
        }
      );
    }
  }

  // Pages that can be browsed without authentication
  const browsablePages = [
    '/',
    '/about',
    '/contact',
    '/pricing',
    '/documentation',
    '/templates', // Can view templates but not create/edit
    '/auth/signin',
    '/auth/register',
    '/resume', // Can view resume page but not create/save
    '/presentation', // Can view presentation page but not create/save
    '/cv', // Can view CV page but not create/save
    '/letter', // Can view letter page but not create/save
    '/diagram', // Can view diagram page but not create/save
    '/campaign', // Can view campaign generator page
  ];

  // Pages that require full authentication
  const fullyProtectedRoutes = [
    '/profile',
    // '/settings', // Temporarily removed to allow access - settings page handles its own auth
    '/payment-demo',
  ];

  const isBrowsablePage = browsablePages.some(page => {
    if (page === '/') return req.nextUrl.pathname === '/';
    return req.nextUrl.pathname.startsWith(page);
  });

  const isFullyProtectedRoute = fullyProtectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Only enforce authentication for fully protected routes
  if (isFullyProtectedRoute) {
    // Check if we're using placeholder Supabase credentials (development mode)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isUsingPlaceholders = !supabaseUrl || !supabaseKey ||
      supabaseUrl.includes('placeholder') ||
      supabaseKey.includes('placeholder');

    // Skip authentication check in development with placeholder credentials
    if (!isUsingPlaceholders) {
      try {
        // Reuse the supabase client we already created at the top
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          const redirectUrl = new URL('/auth/signin', req.url);
          redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        console.error('Middleware auth error:', error);
        // If there's an error with Supabase, allow access in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Allowing access in development mode due to auth error');
        } else {
          const redirectUrl = new URL('/auth/signin', req.url);
          redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    } else {
      console.log('Skipping auth check - using placeholder credentials');
    }
  }

  // For browsable pages, allow access but components will handle auth for specific activities

  // Add security headers to all responses
  const isDevelopment = process.env.NODE_ENV === 'development';
  const securityHeaders = getSecurityHeaders(isDevelopment);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  res.headers.set('X-DNS-Prefetch-Control', 'off');

  // Add CSRF protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (origin && host && !isAllowedOrigin(origin, host)) {
      logSecurityEvent('CSRF_PROTECTION_TRIGGERED', { origin, host }, ip);
      return new NextResponse(
        JSON.stringify({ error: 'CSRF protection: Invalid origin' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};