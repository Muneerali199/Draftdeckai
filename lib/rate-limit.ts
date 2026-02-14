interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

class LRURateLimitCache {
  private cache = new Map<string, RateLimitRecord>();
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  get(key: string): RateLimitRecord | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: RateLimitRecord): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.resetTime < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }

  get size(): number {
    return this.cache.size;
  }
}

const rateLimitCache = new LRURateLimitCache(10000);

setInterval(() => {
  const cleaned = rateLimitCache.cleanupExpired();
  if (cleaned > 0) {
    console.log(`Rate limit cache: Cleaned up ${cleaned} expired entries (current size: ${rateLimitCache.size})`);
  }
}, 60000);

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = now + config.windowMs;
  const key = `ratelimit:${identifier}`;

  const record = rateLimitCache.get(key);

  if (record && record.resetTime > now) {
    const remaining = Math.max(0, config.requests - record.count);

    if (remaining === 0) {
      return {
        success: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    const updatedRecord = {
      count: record.count + 1,
      resetTime: record.resetTime
    };
    rateLimitCache.set(key, updatedRecord);

    return {
      success: true,
      remaining: remaining - 1,
      resetTime: record.resetTime
    };
  }

  const newRecord = {
    count: 1,
    resetTime: resetAt
  };

  rateLimitCache.set(key, newRecord);

  return {
    success: true,
    remaining: config.requests - 1,
    resetTime: resetAt
  };
}

export function getRateLimitStats() {
  return {
    size: rateLimitCache.size,
    maxSize: 10000
  };
}

export function clearRateLimitCache() {
  rateLimitCache.clear();
}
