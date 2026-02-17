/**
 * Concurrent request queue for handling multiple API requests efficiently
 * Optimized for Vercel Basic plan limitations
 */

export interface QueueTask<T = any> {
  id: string;
  execute: () => Promise<T>;
  priority?: number;
  timeout?: number;
}

export interface QueueConfig {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class ConcurrentQueue {
  private queue: Array<QueueTask> = [];
  private activeTasks: Set<string> = new Set();
  private completedTasks: Map<string, any> = new Map();
  private failedTasks: Map<string, Error> = new Map();
  private config: QueueConfig;
  
  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 5, // Vercel Basic: 5 concurrent requests
      timeout: config.timeout || 30000, // 30 seconds
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    };
  }
  
  async enqueue<T>(task: QueueTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask: QueueTask<T> = {
        ...task,
        execute: async () => {
          let attempts = 0;
          let lastError: Error | null = null;
          
          while (attempts <= this.config.retryAttempts) {
            try {
              const result = await Promise.race([
                task.execute(),
                new Promise<never>((_, rej) =>
                  setTimeout(() => rej(new Error(`Task ${task.id} timeout after ${this.config.timeout}ms`)), 
                  this.config.timeout)
                ),
              ]);
              
              this.completedTasks.set(task.id, result);
              this.activeTasks.delete(task.id);
              resolve(result);
              return result;
            } catch (error) {
              lastError = error as Error;
              attempts++;
              
              if (attempts <= this.config.retryAttempts) {
                await this.delay(this.config.retryDelay * attempts);
              }
            }
          }
          
          if (lastError) {
            this.failedTasks.set(task.id, lastError);
            this.activeTasks.delete(task.id);
            reject(lastError);
            throw lastError;
          }
          
          throw new Error(`Task ${task.id} failed without error`);
        },
      };
      
      this.queue.push(wrappedTask);
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    // Check if we can process more tasks
    while (
      this.activeTasks.size < this.config.maxConcurrent &&
      this.queue.length > 0
    ) {
      const task = this.queue.shift();
      if (!task) continue;
      
      // Skip if already completed or failed
      if (this.completedTasks.has(task.id) || this.failedTasks.has(task.id)) {
        continue;
      }
      
      this.activeTasks.add(task.id);
      
      // Execute task in background
      task.execute().catch(() => {
        // Errors are already handled in the wrapped execute
      });
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getStats() {
    return {
      queueLength: this.queue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.size,
      maxConcurrent: this.config.maxConcurrent,
    };
  }
  
  clear(): void {
    this.queue = [];
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.failedTasks.clear();
  }
}

// Global queue instance (singleton)
let globalQueue: ConcurrentQueue | null = null;

export function getGlobalQueue(): ConcurrentQueue {
  if (!globalQueue) {
    globalQueue = new ConcurrentQueue({
      maxConcurrent: 5, // Optimized for Vercel Basic
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });
  }
  return globalQueue;
}

// Utility functions for common API patterns
export async function batchExecute<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 3
): Promise<T[]> {
  const queue = new ConcurrentQueue({ maxConcurrent: concurrency });
  const results: T[] = [];
  const errors: Error[] = [];
  
  const promises = tasks.map((task, index) =>
    queue.enqueue({
      id: `batch-task-${index}`,
      execute: task,
    })
      .then(result => {
        results.push(result);
        return result;
      })
      .catch(error => {
        errors.push(error);
        throw error;
      })
  );
  
  await Promise.allSettled(promises);
  return results;
}

export async function rateLimitedFetch(
  url: string,
  options?: RequestInit,
  priority: number = 1
): Promise<Response> {
  const queue = getGlobalQueue();
  
  return queue.enqueue({
    id: `fetch-${url}`,
    priority,
    execute: async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    },
  });
}

// Example usage:
/*
// Batch processing multiple API calls
const results = await batchExecute([
  () => fetch('/api/generate/presentation', { method: 'POST' }),
  () => fetch('/api/generate/resume', { method: 'POST' }),
  () => fetch('/api/generate/letter', { method: 'POST' }),
]);

// Rate-limited fetch
const response = await rateLimitedFetch('/api/heavy-endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
});
*/