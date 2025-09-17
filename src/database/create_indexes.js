/**
 * Database Index Creation Script
 * Creates optimized indexes for all collections to achieve <50ms query performance
 */

import { schemaManager } from './schema_manager.js';
import { mongoConfig } from '../config/database.js';

/**
 * Enhanced Index Creation with Performance Optimization
 */
export class IndexCreator {
  constructor() {
    this.db = null;
    this.createdIndexes = [];
    this.indexErrors = [];
  }

  /**
   * Initialize and create all indexes
   */
  async createAllIndexes() {
    console.log('🔍 Starting comprehensive index creation...');

    try {
      // Initialize database connection
      this.db = mongoConfig.getDatabase();

      // Create schema-defined indexes
      await this.createSchemaIndexes();

      // Create additional performance indexes
      await this.createPerformanceIndexes();

      // Create compound indexes for common queries
      await this.createCompoundIndexes();

      // Validate index creation
      await this.validateIndexes();

      // Generate performance report
      const report = await this.generatePerformanceReport();

      console.log('✅ Index creation completed successfully');
      return {
        success: true,
        createdIndexes: this.createdIndexes,
        errors: this.indexErrors,
        report
      };

    } catch (error) {
      console.error('❌ Index creation failed:', error.message);
      return {
        success: false,
        error: error.message,
        createdIndexes: this.createdIndexes,
        errors: this.indexErrors
      };
    }
  }

  /**
   * Create indexes defined in schemas
   */
  async createSchemaIndexes() {
    console.log('📋 Creating schema-defined indexes...');

    for (const [collectionName, schemaConfig] of Object.entries(schemaManager.SCHEMA_REGISTRY)) {
      await this.createCollectionIndexes(collectionName, schemaConfig.indexes);
    }
  }

  /**
   * Create additional performance-optimized indexes
   */
  async createPerformanceIndexes() {
    console.log('⚡ Creating performance-optimized indexes...');

    // Additional politicians indexes for complex queries
    await this.createCollectionIndexes('politicians', [
      // Complex filtering indexes
      {
        key: {
          is_active: 1,
          'party.ideology.primary': 1,
          'approval_rating.overall': -1,
          'attributes.charisma': -1
        },
        options: { name: 'idx_politicians_complex_filter' }
      },
      {
        key: {
          'demographics.age': 1,
          'demographics.gender': 1,
          'approval_rating.overall': -1
        },
        options: { name: 'idx_politicians_demographics_approval' }
      },
      // Performance metrics indexes
      {
        key: {
          'performance_metrics.legislative_effectiveness': -1,
          'performance_metrics.bills_passed': -1,
          is_active: 1
        },
        options: { name: 'idx_politicians_performance_metrics' }
      }
    ]);

    // Additional relationships indexes for network analysis
    await this.createCollectionIndexes('relationships', [
      // Network analysis indexes
      {
        key: {
          'entity_1.entity_type': 1,
          'entity_2.entity_type': 1,
          'relationship_strength.trust_level': -1,
          'political_implications.coalition_potential': -1
        },
        options: { name: 'idx_relationships_network_analysis' }
      },
      // Temporal analysis indexes
      {
        key: {
          'temporal_data.relationship_start_date': 1,
          'relationship_evolution.evolution_trajectory': 1,
          is_active: 1
        },
        options: { name: 'idx_relationships_temporal_evolution' }
      }
    ]);

    // Additional indexes for other collections
    await this.createCollectionIndexes('political_blocs', [
      {
        key: {
          'ideology.primary': 1,
          'membership.total_members': -1,
          'cohesion_metrics.unity_score': -1
        },
        options: { name: 'idx_blocs_ideology_membership' }
      }
    ]);

    await this.createCollectionIndexes('policies', [
      {
        key: {
          'legislative_history.current_status': 1,
          category: 1,
          urgency_level: -1,
          'timeline.introduction_date': -1
        },
        options: { name: 'idx_policies_status_urgency' }
      }
    ]);

    await this.createCollectionIndexes('political_events', [
      {
        key: {
          'duration.is_ongoing': 1,
          severity: -1,
          'occurrence_time': -1,
          'media_attention_level': -1
        },
        options: { name: 'idx_events_ongoing_severity' }
      }
    ]);
  }

  /**
   * Create compound indexes for common query patterns
   */
  async createCompoundIndexes() {
    console.log('🔗 Creating compound indexes for query patterns...');

    // Dashboard query optimization
    await this.createCollectionIndexes('politicians', [
      {
        key: {
          is_active: 1,
          'party.id': 1,
          'current_position.title': 1,
          'approval_rating.overall': -1,
          'attributes.charisma': -1,
          'performance_metrics.legislative_effectiveness': -1
        },
        options: { name: 'idx_politicians_dashboard_optimized' }
      }
    ]);

    // Relationship network queries
    await this.createCollectionIndexes('relationships', [
      {
        key: {
          'entity_1.entity_id': 1,
          'entity_2.entity_id': 1,
          relationship_type: 1,
          'relationship_strength.overall_strength': -1,
          'political_implications.coalition_potential': -1,
          is_active: 1
        },
        options: { name: 'idx_relationships_network_compound' }
      }
    ]);

    // Policy tracking compound index
    await this.createCollectionIndexes('policies', [
      {
        key: {
          scope: 1,
          category: 1,
          'legislative_history.current_status': 1,
          'public_opinion.overall_support': -1,
          'timeline.introduction_date': -1
        },
        options: { name: 'idx_policies_tracking_compound' }
      }
    ]);
  }

