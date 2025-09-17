/**
 * Base Repository Class
 * Provides common CRUD operations and validation for all entity repositories
 */

import { schemaManager } from '../database/schema_manager.js';

export class BaseRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = null;
    this.validator = null;
  }

  /**
   * Initialize repository with database connection
   */
  async initialize() {
    try {
      this.collection = schemaManager.getCollection(this.collectionName);
      this.validator = schemaManager.SCHEMA_REGISTRY[this.collectionName]?.validator;

      if (!this.collection) {
        throw new Error(`Collection ${this.collectionName} not found`);
      }

      console.log(`📦 Repository initialized for collection: ${this.collectionName}`);
      return true;
    } catch (error) {
      console.error(`❌ Repository initialization failed for ${this.collectionName}:`, error.message);
      throw error;
    }
  }

  /**
   * Validate document against schema
   */
  async validateDocument(document, isUpdate = false) {
    if (!this.validator) {
      throw new Error(`No validator found for collection: ${this.collectionName}`);
    }

    try {
      // For updates, make validation partial
      if (isUpdate) {
        // Create a partial validation by making all fields optional
        const partialValidator = this.validator.partial();
        const validatedDocument = partialValidator.parse(document);
        return { isValid: true, document: validatedDocument, errors: null };
      } else {
        const validatedDocument = this.validator.parse(document);
        return { isValid: true, document: validatedDocument, errors: null };
      }
    } catch (error) {
      return {
        isValid: false,
        document: null,
        errors: error.errors || [{ message: error.message, path: error.path || [] }]
      };
    }
  }

  /**
   * Create a new document with validation
   */
  async create(document) {
    const startTime = Date.now();

    try {
      // Add timestamps
      const now = new Date();
      const documentWithTimestamps = {
        ...document,
        created_at: now,
        updated_at: now
      };

      // Validate document
      const validation = await this.validateDocument(documentWithTimestamps);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Insert document
      const result = await this.collection.insertOne(validation.document);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Created document in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: { ...validation.document, _id: result.insertedId },
        insertedId: result.insertedId,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Create failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Create multiple documents with batch validation
   */
  async createMany(documents) {
    const startTime = Date.now();

    try {
      const now = new Date();
      const validatedDocuments = [];
      const validationErrors = [];

      // Validate each document
      for (let i = 0; i < documents.length; i++) {
        const documentWithTimestamps = {
          ...documents[i],
          created_at: now,
          updated_at: now
        };

        const validation = await this.validateDocument(documentWithTimestamps);
        if (validation.isValid) {
          validatedDocuments.push(validation.document);
        } else {
          validationErrors.push({
            index: i,
            document: documents[i],
            errors: validation.errors
          });
        }
      }

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed for ${validationErrors.length} documents`);
      }

      // Insert documents
      const result = await this.collection.insertMany(validatedDocuments);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Created ${result.insertedCount} documents in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: validatedDocuments,
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ CreateMany failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Find document by ID
   */
  async findById(id) {
    const startTime = Date.now();

    try {
      const document = await this.collection.findOne({ id: id });

      const executionTime = Date.now() - startTime;

      if (!document) {
        return {
          success: false,
          error: 'Document not found',
          executionTime
        };
      }

      console.log(`✅ Found document by ID in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: document,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ FindById failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Find documents with filtering, sorting, and pagination
   */
  async find(filter = {}, options = {}) {
    const startTime = Date.now();

    try {
      const {
        sort = { updated_at: -1 },
        limit = 50,
        skip = 0,
        projection = null
      } = options;

      let query = this.collection.find(filter);

      if (projection) {
        query = query.project(projection);
      }

      if (sort) {
        query = query.sort(sort);
      }

      if (skip > 0) {
        query = query.skip(skip);
      }

      if (limit > 0) {
        query = query.limit(limit);
      }

      const documents = await query.toArray();
      const total = await this.collection.countDocuments(filter);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Found ${documents.length} documents in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: documents,
        total,
        count: documents.length,
        hasMore: skip + documents.length < total,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Find failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Find one document with filter
   */
  async findOne(filter = {}) {
    const startTime = Date.now();

    try {
      const document = await this.collection.findOne(filter);

      const executionTime = Date.now() - startTime;

      if (!document) {
        return {
          success: false,
          error: 'Document not found',
          executionTime
        };
      }

      console.log(`✅ Found one document in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: document,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ FindOne failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Update document by ID with validation
   */
  async updateById(id, updateData) {
    const startTime = Date.now();

    try {
      // Add updated timestamp
      const updateWithTimestamp = {
        ...updateData,
        updated_at: new Date()
      };

      // Validate update data
      const validation = await this.validateDocument(updateWithTimestamp, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      const result = await this.collection.updateOne(
        { id: id },
        { $set: validation.document }
      );

      const executionTime = Date.now() - startTime;

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Document not found',
          executionTime
        };
      }

      console.log(`✅ Updated document by ID in ${this.collectionName} (${executionTime}ms)`);

      // Return updated document
      const updatedDocument = await this.findById(id);

      return {
        success: true,
        data: updatedDocument.data,
        modifiedCount: result.modifiedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ UpdateById failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Update multiple documents
   */
  async updateMany(filter, updateData) {
    const startTime = Date.now();

    try {
      const updateWithTimestamp = {
        ...updateData,
        updated_at: new Date()
      };

      // Validate update data (partial validation)
      const validation = await this.validateDocument(updateWithTimestamp, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      const result = await this.collection.updateMany(
        filter,
        { $set: validation.document }
      );

      const executionTime = Date.now() - startTime;
      console.log(`✅ Updated ${result.modifiedCount} documents in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ UpdateMany failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Delete document by ID
   */
  async deleteById(id) {
    const startTime = Date.now();

    try {
      const result = await this.collection.deleteOne({ id: id });

      const executionTime = Date.now() - startTime;

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: 'Document not found',
          executionTime
        };
      }

      console.log(`✅ Deleted document by ID in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ DeleteById failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Soft delete by setting is_active to false
   */
  async softDeleteById(id) {
    return this.updateById(id, { is_active: false });
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter) {
    const startTime = Date.now();

    try {
      const result = await this.collection.deleteMany(filter);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Deleted ${result.deletedCount} documents in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ DeleteMany failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Count documents matching filter
   */
  async count(filter = {}) {
    const startTime = Date.now();

    try {
      const count = await this.collection.countDocuments(filter);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Counted ${count} documents in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        count,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Count failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Aggregate documents
   */
  async aggregate(pipeline) {
    const startTime = Date.now();

    try {
      const results = await this.collection.aggregate(pipeline).toArray();

      const executionTime = Date.now() - startTime;
      console.log(`✅ Aggregated ${results.length} results in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: results,
        count: results.length,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Aggregate failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Text search (requires text index)
   */
  async textSearch(searchText, options = {}) {
    const startTime = Date.now();

    try {
      const {
        limit = 20,
        skip = 0,
        sort = { score: { $meta: 'textScore' } }
      } = options;

      const results = await this.collection
        .find(
          { $text: { $search: searchText } },
          { score: { $meta: 'textScore' } }
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      const executionTime = Date.now() - startTime;
      console.log(`✅ Text search found ${results.length} results in ${this.collectionName} (${executionTime}ms)`);

      return {
        success: true,
        data: results,
        count: results.length,
        searchText,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Text search failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Check if document exists
   */
  async exists(filter) {
    const startTime = Date.now();

    try {
      const document = await this.collection.findOne(filter, { projection: { _id: 1 } });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        exists: !!document,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Exists check failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    const startTime = Date.now();

    try {
      const stats = await this.collection.stats();

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        stats: {
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          totalIndexSize: stats.totalIndexSize,
          indexSizes: stats.indexSizes
        },
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Stats failed in ${this.collectionName} (${executionTime}ms):`, error.message);

      return {
        success: false,
        error: error.message,
        executionTime
      };
    }
  }

  /**
   * Perform performance test
   */
  async performanceTest(iterations = 100) {
    const results = {
      collection: this.collectionName,
      iterations,
      tests: {}
    };

    // Test create performance
    const createStart = Date.now();
    for (let i = 0; i < Math.min(iterations, 10); i++) {
      const testDoc = {
        id: `test_${Date.now()}_${i}`,
        test_field: `test_value_${i}`,
        created_at: new Date(),
        updated_at: new Date()
      };

      await this.collection.insertOne(testDoc);
    }
    results.tests.create_avg_ms = (Date.now() - createStart) / Math.min(iterations, 10);

    // Test find performance
    const findStart = Date.now();
    for (let i = 0; i < iterations; i++) {
      await this.collection.findOne({});
    }
    results.tests.find_avg_ms = (Date.now() - findStart) / iterations;

    // Clean up test documents
    await this.collection.deleteMany({ id: { $regex: /^test_/ } });

    // Performance grade
    const avgTime = (results.tests.create_avg_ms + results.tests.find_avg_ms) / 2;
    results.performance_grade = avgTime <= 50 ? 'A' : avgTime <= 100 ? 'B' : avgTime <= 200 ? 'C' : 'D';

    return results;
  }
}

export default BaseRepository;