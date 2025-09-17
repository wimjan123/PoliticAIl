// Redis Helper Utilities for Political Desktop OS Simulation
// Cache management, job queues, and real-time data operations

import { redisConfig } from '../config/database.js';

/**
 * Cache Manager for frequently accessed data
 */
class CacheManager {
  constructor(prefix = 'politicai:cache:') {
    this.prefix = prefix;
    this.defaultTTL = parseInt(process.env.REDIS_CACHE_TTL) || 3600; // 1 hour default
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set cache value with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = redisConfig.getClient();
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        ttl
      });

      await client.setEx(cacheKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    try {
      const client = redisConfig.getClient();
      const cacheKey = this.generateKey(key);
      const value = await client.get(cacheKey);

      if (!value) return null;

      const parsed = JSON.parse(value);
      return parsed.data;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key) {
    try {
      const client = redisConfig.getClient();
      const cacheKey = this.generateKey(key);
      const result = await client.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      const client = redisConfig.getClient();
      const cacheKey = this.generateKey(key);
      const result = await client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set multiple cache values
   */
  async setMultiple(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const client = redisConfig.getClient();
      const pipeline = client.multi();

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const cacheKey = this.generateKey(key);
        const serializedValue = JSON.stringify({
          data: value,
          timestamp: Date.now(),
          ttl
        });
        pipeline.setEx(cacheKey, ttl, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache setMultiple error:', error.message);
      return false;
    }
  }

  /**
   * Get multiple cache values
   */
  async getMultiple(keys) {
    try {
      const client = redisConfig.getClient();
      const cacheKeys = keys.map(key => this.generateKey(key));
      const values = await client.mGet(cacheKeys);

      const result = {};
      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          try {
            const parsed = JSON.parse(value);
            result[key] = parsed.data;
          } catch (parseError) {
            result[key] = null;
          }
        } else {
          result[key] = null;
        }
      });

      return result;
    } catch (error) {
      console.error('Cache getMultiple error:', error.message);
      return {};
    }
  }

  /**
   * Increment numeric cache value
   */
  async increment(key, amount = 1, ttl = this.defaultTTL) {
    try {
      const client = redisConfig.getClient();
      const cacheKey = this.generateKey(key);
      const result = await client.incrBy(cacheKey, amount);
      await client.expire(cacheKey, ttl);
      return result;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Clear all cache with prefix
   */
  async clear() {
    try {
      const client = redisConfig.getClient();
      const keys = await client.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return 0;
    }
  }
}

/**
 * Job Queue Manager for LLM and background processing
 */
class JobQueueManager {
  constructor(prefix = 'politicai:queue:') {
    this.prefix = prefix;
    this.defaultPriority = 5;
    this.defaultTTL = parseInt(process.env.REDIS_QUEUE_DEFAULT_TTL) || 86400; // 24 hours
  }

  /**
   * Generate queue key
   */
  generateQueueKey(queueName) {
    return `${this.prefix}${queueName}`;
  }

  /**
   * Generate job key for tracking
   */
  generateJobKey(jobId) {
    return `${this.prefix}job:${jobId}`;
  }

  /**
   * Enqueue a job
   */
  async enqueue(queueName, jobData, options = {}) {
    try {
      const client = redisConfig.getClient();
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const job = {
        id: jobId,
        data: jobData,
        priority: options.priority || this.defaultPriority,
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        createdAt: new Date().toISOString(),
        status: 'pending',
        queueName
      };

      // Store job details
      const jobKey = this.generateJobKey(jobId);
      await client.setEx(jobKey, this.defaultTTL, JSON.stringify(job));

      // Add to priority queue (sorted set by priority and timestamp)
      const queueKey = this.generateQueueKey(queueName);
      const score = (10 - job.priority) * 1000000 + Date.now(); // Higher priority = lower score
      await client.zAdd(queueKey, { score, value: jobId });

      console.log(`📤 Job ${jobId} enqueued to ${queueName} with priority ${job.priority}`);
      return jobId;
    } catch (error) {
      console.error(`Job enqueue error for queue ${queueName}:`, error.message);
      throw error;
    }
  }

  /**
   * Dequeue a job (get highest priority job)
   */
  async dequeue(queueName, timeout = 10) {
    try {
      const client = redisConfig.getClient();
      const queueKey = this.generateQueueKey(queueName);

      // Use blocking pop to wait for jobs
      const result = await client.bzPopMin(queueKey, timeout);

      if (!result) return null;

      const jobId = result.value;
      const jobKey = this.generateJobKey(jobId);
      const jobDataString = await client.get(jobKey);

      if (!jobDataString) {
        console.warn(`Job ${jobId} data not found`);
        return null;
      }

      const job = JSON.parse(jobDataString);

      // Update job status to processing
      job.status = 'processing';
      job.startedAt = new Date().toISOString();
      job.attempts += 1;

      await client.setEx(jobKey, this.defaultTTL, JSON.stringify(job));

      console.log(`📥 Job ${jobId} dequeued from ${queueName}`);
      return job;
    } catch (error) {
      console.error(`Job dequeue error for queue ${queueName}:`, error.message);
      return null;
    }
  }

  /**
   * Complete a job
   */
  async completeJob(jobId, result = null) {
    try {
      const client = redisConfig.getClient();
      const jobKey = this.generateJobKey(jobId);
      const jobDataString = await client.get(jobKey);

      if (!jobDataString) {
        console.warn(`Job ${jobId} not found for completion`);
        return false;
      }

      const job = JSON.parse(jobDataString);
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.result = result;

      // Store completed job with shorter TTL
      await client.setEx(jobKey, 3600, JSON.stringify(job)); // 1 hour for completed jobs

      console.log(`✅ Job ${jobId} completed successfully`);
      return true;
    } catch (error) {
      console.error(`Job completion error for ${jobId}:`, error.message);
      return false;
    }
  }

  /**
   * Fail a job
   */
  async failJob(jobId, error, retry = true) {
    try {
      const client = redisConfig.getClient();
      const jobKey = this.generateJobKey(jobId);
      const jobDataString = await client.get(jobKey);

      if (!jobDataString) {
        console.warn(`Job ${jobId} not found for failure`);
        return false;
      }

      const job = JSON.parse(jobDataString);

      if (retry && job.attempts < job.maxAttempts) {
        // Retry job with backoff
        const delay = Math.pow(2, job.attempts) * 1000; // Exponential backoff
        job.status = 'retrying';
        job.lastError = error;
        job.retryAt = new Date(Date.now() + delay).toISOString();

        await client.setEx(jobKey, this.defaultTTL, JSON.stringify(job));

        // Re-queue with delay
        setTimeout(async () => {
          const queueKey = this.generateQueueKey(job.queueName);
          const score = (10 - job.priority) * 1000000 + Date.now();
          await client.zAdd(queueKey, { score, value: jobId });
        }, delay);

        console.log(`🔄 Job ${jobId} scheduled for retry in ${delay}ms`);
        return true;
      } else {
        // Permanently fail job
        job.status = 'failed';
        job.failedAt = new Date().toISOString();
        job.error = error;

        await client.setEx(jobKey, 3600, JSON.stringify(job)); // 1 hour for failed jobs

        console.log(`❌ Job ${jobId} permanently failed: ${error}`);
        return false;
      }
    } catch (jobError) {
      console.error(`Job failure handling error for ${jobId}:`, jobError.message);
      return false;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    try {
      const client = redisConfig.getClient();
      const jobKey = this.generateJobKey(jobId);
      const jobDataString = await client.get(jobKey);

      if (!jobDataString) return null;

      return JSON.parse(jobDataString);
    } catch (error) {
      console.error(`Job status error for ${jobId}:`, error.message);
      return null;
    }
  }

  /**
   * Get queue length
   */
  async getQueueLength(queueName) {
    try {
      const client = redisConfig.getClient();
      const queueKey = this.generateQueueKey(queueName);
      return await client.zCard(queueKey);
    } catch (error) {
      console.error(`Queue length error for ${queueName}:`, error.message);
      return 0;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName) {
    try {
      const client = redisConfig.getClient();
      const queueLength = await this.getQueueLength(queueName);

      // Get job status counts
      const jobKeys = await client.keys(`${this.prefix}job:*`);
      const statusCounts = { pending: 0, processing: 0, completed: 0, failed: 0, retrying: 0 };

      for (const jobKey of jobKeys) {
        try {
          const jobDataString = await client.get(jobKey);
          if (jobDataString) {
            const job = JSON.parse(jobDataString);
            if (job.queueName === queueName) {
              statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
            }
          }
        } catch (parseError) {
          // Skip malformed job data
        }
      }

      return {
        queueName,
        queueLength,
        statusCounts,
        totalJobs: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      console.error(`Queue stats error for ${queueName}:`, error.message);
      return null;
    }
  }

  /**
   * Clear queue
   */
  async clearQueue(queueName) {
    try {
      const client = redisConfig.getClient();
      const queueKey = this.generateQueueKey(queueName);
      const result = await client.del(queueKey);
      return result > 0;
    } catch (error) {
      console.error(`Queue clear error for ${queueName}:`, error.message);
      return false;
    }
  }
}

/**
 * Real-time Event Publisher for game state updates
 */
class EventPublisher {
  constructor(prefix = 'politicai:events:') {
    this.prefix = prefix;
  }

  /**
   * Publish event to channel
   */
  async publish(channel, eventData) {
    try {
      const client = redisConfig.getClient();
      const fullChannel = `${this.prefix}${channel}`;

      const event = {
        ...eventData,
        timestamp: new Date().toISOString(),
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const subscriberCount = await client.publish(fullChannel, JSON.stringify(event));
      console.log(`📡 Event published to ${fullChannel}, ${subscriberCount} subscribers notified`);

      return event.id;
    } catch (error) {
      console.error(`Event publish error for channel ${channel}:`, error.message);
      return null;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribe(channel, callback) {
    try {
      const client = redisConfig.getClient();
      const subscriber = client.duplicate();
      await subscriber.connect();

      const fullChannel = `${this.prefix}${channel}`;

      await subscriber.subscribe(fullChannel, (message) => {
        try {
          const event = JSON.parse(message);
          callback(event);
        } catch (parseError) {
          console.error('Event parse error:', parseError.message);
        }
      });

      console.log(`🔔 Subscribed to events on ${fullChannel}`);
      return subscriber;
    } catch (error) {
      console.error(`Event subscribe error for channel ${channel}:`, error.message);
      return null;
    }
  }
}

/**
 * Session Manager for user sessions
 */
class SessionManager {
  constructor(prefix = 'politicai:session:') {
    this.prefix = prefix;
    this.defaultTTL = parseInt(process.env.SESSION_MAX_AGE) / 1000 || 86400; // 24 hours
  }

  /**
   * Create user session
   */
  async createSession(userId, sessionData = {}) {
    try {
      const client = redisConfig.getClient();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      const sessionKey = `${this.prefix}${sessionId}`;

      const session = {
        sessionId,
        userId,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        ...sessionData
      };

      await client.setEx(sessionKey, this.defaultTTL, JSON.stringify(session));
      console.log(`🔐 Session ${sessionId} created for user ${userId}`);

      return sessionId;
    } catch (error) {
      console.error(`Session creation error for user ${userId}:`, error.message);
      return null;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId) {
    try {
      const client = redisConfig.getClient();
      const sessionKey = `${this.prefix}${sessionId}`;
      const sessionDataString = await client.get(sessionKey);

      if (!sessionDataString) return null;

      const session = JSON.parse(sessionDataString);

      // Update last accessed time
      session.lastAccessedAt = new Date().toISOString();
      await client.setEx(sessionKey, this.defaultTTL, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error(`Session get error for ${sessionId}:`, error.message);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(sessionId, updateData) {
    try {
      const client = redisConfig.getClient();
      const sessionKey = `${this.prefix}${sessionId}`;
      const sessionDataString = await client.get(sessionKey);

      if (!sessionDataString) return false;

      const session = JSON.parse(sessionDataString);
      const updatedSession = {
        ...session,
        ...updateData,
        lastAccessedAt: new Date().toISOString()
      };

      await client.setEx(sessionKey, this.defaultTTL, JSON.stringify(updatedSession));
      return true;
    } catch (error) {
      console.error(`Session update error for ${sessionId}:`, error.message);
      return false;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    try {
      const client = redisConfig.getClient();
      const sessionKey = `${this.prefix}${sessionId}`;
      const result = await client.del(sessionKey);

      if (result > 0) {
        console.log(`🔓 Session ${sessionId} deleted`);
      }

      return result > 0;
    } catch (error) {
      console.error(`Session delete error for ${sessionId}:`, error.message);
      return false;
    }
  }
}

// Export instances
export const cacheManager = new CacheManager();
export const jobQueueManager = new JobQueueManager();
export const eventPublisher = new EventPublisher();
export const sessionManager = new SessionManager();

// Export classes for custom instances
export { CacheManager, JobQueueManager, EventPublisher, SessionManager };

// Default export
export default {
  cache: cacheManager,
  queue: jobQueueManager,
  events: eventPublisher,
  sessions: sessionManager
};