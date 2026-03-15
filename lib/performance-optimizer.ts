/**
 * Performance optimization utilities for DraftDeckAI
 * Optimized for Vercel Basic plan
 */

import { getGlobalQueue } from './concurrent-queue';

// Performance monitoring
interface PerformanceMetric {
  route: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

export function trackPerformance(route: string, duration: number, success: boolean): void {
  performanceMetrics.push({
    route,
    duration,
    timestamp: Date.now(),
    success,
  });
  
  // Keep only recent metrics
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }
}

export function getPerformanceStats(): {
  avgResponseTime: number;
  successRate: number;
  slowestRoutes: Array<{ route: string; avgDuration: number; count: number }>;
} {
  if (performanceMetrics.length === 0) {
    return { avgResponseTime: 0, successRate: 100, slowestRoutes: [] };
  }
  
  const routeStats = new Map<string, { totalDuration: number; count: number; successes: number }>();
  
  performanceMetrics.forEach(metric => {
    const stats = routeStats.get(metric.route) || { totalDuration: 0, count: 0, successes: 0 };
    stats.totalDuration += metric.duration;
    stats.count++;
    if (metric.success) stats.successes++;
    routeStats.set(metric.route, stats);
  });
  
  const slowestRoutes = Array.from(routeStats.entries())
    .map(([route, stats]) => ({
      route,
      avgDuration: stats.totalDuration / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);
  
  const totalDuration = performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
  const totalSuccesses = performanceMetrics.filter(m => m.success).length;
  
  return {
    avgResponseTime: totalDuration / performanceMetrics.length,
    successRate: (totalSuccesses / performanceMetrics.length) * 100,
    slowestRoutes,
  };
}

// Image optimization
export function optimizeImageUrl(url: string, width: number = 800, quality: number = 80): string {
  // For Vercel Basic, use Next.js image optimization
  if (url.startsWith('/')) {
    return url;
  }
  
  // For external images, use a proxy or CDN if available
  if (process.env.NEXT_PUBLIC_IMAGE_PROXY) {
    return `${process.env.NEXT_PUBLIC_IMAGE_PROXY}?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
  }
  
  return url;
}

// Code splitting helpers
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  return React.lazy(() => 
    Promise.race([
      importFunc(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Component loading timeout')), 10000)
      ),
    ]).catch(error => {
      console.error('Lazy load failed:', error);
      throw error;
    })
  );
}

// Memory optimization
const memoryCache = new Map<string, { data: any; expiry: number }>();
const MAX_CACHE_SIZE = 100;

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000 // 5 minutes
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    const cached = memoryCache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    const result = fn(...args);
    
    // Clean up if cache is too large
    if (memoryCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = Array.from(memoryCache.entries())
        .sort((a, b) => a[1].expiry - b[1].expiry)[0]?.[0];
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    
    memoryCache.set(key, {
      data: result,
      expiry: Date.now() + ttl,
    });
    
    return result;
  }) as T;
}

// Bundle optimization suggestions
export function analyzeBundle(bundleStats: any): string[] {
  const suggestions: string[] = [];
  
  if (bundleStats.totalSize > 500 * 1024) { // > 500KB
    suggestions.push('Consider code splitting for large bundles');
  }
  
  if (bundleStats.thirdPartySize > 300 * 1024) { // > 300KB third-party
    suggestions.push('Review and remove unused dependencies');
  }
  
  if (bundleStats.duplicateModules > 5) {
    suggestions.push('Check for duplicate module imports');
  }
  
  return suggestions;
}

// Request batching for AI API calls
export async function batchAICalls<T>(
  calls: Array<() => Promise<T>>,
  batchSize: number = 3
): Promise<T[]> {
  const queue = getGlobalQueue();
  const results: T[] = [];
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map((call, index) =>
        queue.enqueue({
          id: `ai-call-${i + index}`,
          execute: call,
          priority: 1,
        })
      )
    );
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    });
    
    // Small delay between batches to prevent rate limiting
    if (i + batchSize < calls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Performance monitoring middleware
export function withPerformanceMonitor<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  routeName: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await fn(...args);
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      trackPerformance(routeName, duration, success);
      
      // Log slow requests
      if (duration > 5000) { // > 5 seconds
        console.warn(`Slow request detected: ${routeName} took ${duration}ms`);
      }
    }
  }) as T;
}

// Cache control helpers
export function getCacheHeaders(
  resourceType: 'static' | 'dynamic' | 'api',
  maxAge: number = 3600
): Record<string, string> {
  switch (resourceType) {
    case 'static':
      return {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding',
      };
    case 'dynamic':
      return {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=3600`,
      };
    case 'api':
      return {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
    default:
      return {};
  }
}

// React optimization
import React from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  return React.useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}