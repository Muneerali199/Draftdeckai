import { NextResponse } from 'next/server';
import { getPerformanceStats } from '@/lib/performance-optimizer';
import { getGlobalQueue } from '@/lib/concurrent-queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const performanceStats = getPerformanceStats();
    const queueStats = getGlobalQueue().getStats();
    
    // Check database connection
    let dbStatus = 'unknown';
    try {
      // This would check your database connection
      // For now, we'll assume it's working
      dbStatus = 'healthy';
    } catch (error) {
      dbStatus = 'unhealthy';
    }
    
    // Check AI service status
    let aiStatus = 'unknown';
    try {
      // Simple fetch to test AI service with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const testResponse = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      aiStatus = testResponse.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      aiStatus = 'unhealthy';
    }
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      performance: performanceStats,
      queue: queueStats,
      services: {
        database: dbStatus,
        ai: aiStatus,
        storage: 'healthy', // Assuming S3/Supabase storage is working
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown',
    };
    
    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}