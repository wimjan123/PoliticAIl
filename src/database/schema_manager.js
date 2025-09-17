/**
 * Database Schema Manager
 * Comprehensive schema management for all political entity collections
 */

import { mongoConfig } from '../config/database.js';
import politiciansSchema from './schemas/politicians.js';
import politicalBlocsSchema from './schemas/political_blocs.js';
import policiesSchema from './schemas/policies.js';
import politicalEventsSchema from './schemas/political_events.js';
import relationshipsSchema from './schemas/relationships.js';

/**
 * Schema Registry - Central registry for all collection schemas
 */
export const SCHEMA_REGISTRY = {
  politicians: politiciansSchema,
  political_blocs: politicalBlocsSchema,
  policies: policiesSchema,
  political_events: politicalEventsSchema,
  relationships: relationshipsSchema
};

/**
 * Database Schema Manager Class
 * Handles schema creation, validation, and index management
 */
export class SchemaManager {
  constructor() {
    this.db = null;
    this.collections = new Map();
    this.indexStats = new Map();
  }

  /**
   * Initialize schema manager with database connection
   */
  async initialize() {
    try {
      this.db = mongoConfig.getDatabase();
      console.log('📋 Schema Manager initialized');
      return true;
    } catch (error) {
      console.error('❌ Schema Manager initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Create all collections with validation schemas
   */
  async createAllCollections() {
    const results = [];

    for (const [collectionName, schemaConfig] of Object.entries(SCHEMA_REGISTRY)) {
      try {
        console.log(`📋 Creating collection: ${collectionName}`);

        // Check if collection already exists
        const collections = await this.db.listCollections({ name: collectionName }).toArray();

        if (collections.length > 0) {
          console.log(`📋 Collection ${collectionName} already exists, updating schema...`);
          await this.updateCollectionValidation(collectionName, schemaConfig.schema);
        } else {
          // Create new collection with validation
          await this.db.createCollection(collectionName, schemaConfig.schema);
          console.log(`✅ Created collection: ${collectionName}`);
        }

        this.collections.set(collectionName, this.db.collection(collectionName));
        results.push({ collection: collectionName, status: 'success' });

      } catch (error) {
        console.error(`❌ Failed to create collection ${collectionName}:`, error.message);
        results.push({ collection: collectionName, status: 'error', error: error.message });
      }
    }

    return results;
  }

  /**
   * Update collection validation schema
   */
  async updateCollectionValidation(collectionName, validationSchema) {
    try {
      await this.db.command({
        collMod: collectionName,
        validator: validationSchema.validator,
        validationLevel: validationSchema.validationLevel || 'strict',
        validationAction: validationSchema.validationAction || 'error'
      });
      console.log(`✅ Updated validation for collection: ${collectionName}`);
    } catch (error) {
      console.error(`❌ Failed to update validation for ${collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Create all indexes for optimal performance
   */
  async createAllIndexes() {
    const results = [];
    let totalIndexesCreated = 0;

    for (const [collectionName, schemaConfig] of Object.entries(SCHEMA_REGISTRY)) {
      try {
        console.log(`🔍 Creating indexes for collection: ${collectionName}`);

        const collection = this.db.collection(collectionName);
        const indexResults = [];

        // Create each index defined in the schema
        for (const indexDef of schemaConfig.indexes) {
          try {
            const indexName = await collection.createIndex(indexDef.key, indexDef.options);
            indexResults.push({ index: indexName, status: 'success' });
            totalIndexesCreated++;
          } catch (error) {
            // Index might already exist, which is acceptable
            if (error.code === 85) { // IndexKeySpecsConflict
              indexResults.push({
                index: indexDef.options.name,
                status: 'exists',
                message: 'Index already exists with different specification'
              });
            } else if (error.code === 86) { // IndexOptionsConflict
              indexResults.push({
                index: indexDef.options.name,
                status: 'exists',
                message: 'Index already exists'
              });
            } else {
              console.error(`❌ Failed to create index ${indexDef.options.name}:`, error.message);
              indexResults.push({
                index: indexDef.options.name,
                status: 'error',
                error: error.message
              });
            }
          }
        }

        // Get index statistics
        const indexStats = await this.getCollectionIndexStats(collectionName);
        this.indexStats.set(collectionName, indexStats);

        results.push({
          collection: collectionName,
          indexResults,
          totalIndexes: indexResults.length,
          indexStats
        });

        console.log(`✅ Created ${indexResults.filter(r => r.status === 'success').length} indexes for ${collectionName}`);

      } catch (error) {
        console.error(`❌ Failed to create indexes for ${collectionName}:`, error.message);
        results.push({
          collection: collectionName,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`🚀 Index creation completed. Total indexes created: ${totalIndexesCreated}`);
    return results;
  }

  /**
   * Get comprehensive index statistics for a collection
   */
  async getCollectionIndexStats(collectionName) {
    try {
      const collection = this.db.collection(collectionName);
      const indexes = await collection.indexes();
      const stats = await collection.stats();

      return {
        indexCount: indexes.length,
        totalIndexSize: stats.totalIndexSize || 0,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique || false,
          sparse: idx.sparse || false,
          textIndexVersion: idx.textIndexVersion || null
        }))
      };
    } catch (error) {
      console.error(`❌ Failed to get index stats for ${collectionName}:`, error.message);
      return { indexCount: 0, totalIndexSize: 0, indexes: [] };
    }
  }

  /**
   * Validate document against schema
   */
  async validateDocument(collectionName, document) {
    const schemaConfig = SCHEMA_REGISTRY[collectionName];
    if (!schemaConfig) {
      throw new Error(`No schema found for collection: ${collectionName}`);
    }

    try {
      const validatedDocument = schemaConfig.validator.parse(document);
      return { isValid: true, document: validatedDocument };
    } catch (error) {
      return {
        isValid: false,
        errors: error.errors || [{ message: error.message }],
        document: null
      };
    }
  }

  /**
   * Get collection with schema validation
   */
  getCollection(collectionName) {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} not initialized`);
    }
    return this.collections.get(collectionName);
  }

  /**
   * Perform comprehensive performance analysis
   */
  async analyzePerformance() {
    const results = {};

    for (const [collectionName] of Object.entries(SCHEMA_REGISTRY)) {
      try {
        const collection = this.db.collection(collectionName);

        // Collection statistics
        const stats = await collection.stats();

        // Sample query performance test
        const queryStart = Date.now();
        await collection.findOne({});
        const queryTime = Date.now() - queryStart;

        // Index usage statistics
        const indexStats = await this.getCollectionIndexStats(collectionName);

        results[collectionName] = {
          documentCount: stats.count || 0,
          storageSize: stats.size || 0,
          indexSize: stats.totalIndexSize || 0,
          avgObjectSize: stats.avgObjSize || 0,
          sampleQueryTime: queryTime,
          indexCount: indexStats.indexCount,
          performanceGrade: this.calculatePerformanceGrade(queryTime, indexStats.indexCount)
        };

      } catch (error) {
        results[collectionName] = {
          error: error.message,
          performanceGrade: 'F'
        };
      }
    }

    return results;
  }

  /**
   * Calculate performance grade based on query time and index coverage
   */
  calculatePerformanceGrade(queryTime, indexCount) {
    let score = 100;

    // Penalize slow queries
    if (queryTime > 50) score -= 30;
    else if (queryTime > 20) score -= 15;
    else if (queryTime > 10) score -= 5;

    // Reward good index coverage
    if (indexCount >= 15) score += 10;
    else if (indexCount >= 10) score += 5;
    else if (indexCount < 5) score -= 20;

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Drop all collections (use with caution!)
   */
  async dropAllCollections() {
    const results = [];

    for (const collectionName of Object.keys(SCHEMA_REGISTRY)) {
      try {
        await this.db.collection(collectionName).drop();
        console.log(`🗑️ Dropped collection: ${collectionName}`);
        results.push({ collection: collectionName, status: 'dropped' });
      } catch (error) {
        if (error.code === 26) { // NamespaceNotFound
          results.push({ collection: collectionName, status: 'not_found' });
        } else {
          console.error(`❌ Failed to drop collection ${collectionName}:`, error.message);
          results.push({ collection: collectionName, status: 'error', error: error.message });
        }
      }
    }

    this.collections.clear();
    this.indexStats.clear();

    return results;
  }

  /**
   * Comprehensive health check for all collections
   */
  async healthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      collections: {},
      summary: {
        total_collections: 0,
        healthy_collections: 0,
        total_indexes: 0,
        total_documents: 0,
        performance_issues: []
      }
    };

    for (const [collectionName] of Object.entries(SCHEMA_REGISTRY)) {
      try {
        const collection = this.db.collection(collectionName);

        // Basic collection health
        const stats = await collection.stats();
        const indexStats = await this.getCollectionIndexStats(collectionName);

        // Performance test
        const queryStart = Date.now();
        await collection.findOne({});
        const queryTime = Date.now() - queryStart;

        const collectionHealth = {
          exists: true,
          document_count: stats.count || 0,
          index_count: indexStats.indexCount,
          storage_size_mb: Math.round((stats.size || 0) / 1024 / 1024 * 100) / 100,
          index_size_mb: Math.round((stats.totalIndexSize || 0) / 1024 / 1024 * 100) / 100,
          query_performance_ms: queryTime,
          performance_grade: this.calculatePerformanceGrade(queryTime, indexStats.indexCount),
          status: queryTime <= 50 ? 'healthy' : 'performance_issue'
        };

        results.collections[collectionName] = collectionHealth;
        results.summary.total_collections++;
        results.summary.total_indexes += indexStats.indexCount;
        results.summary.total_documents += stats.count || 0;

        if (collectionHealth.status === 'healthy') {
          results.summary.healthy_collections++;
        } else {
          results.summary.performance_issues.push({
            collection: collectionName,
            issue: `Query time ${queryTime}ms exceeds 50ms target`,
            query_time: queryTime
          });
        }

      } catch (error) {
        results.collections[collectionName] = {
          exists: false,
          error: error.message,
          status: 'error'
        };
        results.summary.total_collections++;
      }
    }

    // Determine overall status
    if (results.summary.performance_issues.length > 0) {
      results.overall_status = 'performance_issues';
    }

    if (results.summary.healthy_collections < results.summary.total_collections * 0.8) {
      results.overall_status = 'unhealthy';
    }

    return results;
  }

  /**
   * Get schema registry information
   */
  getSchemaInfo() {
    const info = {};

    for (const [collectionName, schemaConfig] of Object.entries(SCHEMA_REGISTRY)) {
      info[collectionName] = {
        total_indexes: schemaConfig.indexes.length,
        has_text_search: schemaConfig.indexes.some(idx =>
          Object.values(idx.key).some(val => val === 'text')
        ),
        has_unique_constraints: schemaConfig.indexes.some(idx => idx.options.unique),
        validation_level: schemaConfig.schema.validationLevel || 'strict'
      };
    }

    return info;
  }
}

// Export singleton instance
export const schemaManager = new SchemaManager();

export default {
  SchemaManager,
  schemaManager,
  SCHEMA_REGISTRY
};