/**
 * Database Testing Module
 * Comprehensive testing of CRUD operations and performance validation
 */

import { repositoryManager } from '../repositories/repository_manager.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database Test Suite
 */
export class DatabaseTestSuite {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total_tests: 0,
        passed_tests: 0,
        failed_tests: 0,
        performance_issues: []
      }
    };
  }

  /**
   * Run all database tests
   */
  async runAllTests() {
    console.log('🧪 Starting comprehensive database tests...');

    try {
      // Initialize repository manager
      await repositoryManager.initialize();

      // Run test suites
      await this.testPoliticiansRepository();
      await this.testRelationshipsRepository();
      await this.testPerformance();
      await this.testValidation();
      await this.testIndexEfficiency();

      // Generate summary
      this.generateTestSummary();

      console.log('✅ Database tests completed');
      return this.testResults;

    } catch (error) {
      console.error('❌ Database tests failed:', error.message);
      this.testResults.error = error.message;
      return this.testResults;
    }
  }

  /**
   * Test Politicians Repository CRUD operations
   */
  async testPoliticiansRepository() {
    console.log('🧪 Testing Politicians Repository...');

    const tests = [];
    const politiciansRepo = repositoryManager.getPoliticiansRepository();

    // Test data
    const testPolitician = {
      name: {
        first: 'Test',
        last: 'Politician',
        display_name: 'Test Politician'
      },
      demographics: {
        age: 50,
        gender: 'female'
      },
      party: {
        id: 'test_party_1',
        name: 'Test Party',
        ideology: {
          primary: 'liberal',
          economic: -25,
          social: 15
        },
        membership_since: new Date('2018-01-01')
      },
      current_position: {
        title: 'Representative',
        jurisdiction: 'Test District',
        term_start: new Date('2020-01-01'),
        is_elected: true
      },
      attributes: {
        charisma: 85,
        intelligence: 90,
        integrity: 80,
        ambition: 75,
        experience: 70,
        leadership: 88,
        empathy: 82,
        strategic_thinking: 87,
        public_speaking: 90,
        negotiation: 78
      },
      skills: {
        debate_performance: 92,
        media_savvy: 85,
        coalition_building: 80,
        policy_expertise: 88,
        crisis_management: 75,
        fundraising: 70,
        constituent_outreach: 85,
        legislative_strategy: 82
      },
      approval_rating: {
        overall: 72,
        by_party: {
          own_party: 88,
          opposition: 42,
          independent: 68
        },
        last_updated: new Date()
      },
      performance_metrics: {
        legislative_effectiveness: 85,
        bills_sponsored: 15,
        bills_passed: 12,
        committee_participation: 90,
        voting_record_consistency: 95,
        media_coverage_sentiment: 25,
        scandal_score: 5,
        corruption_risk: 2
      },
      is_active: true
    };

    // Test 1: Create politician
    tests.push(await this.runTest('politicians_create', async () => {
      const result = await politiciansRepo.createPolitician(testPolitician);
      if (!result.success) {
        throw new Error(`Create failed: ${result.error}`);
      }
      this.createdPoliticianId = result.data.id;
      return { executionTime: result.executionTime, data: result.data };
    }));

    // Test 2: Find by ID
    tests.push(await this.runTest('politicians_find_by_id', async () => {
      const result = await politiciansRepo.findById(this.createdPoliticianId);
      if (!result.success) {
        throw new Error(`FindById failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 3: Update politician
    tests.push(await this.runTest('politicians_update', async () => {
      const updateData = {
        'approval_rating.overall': 75,
        'attributes.charisma': 88
      };
      const result = await politiciansRepo.updateById(this.createdPoliticianId, updateData);
      if (!result.success) {
        throw new Error(`Update failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 4: Find by party
    tests.push(await this.runTest('politicians_find_by_party', async () => {
      const result = await politiciansRepo.findByParty('test_party_1');
      if (!result.success) {
        throw new Error(`FindByParty failed: ${result.error}`);
      }
      return { executionTime: result.executionTime, count: result.count };
    }));

    // Test 5: Text search
    tests.push(await this.runTest('politicians_text_search', async () => {
      const result = await politiciansRepo.searchPoliticians('Test Politician');
      if (!result.success) {
        throw new Error(`Text search failed: ${result.error}`);
      }
      return { executionTime: result.executionTime, count: result.count };
    }));

    // Test 6: Dashboard data
    tests.push(await this.runTest('politicians_dashboard', async () => {
      const result = await politiciansRepo.getDashboardData();
      if (!result.success) {
        throw new Error(`Dashboard data failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 7: Performance analytics
    tests.push(await this.runTest('politicians_analytics', async () => {
      const result = await politiciansRepo.getPerformanceAnalytics(this.createdPoliticianId);
      if (!result.success) {
        throw new Error(`Performance analytics failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 8: Delete politician (cleanup)
    tests.push(await this.runTest('politicians_delete', async () => {
      const result = await politiciansRepo.deleteById(this.createdPoliticianId);
      if (!result.success) {
        throw new Error(`Delete failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    this.testResults.tests.politicians = tests;
  }

  /**
   * Test Relationships Repository CRUD operations
   */
  async testRelationshipsRepository() {
    console.log('🧪 Testing Relationships Repository...');

    const tests = [];
    const relationshipsRepo = repositoryManager.getRelationshipsRepository();

    // Test data
    const testRelationship = {
      entity_1: {
        entity_id: 'test_politician_1',
        entity_type: 'politician',
        entity_name: 'Test Politician One'
      },
      entity_2: {
        entity_id: 'test_politician_2',
        entity_type: 'politician',
        entity_name: 'Test Politician Two'
      },
      relationship_type: 'ally',
      relationship_strength: {
        overall_strength: 85,
        trust_level: 80,
        influence_level: 70,
        dependency_level: 25,
        cooperation_frequency: 90,
        conflict_frequency: 10,
        communication_frequency: 85
      },
      relationship_context: {
        relationship_origin: {
          origin_type: 'political',
          origin_date: new Date('2020-01-01'),
          origin_description: 'Met during campaign'
        }
      },
      interaction_history: {
        total_interactions: 15,
        recent_interactions: [
          {
            interaction_date: new Date(),
            interaction_type: 'meeting',
            context: 'Policy discussion',
            outcome: 'positive',
            public_visibility: 'private',
            impact_score: 5
          }
        ]
      },
      political_implications: {
        coalition_potential: 90,
        opposition_potential: 5,
        influence_dynamics: {
          who_influences_whom: 'mutual',
          power_balance: 'balanced'
        },
        strategic_value: {
          value_to_entity_1: 80,
          value_to_entity_2: 75,
          mutual_benefit_potential: 85,
          competitive_threat_level: 10
        }
      },
      relationship_evolution: {
        evolution_stage: 'established',
        evolution_trajectory: 'stable',
        stability_indicators: {
          relationship_volatility: 15,
          predictability_score: 85,
          resilience_score: 80
        }
      },
      temporal_data: {
        relationship_start_date: new Date('2020-01-01'),
        relationship_duration_days: Math.floor((new Date() - new Date('2020-01-01')) / (1000 * 60 * 60 * 24))
      },
      data_quality: {
        confidence_level: 85,
        data_sources: [
          {
            source_type: 'direct_observation',
            source_reliability: 90,
            last_updated: new Date()
          }
        ],
        verification_status: 'verified'
      },
      is_active: true
    };

    // Test 1: Create relationship
    tests.push(await this.runTest('relationships_create', async () => {
      const result = await relationshipsRepo.createRelationship(testRelationship);
      if (!result.success) {
        throw new Error(`Create failed: ${result.error}`);
      }
      this.createdRelationshipId = result.data.id;
      return { executionTime: result.executionTime };
    }));

    // Test 2: Find by entity
    tests.push(await this.runTest('relationships_find_by_entity', async () => {
      const result = await relationshipsRepo.findByEntity('test_politician_1');
      if (!result.success) {
        throw new Error(`FindByEntity failed: ${result.error}`);
      }
      return { executionTime: result.executionTime, count: result.count };
    }));

    // Test 3: Find between entities
    tests.push(await this.runTest('relationships_find_between', async () => {
      const result = await relationshipsRepo.findBetweenEntities('test_politician_1', 'test_politician_2');
      if (!result.success) {
        throw new Error(`FindBetweenEntities failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 4: Add interaction
    tests.push(await this.runTest('relationships_add_interaction', async () => {
      const interactionData = {
        interaction_type: 'phone_call',
        context: 'Coordination meeting',
        outcome: 'positive',
        public_visibility: 'private',
        impact_score: 3
      };
      const result = await relationshipsRepo.addInteraction(this.createdRelationshipId, interactionData);
      if (!result.success) {
        throw new Error(`Add interaction failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 5: Relationship insights
    tests.push(await this.runTest('relationships_insights', async () => {
      const result = await relationshipsRepo.getRelationshipInsights();
      if (!result.success) {
        throw new Error(`Get insights failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Test 6: Delete relationship (cleanup)
    tests.push(await this.runTest('relationships_delete', async () => {
      const result = await relationshipsRepo.deleteById(this.createdRelationshipId);
      if (!result.success) {
        throw new Error(`Delete failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    this.testResults.tests.relationships = tests;
  }

  /**
   * Test performance with larger datasets
   */
  async testPerformance() {
    console.log('🧪 Testing Performance...');

    const tests = [];
    const politiciansRepo = repositoryManager.getPoliticiansRepository();

    // Test 1: Bulk create performance
    tests.push(await this.runTest('performance_bulk_create', async () => {
      const politicians = [];
      for (let i = 0; i < 10; i++) {
        politicians.push({
          name: {
            first: `Test${i}`,
            last: `Politician${i}`,
            display_name: `Test${i} Politician${i}`
          },
          demographics: {
            age: 30 + i,
            gender: i % 2 === 0 ? 'male' : 'female'
          },
          party: {
            id: `test_party_${i % 3}`,
            name: `Test Party ${i % 3}`,
            ideology: {
              primary: 'centrist',
              economic: 0,
              social: 0
            },
            membership_since: new Date()
          },
          current_position: {
            title: 'Representative',
            jurisdiction: `District ${i}`,
            term_start: new Date(),
            is_elected: true
          },
          attributes: {
            charisma: 50 + (i * 5),
            intelligence: 60 + (i * 4),
            integrity: 70 + (i * 3),
            ambition: 55 + (i * 4),
            experience: 40 + (i * 6),
            leadership: 65 + (i * 3),
            empathy: 60 + (i * 4),
            strategic_thinking: 70 + (i * 3),
            public_speaking: 55 + (i * 5),
            negotiation: 60 + (i * 4)
          },
          skills: {
            debate_performance: 70 + (i * 3),
            media_savvy: 60 + (i * 4),
            coalition_building: 65 + (i * 3),
            policy_expertise: 75 + (i * 2),
            crisis_management: 55 + (i * 5),
            fundraising: 50 + (i * 5),
            constituent_outreach: 70 + (i * 3),
            legislative_strategy: 65 + (i * 4)
          },
          approval_rating: {
            overall: 50 + (i * 5),
            by_party: {
              own_party: 70 + (i * 3),
              opposition: 30 + (i * 2),
              independent: 50 + (i * 4)
            },
            last_updated: new Date()
          },
          performance_metrics: {
            legislative_effectiveness: 60 + (i * 4),
            bills_sponsored: i + 1,
            bills_passed: Math.floor(i / 2),
            committee_participation: 70 + (i * 3),
            voting_record_consistency: 80 + (i * 2),
            media_coverage_sentiment: 0,
            scandal_score: i % 10,
            corruption_risk: i % 5
          },
          is_active: true
        });
      }

      const result = await politiciansRepo.createMany(politicians);
      if (!result.success) {
        throw new Error(`Bulk create failed: ${result.error}`);
      }

      this.createdTestPoliticians = politicians.map(p => p.id);
      return { executionTime: result.executionTime, count: result.insertedCount };
    }));

    // Test 2: Query performance with filters
    tests.push(await this.runTest('performance_complex_query', async () => {
      const result = await politiciansRepo.find(
        {
          'approval_rating.overall': { $gte: 60 },
          'attributes.charisma': { $gte: 70 },
          is_active: true
        },
        {
          sort: { 'approval_rating.overall': -1 },
          limit: 10
        }
      );
      if (!result.success) {
        throw new Error(`Complex query failed: ${result.error}`);
      }
      return { executionTime: result.executionTime, count: result.count };
    }));

    // Test 3: Aggregation performance
    tests.push(await this.runTest('performance_aggregation', async () => {
      const result = await politiciansRepo.getDashboardData();
      if (!result.success) {
        throw new Error(`Aggregation failed: ${result.error}`);
      }
      return { executionTime: result.executionTime };
    }));

    // Cleanup test data
    await politiciansRepo.deleteMany({ id: { $regex: /^test/ } });

    this.testResults.tests.performance = tests;
  }

  /**
   * Test validation schemas
   */
  async testValidation() {
    console.log('🧪 Testing Validation...');

    const tests = [];
    const politiciansRepo = repositoryManager.getPoliticiansRepository();

    // Test 1: Invalid data should fail validation
    tests.push(await this.runTest('validation_invalid_data', async () => {
      const invalidPolitician = {
        name: {
          first: 'Test'
          // Missing required fields
        },
        demographics: {
          age: 150, // Invalid age
          gender: 'invalid_gender'
        }
        // Missing many required fields
      };

      const result = await politiciansRepo.createPolitician(invalidPolitician);
      if (result.success) {
        throw new Error('Validation should have failed but passed');
      }
      return { expectedFailure: true, error: result.error };
    }));

    // Test 2: Attribute range validation
    tests.push(await this.runTest('validation_attribute_range', async () => {
      const politicianWithInvalidAttributes = {
        name: {
          first: 'Test',
          last: 'Politician',
          display_name: 'Test Politician'
        },
        demographics: {
          age: 45,
          gender: 'male'
        },
        party: {
          id: 'test_party',
          name: 'Test Party',
          ideology: {
            primary: 'centrist',
            economic: 0,
            social: 0
          },
          membership_since: new Date()
        },
        current_position: {
          title: 'Representative',
          jurisdiction: 'Test District',
          term_start: new Date(),
          is_elected: true
        },
        attributes: {
          charisma: 150, // Invalid: > 100
          intelligence: -10, // Invalid: < 1
          integrity: 80,
          ambition: 75,
          experience: 70
        }
      };

      const result = await politiciansRepo.create(politicianWithInvalidAttributes);
      if (result.success) {
        throw new Error('Attribute validation should have failed but passed');
      }
      return { expectedFailure: true, error: result.error };
    }));

    this.testResults.tests.validation = tests;
  }

  /**
   * Test index efficiency
   */
  async testIndexEfficiency() {
    console.log('🧪 Testing Index Efficiency...');

    const tests = [];

    // Test all repositories for index usage
    for (const [collectionName, repository] of repositoryManager.repositories) {
      tests.push(await this.runTest(`index_efficiency_${collectionName}`, async () => {
        const stats = await repository.getStats();
        if (!stats.success) {
          throw new Error(`Failed to get stats: ${stats.error}`);
        }

        const indexCount = Object.keys(stats.stats.indexSizes || {}).length;
        const efficiency = indexCount >= 5 ? 'good' : indexCount >= 3 ? 'fair' : 'poor';

        return {
          indexCount,
          efficiency,
          indexSize: stats.stats.totalIndexSize || 0
        };
      }));
    }

    this.testResults.tests.index_efficiency = tests;
  }

  /**
   * Run individual test with error handling
   */
  async runTest(testName, testFunction) {
    const startTime = Date.now();

    try {
      const result = await testFunction();
      const executionTime = Date.now() - startTime;

      this.testResults.summary.total_tests++;
      this.testResults.summary.passed_tests++;

      // Check for performance issues
      if (result.executionTime > 50) {
        this.testResults.summary.performance_issues.push({
          test: testName,
          executionTime: result.executionTime,
          warning: 'Execution time exceeds 50ms target'
        });
      }

      console.log(`✅ ${testName} passed (${executionTime}ms)`);

      return {
        name: testName,
        status: 'passed',
        executionTime,
        result
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.testResults.summary.total_tests++;
      this.testResults.summary.failed_tests++;

      console.log(`❌ ${testName} failed (${executionTime}ms): ${error.message}`);

      return {
        name: testName,
        status: 'failed',
        executionTime,
        error: error.message
      };
    }
  }

  /**
   * Generate test summary
   */
  generateTestSummary() {
    const summary = this.testResults.summary;
    summary.success_rate = Math.round((summary.passed_tests / summary.total_tests) * 100);
    summary.has_performance_issues = summary.performance_issues.length > 0;

    console.log(`
📊 Test Summary:
   Total Tests: ${summary.total_tests}
   Passed: ${summary.passed_tests}
   Failed: ${summary.failed_tests}
   Success Rate: ${summary.success_rate}%
   Performance Issues: ${summary.performance_issues.length}
    `);
  }
}

// Export test runner function
export async function runDatabaseTests() {
  const testSuite = new DatabaseTestSuite();
  return await testSuite.runAllTests();
}

export default DatabaseTestSuite;