/**
 * Repository Manager
 * Central coordination for all repository operations and database management
 */

import { schemaManager } from '../database/schema_manager.js';
import { BaseRepository } from './base_repository.js';
import PoliticiansRepository from './politicians_repository.js';
import RelationshipsRepository from './relationships_repository.js';

/**
 * Repository Manager Class
 * Manages all repository instances and provides centralized database operations
 */
export class RepositoryManager {
  constructor() {
    this.repositories = new Map();
    this.isInitialized = false;
    this.performanceMetrics = new Map();
  }

  /**
   * Initialize all repositories and database schema
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Repository Manager...');

      // Initialize schema manager first
      await schemaManager.initialize();

      // Create all collections with validation
      const collectionResults = await schemaManager.createAllCollections();
      console.log('📋 Collection creation results:', collectionResults);

      // Create all indexes for performance
      const indexResults = await schemaManager.createAllIndexes();
      console.log('🔍 Index creation results:', indexResults);

      // Initialize specialized repositories
      await this.initializeRepositories();

      // Perform initial health check
      const healthCheck = await this.performHealthCheck();
      console.log('💚 Initial health check:', healthCheck.overall_status);

      this.isInitialized = true;
      console.log('✅ Repository Manager initialization completed');

      return {
        success: true,
        collections: collectionResults,
        indexes: indexResults,
        health: healthCheck
      };

    } catch (error) {
      console.error('❌ Repository Manager initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize all repository instances
   */
  async initializeRepositories() {
    const repositoryClasses = {
      politicians: PoliticiansRepository,
      relationships: RelationshipsRepository,
      // Add base repositories for other collections
      political_blocs: BaseRepository,
      policies: BaseRepository,
      political_events: BaseRepository
    };

    for (const [collectionName, RepositoryClass] of Object.entries(repositoryClasses)) {
      try {
        let repository;

        if (RepositoryClass === BaseRepository) {
          repository = new BaseRepository(collectionName);
        } else {
          repository = new RepositoryClass();
        }

        await repository.initialize();
        this.repositories.set(collectionName, repository);

        console.log(`✅ Initialized ${collectionName} repository`);

      } catch (error) {
        console.error(`❌ Failed to initialize ${collectionName} repository:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Get repository instance by collection name
   */
  getRepository(collectionName) {
    if (!this.isInitialized) {
      throw new Error('Repository Manager not initialized. Call initialize() first.');
    }

    const repository = this.repositories.get(collectionName);
    if (!repository) {
      throw new Error(`Repository not found for collection: ${collectionName}`);
    }

    return repository;
  }

  /**
   * Get politicians repository with type safety
   */
  getPoliticiansRepository() {
    return this.getRepository('politicians');
  }

  /**
   * Get relationships repository with type safety
   */
  getRelationshipsRepository() {
    return this.getRepository('relationships');
  }

  /**
   * Get political blocs repository
   */
  getPoliticalBlocsRepository() {
    return this.getRepository('political_blocs');
  }

  /**
   * Get policies repository
   */
  getPoliciesRepository() {
    return this.getRepository('policies');
  }

  /**
   * Get political events repository
   */
  getPoliticalEventsRepository() {
    return this.getRepository('political_events');
  }

  /**
   * Perform comprehensive health check on all repositories
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      overall_status: 'healthy',
      repositories: {},
      summary: {
        total_repositories: this.repositories.size,
        healthy_repositories: 0,
        total_documents: 0,
        performance_issues: []
      }
    };

    for (const [collectionName, repository] of this.repositories) {
      try {
        // Basic health check
        const stats = await repository.getStats();
        const count = await repository.count();

        // Performance test
        const performanceStart = Date.now();
        await repository.findOne({});
        const queryTime = Date.now() - performanceStart;

        const repositoryHealth = {
          status: queryTime <= 50 ? 'healthy' : 'performance_issue',
          document_count: count.count || 0,
          query_performance_ms: queryTime,
          storage_size_mb: stats.success ? Math.round(stats.stats.size / 1024 / 1024 * 100) / 100 : 0,
          index_count: stats.success ? Object.keys(stats.stats.indexSizes || {}).length : 0
        };

        results.repositories[collectionName] = repositoryHealth;
        results.summary.total_documents += repositoryHealth.document_count;

        if (repositoryHealth.status === 'healthy') {
          results.summary.healthy_repositories++;
        } else {
          results.summary.performance_issues.push({
            repository: collectionName,
            issue: `Query time ${queryTime}ms exceeds 50ms target`
          });
        }

      } catch (error) {
        results.repositories[collectionName] = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Determine overall status
    if (results.summary.performance_issues.length > 0) {
      results.overall_status = 'performance_issues';
    }

    if (results.summary.healthy_repositories < results.summary.total_repositories * 0.8) {
      results.overall_status = 'unhealthy';
    }

    const executionTime = Date.now() - startTime;
    results.health_check_time_ms = executionTime;

    return results;
  }

  /**
   * Perform comprehensive performance analysis
   */
  async performPerformanceAnalysis() {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      repositories: {}
    };

    for (const [collectionName, repository] of this.repositories) {
      try {
        console.log(`🔍 Analyzing performance for ${collectionName}...`);

        const performanceTest = await repository.performanceTest(50);
        results.repositories[collectionName] = performanceTest;

        // Store metrics for monitoring
        this.performanceMetrics.set(collectionName, {
          timestamp: new Date(),
          ...performanceTest
        });

      } catch (error) {
        results.repositories[collectionName] = {
          error: error.message,
          performance_grade: 'F'
        };
      }
    }

    const executionTime = Date.now() - startTime;
    results.analysis_time_ms = executionTime;

    console.log(`✅ Performance analysis completed in ${executionTime}ms`);
    return results;
  }

  /**
   * Get database statistics across all collections
   */
  async getDatabaseStatistics() {
    const startTime = Date.now();
    const stats = {
      timestamp: new Date().toISOString(),
      collections: {},
      totals: {
        documents: 0,
        storage_size_mb: 0,
        index_size_mb: 0,
        total_indexes: 0
      }
    };

    for (const [collectionName, repository] of this.repositories) {
      try {
        const repositoryStats = await repository.getStats();
        const count = await repository.count();

        if (repositoryStats.success) {
          const collectionStats = {
            document_count: count.count || 0,
            storage_size_mb: Math.round(repositoryStats.stats.size / 1024 / 1024 * 100) / 100,
            index_size_mb: Math.round(repositoryStats.stats.totalIndexSize / 1024 / 1024 * 100) / 100,
            avg_document_size_bytes: repositoryStats.stats.avgObjSize || 0,
            index_count: Object.keys(repositoryStats.stats.indexSizes || {}).length
          };

          stats.collections[collectionName] = collectionStats;

          // Add to totals
          stats.totals.documents += collectionStats.document_count;
          stats.totals.storage_size_mb += collectionStats.storage_size_mb;
          stats.totals.index_size_mb += collectionStats.index_size_mb;
          stats.totals.total_indexes += collectionStats.index_count;
        }

      } catch (error) {
        stats.collections[collectionName] = { error: error.message };
      }
    }

    const executionTime = Date.now() - startTime;
    stats.query_time_ms = executionTime;

    return stats;
  }

  /**
   * Create sample data for testing (only for development)
   */
  async createSampleData() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Sample data creation is not allowed in production');
    }

    console.log('📝 Creating sample data for testing...');
    const results = {};

    try {
      // Sample politician data
      const politiciansRepo = this.getPoliticiansRepository();
      const samplePolitician = {
        name: {
          first: 'John',
          last: 'Doe',
          display_name: 'John Doe'
        },
        demographics: {
          age: 45,
          gender: 'male'
        },
        party: {
          id: 'demo_party_1',
          name: 'Demo Party',
          ideology: {
            primary: 'centrist',
            economic: 0,
            social: 0
          },
          membership_since: new Date('2020-01-01')
        },
        current_position: {
          title: 'Senator',
          jurisdiction: 'State of Demo',
          term_start: new Date('2021-01-01'),
          is_elected: true
        },
        attributes: {
          charisma: 75,
          intelligence: 80,
          integrity: 70,
          ambition: 85,
          experience: 60,
          leadership: 78,
          empathy: 65,
          strategic_thinking: 82,
          public_speaking: 77,
          negotiation: 73
        },
        skills: {
          debate_performance: 80,
          media_savvy: 75,
          coalition_building: 78,
          policy_expertise: 85,
          crisis_management: 70,
          fundraising: 82,
          constituent_outreach: 77,
          legislative_strategy: 80
        },
        approval_rating: {
          overall: 68,
          by_party: {
            own_party: 85,
            opposition: 45,
            independent: 62
          },
          last_updated: new Date()
        },
        performance_metrics: {
          legislative_effectiveness: 75,
          bills_sponsored: 12,
          bills_passed: 8,
          committee_participation: 85,
          voting_record_consistency: 90,
          media_coverage_sentiment: 15,
          scandal_score: 10,
          corruption_risk: 5
        },
        is_active: true
      };

      const politicianResult = await politiciansRepo.createPolitician(samplePolitician);
      results.politician = politicianResult;

      console.log('✅ Sample data creation completed');
      return results;

    } catch (error) {
      console.error('❌ Sample data creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate all repository schemas
   */
  async validateSchemas() {
    const results = {};

    for (const [collectionName] of this.repositories) {
      try {
        const schemaInfo = schemaManager.getSchemaInfo()[collectionName];
        results[collectionName] = {
          valid: true,
          info: schemaInfo
        };
      } catch (error) {
        results[collectionName] = {
          valid: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Get performance metrics history
   */
  getPerformanceHistory() {
    const history = {};

    for (const [collectionName, metrics] of this.performanceMetrics) {
      history[collectionName] = metrics;
    }

    return history;
  }

  /**
   * Close all repository connections
   */
  async close() {
    console.log('🔌 Closing Repository Manager...');

    // Clear repositories
    this.repositories.clear();
    this.performanceMetrics.clear();
    this.isInitialized = false;

    console.log('✅ Repository Manager closed');
  }
}

// Export singleton instance
export const repositoryManager = new RepositoryManager();

export default {
  RepositoryManager,
  repositoryManager
};