  /**
   * Create indexes for a specific collection
   */
  async createCollectionIndexes(collectionName, indexes) {
    const collection = this.db.collection(collectionName);

    for (const indexDef of indexes) {
      try {
        const indexName = await collection.createIndex(indexDef.key, indexDef.options);
        this.createdIndexes.push({
          collection: collectionName,
          name: indexName,
          definition: indexDef
        });
        console.log(`✅ Created index: ${collectionName}.${indexName}`);

      } catch (error) {
        // Handle expected duplicate index errors
        if (error.code === 85 || error.code === 86) {
          console.log(`ℹ️  Index already exists: ${collectionName}.${indexDef.options.name}`);
        } else {
          this.indexErrors.push({
            collection: collectionName,
            index: indexDef.options.name,
            error: error.message
          });
          console.error(`❌ Failed to create index ${collectionName}.${indexDef.options.name}:`, error.message);
        }
      }
    }
  }

  /**
   * Validate that indexes were created successfully
   */
  async validateIndexes() {
    console.log('🔍 Validating index creation...');

    const validationResults = {};

    for (const [collectionName] of Object.entries(schemaManager.SCHEMA_REGISTRY)) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();

        validationResults[collectionName] = {
          indexCount: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false
          }))
        };

        console.log(`✅ ${collectionName}: ${indexes.length} indexes validated`);

      } catch (error) {
        validationResults[collectionName] = {
          error: error.message
        };
        console.error(`❌ Validation failed for ${collectionName}:`, error.message);
      }
    }

    return validationResults;
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport() {
    console.log('📊 Generating performance report...');

    const report = {
      timestamp: new Date().toISOString(),
      collections: {},
      summary: {
        totalIndexes: this.createdIndexes.length,
        indexErrors: this.indexErrors.length,
        performanceGrade: 'A'
      }
    };

    for (const [collectionName] of Object.entries(schemaManager.SCHEMA_REGISTRY)) {
      try {
        const collection = this.db.collection(collectionName);

        // Get collection stats
        const stats = await collection.stats();

        // Test query performance
        const queryStart = Date.now();
        await collection.findOne({});
        const queryTime = Date.now() - queryStart;

        // Get index information
        const indexes = await collection.indexes();

        report.collections[collectionName] = {
          documentCount: stats.count || 0,
          indexCount: indexes.length,
          storageSize: Math.round((stats.size || 0) / 1024 / 1024 * 100) / 100,
          indexSize: Math.round((stats.totalIndexSize || 0) / 1024 / 1024 * 100) / 100,
          queryPerformance: queryTime,
          performanceGrade: this.calculatePerformanceGrade(queryTime, indexes.length),
          meetsTargets: queryTime <= 50
        };

      } catch (error) {
        report.collections[collectionName] = {
          error: error.message,
          performanceGrade: 'F',
          meetsTargets: false
        };
      }
    }

    // Calculate overall performance grade
    const allGrades = Object.values(report.collections)
      .filter(c => !c.error)
      .map(c => c.performanceGrade);

    const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 };
    const avgGrade = allGrades.reduce((sum, grade) => sum + gradeValues[grade], 0) / allGrades.length;

    if (avgGrade >= 3.5) report.summary.performanceGrade = 'A';
    else if (avgGrade >= 2.5) report.summary.performanceGrade = 'B';
    else if (avgGrade >= 1.5) report.summary.performanceGrade = 'C';
    else if (avgGrade >= 0.5) report.summary.performanceGrade = 'D';
    else report.summary.performanceGrade = 'F';

    return report;
  }

  /**
   * Calculate performance grade based on query time and index count
   */
  calculatePerformanceGrade(queryTime, indexCount) {
    let score = 100;

    // Penalize slow queries
    if (queryTime > 50) score -= 40;
    else if (queryTime > 30) score -= 20;
    else if (queryTime > 20) score -= 10;
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
   * Get index statistics
   */
  async getIndexStatistics() {
    const stats = {};

    for (const [collectionName] of Object.entries(schemaManager.SCHEMA_REGISTRY)) {
      try {
        const collection = this.db.collection(collectionName);
        const indexes = await collection.indexes();

        stats[collectionName] = {
          count: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            size: idx.size || 0,
            unique: idx.unique || false,
            sparse: idx.sparse || false
          }))
        };

      } catch (error) {
        stats[collectionName] = { error: error.message };
      }
    }

    return stats;
  }
}

// Export index creation function
export async function createDatabaseIndexes() {
  const indexCreator = new IndexCreator();
  return await indexCreator.createAllIndexes();
}

export default IndexCreator;