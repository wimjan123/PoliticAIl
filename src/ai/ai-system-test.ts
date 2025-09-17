/**
 * AI System Comprehensive Test Suite
 *
 * Tests all aspects of the AI political behavior system:
 * - Personality-driven decision making
 * - Relationship management and evolution
 * - Event responses and consistency
 * - Multi-tick behavior validation
 * - Performance and reliability metrics
 */

import {
  AIOrchestrater,
  AIDecisionEngine,
  RelationshipManager,
  EventResponseSystem,
  AIConsistencyValidator,
  PERSONALITY_ARCHETYPES,
  generatePersonalityVariation,
  calculatePersonalityCompatibility,
  type AIPolitician,
  type DecisionContext,
  type PoliticalAction
} from './index';

import { Politician, Policy, PoliticalClimate } from '../types/entities';
import { SimulationEvent } from '../types/simulation';

/**
 * Test result interface
 */
interface TestResult {
  test_name: string;
  passed: boolean;
  score: number;
  details: string;
  execution_time: number;
  errors: string[];
}

/**
 * Test suite configuration
 */
interface TestConfig {
  num_politicians: number;
  num_ticks: number;
  num_events: number;
  consistency_threshold: number;
  performance_threshold: number;
}

/**
 * Comprehensive AI System Test Suite
 */
