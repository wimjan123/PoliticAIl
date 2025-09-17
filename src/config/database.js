// Database Configuration for Political Desktop OS Simulation
// MongoDB and Redis connection management with health checks

import { MongoClient } from 'mongodb';
import redis from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

/**
 * MongoDB Configuration and Connection Management
 */
class MongoDBConfig {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionString = process.env.MONGODB_URL || 'mongodb://politicai_app:politicai_app_2025@localhost:27017/politicai';
    this.dbName = process.env.MONGO_DATABASE || 'politicai';

    // MongoDB connection options
    this.options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000
      }
    };
  }

  /**
   * Establish connection to MongoDB
   */
  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB...');

      this.client = new MongoClient(this.connectionString, this.options);
      await this.client.connect();

      // Test the connection
      await this.client.db('admin').command({ ping: 1 });

      this.db = this.client.db(this.dbName);
      this.isConnected = true;

      console.log('✅ MongoDB connected successfully');
      console.log(`📍 Database: ${this.dbName}`);

      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get database instance
   */
  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Get collection with proper error handling
   */
  getCollection(name) {
    const db = this.getDatabase();
    return db.collection(name);
  }

  /**
   * Health check for MongoDB
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'MongoDB not connected' };
      }

      const adminDb = this.client.db('admin');
      const result = await adminDb.command({ ping: 1 });

      if (result.ok === 1) {
        const stats = await this.db.stats();
        return {
          status: 'healthy',
          message: 'MongoDB is responsive',
          details: {
            database: this.dbName,
            collections: stats.collections,
            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
          }
        };
      } else {
        return { status: 'unhealthy', message: 'MongoDB ping failed' };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `MongoDB health check failed: ${error.message}`
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('🔌 MongoDB disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting MongoDB:', error.message);
    }
  }

  /**
   * Create indexes for optimal performance
   */
  async createIndexes() {
    try {
      console.log('🔍 Creating database indexes...');
      const db = this.getDatabase();

      // Politicians collection indexes
      const politiciansCollection = db.collection('politicians');
      await politiciansCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_politicians_id' });
      await politiciansCollection.createIndex({ 'party.id': 1, 'approval_rating.overall': -1 }, { name: 'idx_politicians_party_approval' });
      await politiciansCollection.createIndex({ 'attributes.charisma': -1, 'attributes.intelligence': -1 }, { name: 'idx_politicians_top_performers' });

      // Game events collection indexes
      const eventsCollection = db.collection('game_events');
      await eventsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_events_id' });
      await eventsCollection.createIndex({ occurrence_time: -1 }, { name: 'idx_events_time' });
      await eventsCollection.createIndex({ severity: 1, media_attention_level: -1 }, { name: 'idx_events_severity_attention' });

      // Social media posts collection indexes
      const postsCollection = db.collection('social_media_posts');
      await postsCollection.createIndex({ id: 1 }, { unique: true, name: 'idx_posts_id' });
      await postsCollection.createIndex({ platform: 1, 'publication.actual_publish_time': -1 }, { name: 'idx_posts_platform_time' });

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      throw error;
    }
  }
}

/**
 * Redis Configuration and Connection Management
 */
class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retry_unfulfilled_commands: true,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    };
  }

  /**
   * Establish connection to Redis
   */
  async connect() {
    try {
      console.log('🔌 Connecting to Redis...');

      this.client = redis.createClient(this.connectionOptions);

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('🚀 Redis ready for operations');
      });

      this.client.on('end', () => {
        console.log('🔌 Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();

      // Test the connection
      await this.client.ping();

      console.log(`📍 Redis Database: ${this.connectionOptions.db}`);

      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Health check for Redis
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Redis not connected' };
      }

      const pong = await this.client.ping();

      if (pong === 'PONG') {
        const info = await this.client.info();
        const lines = info.split('\r\n');
        const memory = lines.find(line => line.startsWith('used_memory_human:'));
        const connections = lines.find(line => line.startsWith('connected_clients:'));

        return {
          status: 'healthy',
          message: 'Redis is responsive',
          details: {
            memory: memory ? memory.split(':')[1] : 'unknown',
            connections: connections ? connections.split(':')[1] : 'unknown',
            database: this.connectionOptions.db
          }
        };
      } else {
        return { status: 'unhealthy', message: 'Redis ping failed' };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Redis health check failed: ${error.message}`
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('🔌 Redis disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting Redis:', error.message);
    }
  }

  /**
   * Cache helper methods
   */
  async setCache(key, value, ttl = 3600) {
    const client = this.getClient();
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, ttl, serializedValue);
  }

  async getCache(key) {
    const client = this.getClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async deleteCache(key) {
    const client = this.getClient();
    return await client.del(key);
  }

  /**
   * Queue helper methods for LLM job processing
   */
  async enqueueJob(queueName, jobData, priority = 5) {
    const client = this.getClient();
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: jobData,
      priority,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    await client.lPush(`queue:${queueName}`, JSON.stringify(job));
    return job.id;
  }

  async dequeueJob(queueName) {
    const client = this.getClient();
    const jobString = await client.rPop(`queue:${queueName}`);
    return jobString ? JSON.parse(jobString) : null;
  }
}

// Singleton instances
const mongoConfig = new MongoDBConfig();
const redisConfig = new RedisConfig();

/**
 * Initialize all database connections
 */
export async function initializeDatabases() {
  try {
    console.log('🚀 Initializing database connections...');

    // Connect to MongoDB
    await mongoConfig.connect();

    // Connect to Redis
    await redisConfig.connect();

    // Create MongoDB indexes
    await mongoConfig.createIndexes();

    console.log('✅ All database connections initialized successfully');

    return {
      mongodb: mongoConfig.getDatabase(),
      redis: redisConfig.getClient()
    };
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Perform health checks on all services
 */
export async function performHealthChecks() {
  const results = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    services: {}
  };

  try {
    // MongoDB health check
    results.services.mongodb = await mongoConfig.healthCheck();

    // Redis health check
    results.services.redis = await redisConfig.healthCheck();

    // Determine overall health
    const hasUnhealthy = Object.values(results.services).some(
      service => service.status === 'unhealthy' || service.status === 'error'
    );

    if (hasUnhealthy) {
      results.overall = 'unhealthy';
    }

    return results;
  } catch (error) {
    results.overall = 'error';
    results.error = error.message;
    return results;
  }
}

/**
 * Gracefully close all database connections
 */
export async function closeDatabases() {
  console.log('🔌 Closing database connections...');

  await Promise.all([
    mongoConfig.disconnect(),
    redisConfig.disconnect()
  ]);

  console.log('✅ All database connections closed');
}

// Export configuration instances
export { mongoConfig, redisConfig };

// Default export for convenience
export default {
  mongodb: mongoConfig,
  redis: redisConfig,
  initialize: initializeDatabases,
  healthCheck: performHealthChecks,
  close: closeDatabases
};