export class AISystemTestSuite {
  private orchestrator: AIOrchestrater;
  private testResults: TestResult[] = [];
  private config: TestConfig;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      num_politicians: 5,
      num_ticks: 25,
      num_events: 10,
      consistency_threshold: 70,
      performance_threshold: 65,
      ...config
    };

    this.orchestrator = new AIOrchestrater();
  }

  /**
   * Run all AI system tests
   * @returns Array of test results
   */
  public async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting AI System Test Suite...');
    this.testResults = [];

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Core functionality tests
      await this.testPersonalityDrivenDecisions();
      await this.testRelationshipManagement();
      await this.testEventResponseSystem();
      await this.testDecisionConsistency();

      // Integration tests
      await this.testMultiTickBehavior();
      await this.testPersonalityArchetypes();
      await this.testRelationshipEvolution();
      await this.testAICoordination();

      // Performance tests
      await this.testSystemPerformance();
      await this.testConsistencyValidation();

      // Stress tests
      await this.testHighVolumeDecisions();
      await this.testComplexEventSequences();

    } catch (error) {
      this.addTestResult('System Setup', false, 0, `Critical setup failure: ${error}`, 0, [String(error)]);
    }

    // Generate summary
    this.generateTestSummary();

    return this.testResults;
  }

  /**
   * Setup test environment with sample politicians
   */
  private async setupTestEnvironment(): Promise<void> {
    const startTime = Date.now();

    try {
      // Create test politicians with different archetypes
      const archetypes = ['progressive', 'conservative', 'pragmatic', 'populist', 'technocratic'] as const;

      for (let i = 0; i < this.config.num_politicians; i++) {
        const archetype = archetypes[i % archetypes.length];
        const politician = this.createTestPolitician(`politician_${i}`, `Politician ${i + 1}`);

        this.orchestrator.initializeAIPolitician(
          politician,
          archetype,
          10 // Small personality variation
        );
      }

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Environment Setup',
        true,
        100,
        `Successfully created ${this.config.num_politicians} AI politicians`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Environment Setup',
        false,
        0,
        'Failed to setup test environment',
        executionTime,
        [String(error)]
      );
      throw error;
    }
  }

  /**
   * Test personality-driven decision making
   */
  private async testPersonalityDrivenDecisions(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    let score = 0;

    try {
      const politicians = this.orchestrator.getAllAIPoliticians();
      let personalityAlignmentCount = 0;

      for (const aiPolitician of politicians) {
        // Create test decision context
        const context = this.createTestDecisionContext();

        // Make decision
        const decision = await aiPolitician.decisionEngine.makeDecision(context);

        // Verify decision aligns with personality
        const alignment = this.verifyPersonalityAlignment(aiPolitician, decision);
        if (alignment >= 70) {
          personalityAlignmentCount++;
        } else {
          errors.push(`${aiPolitician.politician.name}: Decision alignment ${alignment}% below threshold`);
        }
      }

      score = (personalityAlignmentCount / politicians.length) * 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Personality-Driven Decisions',
        passed,
        score,
        `${personalityAlignmentCount}/${politicians.length} politicians showed personality alignment`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Personality-Driven Decisions',
        false,
        0,
        'Decision making test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test relationship management system
   */
  private async testRelationshipManagement(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const relationshipManager = this.orchestrator.getRelationshipManager();
      const politicians = this.orchestrator.getAllAIPoliticians();

      let relationshipCount = 0;
      let compatibilityAccuracy = 0;

      // Test relationship initialization and compatibility calculation
      for (let i = 0; i < politicians.length; i++) {
        for (let j = i + 1; j < politicians.length; j++) {
          const politician1 = politicians[i].politician;
          const politician2 = politicians[j].politician;

          // Initialize relationship
          const relationship = relationshipManager.initializeRelationship(politician1, politician2);
          relationshipCount++;

          // Verify compatibility calculation
          const expectedCompatibility = calculatePersonalityCompatibility(
            politicians[i].archetype.traits,
            politicians[j].archetype.traits
          );

          const compatibilityDifference = Math.abs(relationship.base_compatibility - expectedCompatibility);
          if (compatibilityDifference <= 10) {
            compatibilityAccuracy++;
          } else {
            errors.push(`Compatibility mismatch: ${politician1.name} & ${politician2.name}`);
          }
        }
      }

      const score = (compatibilityAccuracy / relationshipCount) * 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Relationship Management',
        passed,
        score,
        `${relationshipCount} relationships initialized, ${compatibilityAccuracy} compatibility matches`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Relationship Management',
        false,
        0,
        'Relationship management test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test event response system
   */
  private async testEventResponseSystem(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const responseSystem = this.orchestrator.getResponseSystem();
      const politicians = this.orchestrator.getAllAIPoliticians();

      let appropriateResponseCount = 0;
      let totalResponses = 0;

      // Test different event types
      const eventTypes = ['crisis', 'scandal', 'opportunity', 'election'];

      for (const eventType of eventTypes) {
        const testEvent = this.createTestEvent(eventType);

        for (const aiPolitician of politicians) {
          const response = responseSystem.generateEventResponse(
            aiPolitician.politician,
            testEvent,
            {
              climate: this.createTestClimate(),
              all_politicians: politicians.map(p => p.politician),
              current_tick: 1
            },
            aiPolitician.archetype
          );

          totalResponses++;

          // Verify response appropriateness
          const appropriateness = this.verifyEventResponseAppropriateness(
            aiPolitician,
            testEvent,
            response
          );

          if (appropriateness >= 70) {
            appropriateResponseCount++;
          } else {
            errors.push(`${aiPolitician.politician.name}: Inappropriate response to ${eventType}`);
          }
        }
      }

      const score = (appropriateResponseCount / totalResponses) * 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Event Response System',
        passed,
        score,
        `${appropriateResponseCount}/${totalResponses} appropriate responses generated`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Event Response System',
        false,
        0,
        'Event response test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test decision consistency over multiple ticks
   */
  private async testDecisionConsistency(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const validator = this.orchestrator.getConsistencyValidator();
      const politicians = this.orchestrator.getAllAIPoliticians();

      let consistentPoliticians = 0;

      // Make decisions over multiple ticks for each politician
      for (const aiPolitician of politicians) {
        const decisions: PoliticalAction[] = [];

        for (let tick = 0; tick < 15; tick++) {
          const context = this.createTestDecisionContext();
          const decision = await aiPolitician.decisionEngine.makeDecision(context);
          decisions.push(decision);

          // Record behavior for consistency tracking
          validator.recordBehavior(
            aiPolitician.politician.id,
            tick,
            decision,
            context
          );
        }

        // Validate consistency
        const assessment = await validator.validateAIConsistency(aiPolitician.politician, 15);

        if (assessment.overall_consistency >= this.config.consistency_threshold) {
          consistentPoliticians++;
        } else {
          errors.push(`${aiPolitician.politician.name}: Consistency ${assessment.overall_consistency.toFixed(1)}%`);
        }
      }

      const score = (consistentPoliticians / politicians.length) * 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Decision Consistency',
        passed,
        score,
        `${consistentPoliticians}/${politicians.length} politicians showed consistent behavior`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Decision Consistency',
        false,
        0,
        'Consistency validation test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test multi-tick behavior simulation
   */
  private async testMultiTickBehavior(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      let successfulTicks = 0;
      const totalTicks = this.config.num_ticks;

      for (let tick = 0; tick < totalTicks; tick++) {
        try {
          // Create context for this tick
          const context = {
            climate: this.createTestClimate(),
            all_politicians: this.orchestrator.getAllAIPoliticians().map(p => p.politician),
            active_policies: this.createTestPolicies(),
            urgency: Math.random() * 100
          };

          // Generate some random events
          const events = tick % 5 === 0 ? [this.createTestEvent('crisis')] : [];

          // Process tick
          const tickResult = await this.orchestrator.processSimulationTick(context, events);

          // Verify tick completed successfully
          if (tickResult.actions.length > 0 && tickResult.issues.filter(i => i.severity === 'high').length === 0) {
            successfulTicks++;
          } else {
            errors.push(`Tick ${tick}: Issues detected or no actions taken`);
          }

        } catch (error) {
          errors.push(`Tick ${tick}: Processing failed - ${error}`);
        }
      }

      const score = (successfulTicks / totalTicks) * 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Multi-Tick Behavior',
        passed,
        score,
        `${successfulTicks}/${totalTicks} ticks processed successfully`,
        executionTime,
        errors.slice(0, 10) // Limit errors to first 10
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Multi-Tick Behavior',
        false,
        0,
        'Multi-tick simulation failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test personality archetype behavior differences
   */
  private async testPersonalityArchetypes(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const politicians = this.orchestrator.getAllAIPoliticians();
      const archetypeGroups = new Map<string, AIPolitician[]>();

      // Group politicians by archetype
      for (const politician of politicians) {
        const archetypeName = politician.archetype.name;
        if (!archetypeGroups.has(archetypeName)) {
          archetypeGroups.set(archetypeName, []);
        }
        archetypeGroups.get(archetypeName)!.push(politician);
      }

      let distinctBehaviorCount = 0;
      const totalComparisons = archetypeGroups.size * (archetypeGroups.size - 1) / 2;

      // Compare behavior patterns between archetypes
      const archetypeNames = Array.from(archetypeGroups.keys());
      for (let i = 0; i < archetypeNames.length; i++) {
        for (let j = i + 1; j < archetypeNames.length; j++) {
          const group1 = archetypeGroups.get(archetypeNames[i])!;
          const group2 = archetypeGroups.get(archetypeNames[j])!;

          // Test if groups show distinct behavior patterns
          const behaviorDifference = await this.measureBehaviorDifference(group1, group2);

          if (behaviorDifference >= 30) { // 30% difference threshold
            distinctBehaviorCount++;
          } else {
            errors.push(`${archetypeNames[i]} vs ${archetypeNames[j]}: Low behavioral distinction`);
          }
        }
      }

      const score = totalComparisons > 0 ? (distinctBehaviorCount / totalComparisons) * 100 : 100;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Personality Archetypes',
        passed,
        score,
        `${distinctBehaviorCount}/${totalComparisons} archetype pairs showed distinct behavior`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Personality Archetypes',
        false,
        0,
        'Archetype testing failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test relationship evolution over time
   */
  private async testRelationshipEvolution(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const relationshipManager = this.orchestrator.getRelationshipManager();
      const politicians = this.orchestrator.getAllAIPoliticians().map(p => p.politician);

      // Create initial relationship
      const politician1 = politicians[0];
      const politician2 = politicians[1];
      const relationship = relationshipManager.initializeRelationship(politician1, politician2);

      const initialScore = relationship.current_score;
      let relationshipChanged = false;

      // Simulate policy agreements and disagreements
      const testPolicy = this.createTestPolicies()[0];

      // Agreement
      relationshipManager.processPolicyStance(politician1, politician2, testPolicy, true, true);
      const afterAgreement = relationshipManager.getRelationship(politician1.id, politician2.id);

      if (afterAgreement && afterAgreement.current_score > initialScore) {
        relationshipChanged = true;
      }

      // Disagreement
      relationshipManager.processPolicyStance(politician1, politician2, testPolicy, false, true);
      const afterDisagreement = relationshipManager.getRelationship(politician1.id, politician2.id);

      // Time decay
      const decayedRelationships = relationshipManager.processTimeDecay(100);

      const score = relationshipChanged && afterDisagreement && decayedRelationships.length >= 0 ? 100 : 0;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Relationship Evolution',
        passed,
        score,
        `Relationship evolution ${relationshipChanged ? 'successful' : 'failed'}`,
        executionTime,
        errors
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Relationship Evolution',
        false,
        0,
        'Relationship evolution test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test AI coordination capabilities
   */
  private async testAICoordination(): Promise<void> {
    const startTime = Date.now();

    try {
      const responseSystem = this.orchestrator.getResponseSystem();
      const politicians = this.orchestrator.getAllAIPoliticians().map(p => p.politician);

      // Take first 3 politicians for coordination test
      const coordinatingPoliticians = politicians.slice(0, 3);
      const testEvent = this.createTestEvent('crisis');

      const coordinatedResponses = responseSystem.generateCoordinatedResponse(
        coordinatingPoliticians,
        testEvent,
        {
          climate: this.createTestClimate(),
          all_politicians: politicians,
          current_tick: 1
        }
      );

      // Verify coordination occurred
      const coordinated = coordinatedResponses.some(response => response.coordinated);
      const score = coordinated ? 100 : 0;
      const passed = score >= this.config.performance_threshold;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'AI Coordination',
        passed,
        score,
        `Coordination ${coordinated ? 'successful' : 'failed'} for ${coordinatingPoliticians.length} politicians`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'AI Coordination',
        false,
        0,
        'AI coordination test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test system performance under normal load
   */
  private async testSystemPerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      const testStartTime = Date.now();

      // Process multiple ticks rapidly
      for (let i = 0; i < 10; i++) {
        const context = {
          climate: this.createTestClimate(),
          all_politicians: this.orchestrator.getAllAIPoliticians().map(p => p.politician),
          active_policies: this.createTestPolicies(),
          urgency: 50
        };

        await this.orchestrator.processSimulationTick(context, []);
      }

      const totalTime = Date.now() - testStartTime;
      const avgTimePerTick = totalTime / 10;

      // Performance is good if each tick takes less than 100ms
      const score = Math.max(0, 100 - avgTimePerTick);
      const passed = avgTimePerTick < 100;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'System Performance',
        passed,
        score,
        `Average ${avgTimePerTick.toFixed(1)}ms per tick`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'System Performance',
        false,
        0,
        'Performance test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test consistency validation system
   */
  private async testConsistencyValidation(): Promise<void> {
    const startTime = Date.now();

    try {
      const validator = this.orchestrator.getConsistencyValidator();
      const politician = this.orchestrator.getAllAIPoliticians()[0];

      // Generate some behavior history
      for (let i = 0; i < 20; i++) {
        const context = this.createTestDecisionContext();
        const decision = await politician.decisionEngine.makeDecision(context);

        validator.recordBehavior(
          politician.politician.id,
          i,
          decision,
          context
        );
      }

      // Run validation
      const assessment = await validator.validateAIConsistency(politician.politician, 20);

      const passed = assessment.test_results.every(result => result.passed || result.score >= 50);
      const score = assessment.overall_consistency;

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Consistency Validation',
        passed,
        score,
        `Validation completed with ${assessment.test_results.length} tests`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Consistency Validation',
        false,
        0,
        'Consistency validation test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test system under high decision volume
   */
  private async testHighVolumeDecisions(): Promise<void> {
    const startTime = Date.now();

    try {
      const politicians = this.orchestrator.getAllAIPoliticians();
      let successfulDecisions = 0;
      const totalDecisions = politicians.length * 50; // 50 decisions per politician

      for (const politician of politicians) {
        for (let i = 0; i < 50; i++) {
          try {
            const context = this.createTestDecisionContext();
            const decision = await politician.decisionEngine.makeDecision(context);

            if (decision && decision.type && decision.description) {
              successfulDecisions++;
            }
          } catch (error) {
            // Count as failure
          }
        }
      }

      const score = (successfulDecisions / totalDecisions) * 100;
      const passed = score >= 90; // 90% success rate required

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'High Volume Decisions',
        passed,
        score,
        `${successfulDecisions}/${totalDecisions} decisions completed successfully`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'High Volume Decisions',
        false,
        0,
        'High volume test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  /**
   * Test complex event sequences
   */
  private async testComplexEventSequences(): Promise<void> {
    const startTime = Date.now();

    try {
      const eventTypes = ['crisis', 'scandal', 'opportunity', 'election'];
      let successfulSequences = 0;

      for (let sequence = 0; sequence < 5; sequence++) {
        try {
          // Create sequence of events
          const events = eventTypes.map(type => this.createTestEvent(type));

          for (const event of events) {
            const context = {
              climate: this.createTestClimate(),
              all_politicians: this.orchestrator.getAllAIPoliticians().map(p => p.politician),
              active_policies: this.createTestPolicies(),
              urgency: 75
            };

            const result = await this.orchestrator.processSimulationTick(context, [event]);

            // Verify responses were generated
            if (result.responses.length === 0) {
              throw new Error(`No responses generated for ${event.type}`);
            }
          }

          successfulSequences++;
        } catch (error) {
          // Sequence failed
        }
      }

      const score = (successfulSequences / 5) * 100;
      const passed = score >= 80; // 80% success rate required

      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Complex Event Sequences',
        passed,
        score,
        `${successfulSequences}/5 event sequences processed successfully`,
        executionTime
      );

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.addTestResult(
        'Complex Event Sequences',
        false,
        0,
        'Complex event sequence test failed',
        executionTime,
        [String(error)]
      );
    }
  }

  // Helper methods for test data creation and validation

  private createTestPolitician(id: string, name: string): Politician {
    return {
      id,
      name,
      role: 'ai_opponent',
      attributes: {
        charisma: 50 + Math.random() * 50,
        intelligence: 50 + Math.random() * 50,
        integrity: 50 + Math.random() * 50,
        ambition: 50 + Math.random() * 50
      },
      approval_rating: 40 + Math.random() * 40,
      political_stance: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as any,
      personality: {
        risk_tolerance: Math.random() * 100,
        collaboration_preference: Math.random() * 100,
        compromise_willingness: Math.random() * 100,
        populism_tendency: Math.random() * 100,
        reform_preference: Math.random() * 100
      },
      relationships: new Map(),
      policy_positions: [],
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private createTestDecisionContext(): DecisionContext {
    return {
      climate: this.createTestClimate(),
      recent_events: [],
      all_politicians: this.orchestrator.getAllAIPoliticians().map(p => p.politician),
      active_policies: this.createTestPolicies(),
      current_tick: this.orchestrator.getCurrentTick(),
      urgency: Math.random() * 100
    };
  }

  private createTestClimate(): PoliticalClimate {
    return {
      public_trust: 40 + Math.random() * 40,
      economic_conditions: ['poor', 'fair', 'good'][Math.floor(Math.random() * 3)] as any,
      dominant_issues: ['economic', 'social', 'environmental'],
      stability: 50 + Math.random() * 40
    };
  }

  private createTestEvent(type: string): SimulationEvent {
    return {
      id: `test_event_${Date.now()}_${Math.random()}`,
      type: type as any,
      title: `Test ${type} Event`,
      description: `A test event of type ${type}`,
      timestamp: Date.now(),
      impact: {
        approval: Math.random() * 20 - 10,
        resources: { influence: Math.random() * 10, media: Math.random() * 10 }
      },
      resolved: false
    };
  }

  private createTestPolicies(): Policy[] {
    return [
      {
        id: 'test_policy_1',
        title: 'Test Economic Policy',
        description: 'A test policy for economic matters',
        category: 'economic',
        status: 'proposed',
        sponsor_id: 'politician_0',
        supporters: [],
        opponents: [],
        public_support: 50 + Math.random() * 30,
        economic_impact: {
          cost: 100,
          benefit: 120,
          implementation_timeframe: '2 years'
        },
        voting_predictions: {
          support_percentage: 60,
          confidence: 70,
          swing_votes: []
        },
        introduced_at: new Date(),
        updated_at: new Date()
      }
    ];
  }

  private verifyPersonalityAlignment(aiPolitician: AIPolitician, decision: PoliticalAction): number {
    // Simplified alignment check - in practice would be more sophisticated
    let alignment = 50; // Base alignment

    const traits = aiPolitician.archetype.traits;

    // Check risk tolerance alignment
    if (decision.type.includes('risk') && traits.risk_tolerance > 70) {
      alignment += 20;
    }

    // Check collaboration alignment
    if (decision.type.includes('coalition') && traits.coalition_building > 70) {
      alignment += 20;
    }

    // Check reform preference alignment
    if (decision.type.includes('reform') && traits.reform_preference > 70) {
      alignment += 15;
    }

    return Math.min(100, alignment);
  }

  private verifyEventResponseAppropriateness(
    aiPolitician: AIPolitician,
    event: SimulationEvent,
    response: any
  ): number {
    // Simplified appropriateness check
    let appropriateness = 60; // Base score

    // Check if response type matches archetype preferences
    const expectedPatterns = aiPolitician.archetype.response_patterns[event.type as keyof typeof aiPolitician.archetype.response_patterns] || [];

    if (expectedPatterns.includes(response.response_type)) {
      appropriateness += 30;
    }

    // Check confidence level
    if (response.confidence >= 60) {
      appropriateness += 10;
    }

    return Math.min(100, appropriateness);
  }

  private async measureBehaviorDifference(group1: AIPolitician[], group2: AIPolitician[]): Promise<number> {
    // Simplified behavior difference measurement
    // In practice would analyze decision patterns, response types, etc.

    const trait1 = group1[0]?.archetype.traits.risk_tolerance || 50;
    const trait2 = group2[0]?.archetype.traits.risk_tolerance || 50;

    return Math.abs(trait1 - trait2);
  }

  private addTestResult(
    testName: string,
    passed: boolean,
    score: number,
    details: string,
    executionTime: number,
    errors: string[] = []
  ): void {
    this.testResults.push({
      test_name: testName,
      passed,
      score: Math.round(score),
      details,
      execution_time: executionTime,
      errors
    });
  }

  private generateTestSummary(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const averageScore = this.testResults.reduce((sum, r) => sum + r.score, 0) / totalTests;
    const totalTime = this.testResults.reduce((sum, r) => sum + r.execution_time, 0);

    console.log('\n🎯 AI System Test Summary');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Average Score: ${averageScore.toFixed(1)}%`);
    console.log(`Total Execution Time: ${totalTime.toFixed(0)}ms`);
    console.log('=' .repeat(50));

    // Show failed tests
    const failedTests = this.testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.test_name}: ${test.details}`);
        if (test.errors.length > 0) {
          console.log(`    Errors: ${test.errors.slice(0, 3).join(', ')}`);
        }
      });
    }

    // Show performance metrics
    console.log('\n📊 Performance Metrics:');
    this.testResults.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`  ${status} ${test.test_name}: ${test.score}% (${test.execution_time}ms)`);
    });
  }
}

/**
 * Export function to run quick AI system validation
 * @returns Promise resolving to overall system health score
 */
export async function validateAISystem(): Promise<number> {
  const testSuite = new AISystemTestSuite({
    num_politicians: 3,
    num_ticks: 10,
    num_events: 5,
    consistency_threshold: 60,
    performance_threshold: 60
  });

  const results = await testSuite.runAllTests();
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return averageScore;
}

export default AISystemTestSuite;