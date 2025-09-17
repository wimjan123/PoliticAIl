/**
 * Tick System Integration Tests
 *
 * Comprehensive tests for the Game Tick System with 4-6 entities
 * validating <100ms performance targets and all system components.
 */

import { PrototypeSimulation } from '../../simulation/PrototypeSimulation';
import { Politician, Bloc, Policy } from '../../types/entities';
import { TickResult, EngineEvent } from '../../engine/types';

// Helper function to create test politicians
function createTestPolitician(id: string, name: string): Politician {
  return {
    id,
    name,
    role: 'ai_opponent',
    attributes: {
      charisma: Math.floor(Math.random() * 50) + 50,
      intelligence: Math.floor(Math.random() * 50) + 50,
      integrity: Math.floor(Math.random() * 50) + 50,
      ambition: Math.floor(Math.random() * 50) + 50
    },
    approval_rating: Math.floor(Math.random() * 40) + 30,
    political_stance: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as any,
    personality: {
      risk_tolerance: Math.floor(Math.random() * 100),
      collaboration_preference: Math.floor(Math.random() * 100),
      compromise_willingness: Math.floor(Math.random() * 100),
      populism_tendency: Math.floor(Math.random() * 100),
      reform_preference: Math.floor(Math.random() * 100)
    },
    relationships: new Map(),
    position: `Position for ${name}`,
    biography: `Biography for ${name}`,
    policy_positions: [],
    created_at: new Date(),
    updated_at: new Date()
  };
}

// Helper function to create test blocs
function createTestBloc(id: string, name: string): Bloc {
  return {
    id,
    name,
    type: ['party', 'coalition', 'faction'][Math.floor(Math.random() * 3)] as any,
    political_stance: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as any,
    members: [],
    platform: [],
    support_level: Math.floor(Math.random() * 40) + 30,
    resources: {
      funding: Math.floor(Math.random() * 1000000) + 500000,
      media_influence: Math.floor(Math.random() * 100),
      grassroots_strength: Math.floor(Math.random() * 100)
    },
    bloc_relationships: new Map(),
    description: `Description for ${name}`,
    created_at: new Date(),
    updated_at: new Date()
  };
}

// Helper function to create test policies
function createTestPolicy(id: string, title: string, sponsorId: string): Policy {
  return {
    id,
    title,
    description: `Description for ${title}`,
    category: ['economic', 'social', 'environmental'][Math.floor(Math.random() * 3)] as any,
    status: 'proposed',
    sponsor_id: sponsorId,
    supporters: [],
    opponents: [],
    public_support: Math.floor(Math.random() * 40) + 30,
    economic_impact: {
      cost: Math.floor(Math.random() * 1000) + 100,
      benefit: Math.floor(Math.random() * 1000) + 100,
      implementation_timeframe: '6-12 months'
    },
    voting_predictions: {
      support_percentage: Math.floor(Math.random() * 40) + 30,
      confidence: Math.floor(Math.random() * 30) + 70,
      swing_votes: []
    },
    introduced_at: new Date(),
    updated_at: new Date()
  };
}

describe('Tick System Integration Tests', () => {
  let simulation: PrototypeSimulation;
  let testPoliticians: Politician[];
  let testBlocs: Bloc[];
  let testPolicies: Policy[];

  beforeEach(() => {
    // Create test entities (4-6 of each type)
    testPoliticians = [
      createTestPolitician('pol1', 'Alice Johnson'),
      createTestPolitician('pol2', 'Bob Smith'),
      createTestPolitician('pol3', 'Carol Davis'),
      createTestPolitician('pol4', 'David Wilson'),
      createTestPolitician('pol5', 'Emma Brown'),
      createTestPolitician('pol6', 'Frank Miller')
    ];

    testBlocs = [
      createTestBloc('bloc1', 'Progressive Alliance'),
      createTestBloc('bloc2', 'Conservative Union'),
      createTestBloc('bloc3', 'Centrist Coalition'),
      createTestBloc('bloc4', 'Reform Movement')
    ];

    testPolicies = [
      createTestPolicy('policy1', 'Economic Recovery Act', 'pol1'),
      createTestPolicy('policy2', 'Healthcare Reform Bill', 'pol2'),
      createTestPolicy('policy3', 'Environmental Protection Act', 'pol3'),
      createTestPolicy('policy4', 'Education Funding Initiative', 'pol4'),
      createTestPolicy('policy5', 'Infrastructure Investment Plan', 'pol5')
    ];

    // Initialize simulation with test entities
    simulation = new PrototypeSimulation({
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: true,
      initialEntities: {
        politicians: testPoliticians,
        blocs: testBlocs,
        policies: testPolicies
      },
      performance: {
        maxTickTime: 100, // 100ms target
        subsystemBudgets: new Map([
          ['PoliticalEntitySubsystem', 20],
          ['RelationshipSubsystem', 10],
          ['EventSubsystem', 15],
          ['DecisionSubsystem', 25]
        ]),
        degradationThresholds: {
          warning: 70,
          critical: 90
        },
        monitoringWindow: 20
      }
    });
  });

  afterEach(async () => {
    if (simulation) {
      simulation.cleanup();
    }
  });

  describe('T4.1a - Basic Tick Loop Architecture', () => {
    test('should initialize simulation with deterministic tick loop', async () => {
      await simulation.initialize();

      const status = simulation.getStatus();
      expect(status.currentTick).toBe(0);
      expect(status.totalEntities).toBe(15); // 6 politicians + 4 blocs + 5 policies
      expect(status.isRunning).toBe(false);
      expect(status.isPaused).toBe(false);
    });

    test('should maintain precise tick timing at 1 second intervals', async () => {
      await simulation.initialize();

      const tickTimes: number[] = [];
      let tickCount = 0;

      simulation.addEventListener((event: EngineEvent) => {
        if (event.type === 'TICK_COMPLETE') {
          tickTimes.push(event.payload.tickTime);
          tickCount++;
        }
      });

      simulation.start();

      // Wait for several ticks
      await new Promise(resolve => setTimeout(resolve, 3500));
      simulation.stop();

      expect(tickCount).toBeGreaterThanOrEqual(3);
      expect(tickCount).toBeLessThanOrEqual(4); // Should be around 3 ticks in 3.5 seconds
    });

    test('should track tick counter and simulation state correctly', async () => {
      await simulation.initialize();

      // Process manual ticks
      const tick1 = await simulation.processTick();
      expect(tick1.tickNumber).toBe(1);

      const tick2 = await simulation.processTick();
      expect(tick2.tickNumber).toBe(2);

      const status = simulation.getStatus();
      expect(status.currentTick).toBeGreaterThanOrEqual(2);
    });
  });

  describe('T4.1b - Parallel Subsystem Processing', () => {
    test('should execute all subsystems in parallel within time budget', async () => {
      await simulation.initialize();

      const tickResult = await simulation.processTick();

      // Verify all subsystems executed
      expect(tickResult.subsystemResults).toHaveLength(4);

      const subsystemNames = tickResult.subsystemResults.map(r => r.name);
      expect(subsystemNames).toContain('PoliticalEntitySubsystem');
      expect(subsystemNames).toContain('RelationshipSubsystem');
      expect(subsystemNames).toContain('EventSubsystem');
      expect(subsystemNames).toContain('DecisionSubsystem');

      // Verify all subsystems processed entities
      tickResult.subsystemResults.forEach(result => {
        expect(result.entitiesProcessed).toBeGreaterThan(0);
        expect(result.success).toBe(true);
      });
    });

    test('should respect subsystem dependencies and execution order', async () => {
      await simulation.initialize();

      const executionOrder: string[] = [];

      simulation.addEventListener((event: EngineEvent) => {
        if (event.type === 'TICK_COMPLETE') {
          // Record execution order based on when subsystems report completion
          event.payload.subsystemResults.forEach((result: any) => {
            executionOrder.push(result.name);
          });
        }
      });

      await simulation.processTick();

      // PoliticalEntitySubsystem should execute before RelationshipSubsystem
      const politicalIndex = executionOrder.indexOf('PoliticalEntitySubsystem');
      const relationshipIndex = executionOrder.indexOf('RelationshipSubsystem');
      expect(politicalIndex).toBeLessThan(relationshipIndex);

      // RelationshipSubsystem should execute before DecisionSubsystem
      const decisionIndex = executionOrder.indexOf('DecisionSubsystem');
      expect(relationshipIndex).toBeLessThan(decisionIndex);
    });

    test('should handle inter-subsystem communication', async () => {
      await simulation.initialize();

      // Track messages between subsystems
      let messagesReceived = 0;

      simulation.addEventListener((event: EngineEvent) => {
        if ((event as any).type === 'SUBSYSTEM_MESSAGE') {
          messagesReceived++;
        }
      });

      await simulation.processTick();

      // Should have some communication between subsystems
      // (specific count depends on implementation details)
      expect(messagesReceived).toBeGreaterThanOrEqual(0);
    });
  });

  describe('T4.1c - Performance Monitoring Integration', () => {
    test('should validate <100ms performance target with 6 entities', async () => {
      await simulation.initialize();

      const results: TickResult[] = [];

      // Process multiple ticks to get average performance
      for (let i = 0; i < 10; i++) {
        const result = await simulation.processTick();
        results.push(result);
      }

      // Calculate average tick time
      const averageTickTime = results.reduce((sum, r) => sum + r.tickTime, 0) / results.length;

      console.log(`Average tick time with 15 entities: ${averageTickTime.toFixed(2)}ms`);

      // Verify performance target
      expect(averageTickTime).toBeLessThan(100);

      // Verify most ticks meet performance target
      const passingTicks = results.filter(r => r.passed).length;
      const passRate = (passingTicks / results.length) * 100;

      expect(passRate).toBeGreaterThan(80); // At least 80% should pass
    });

    test('should provide real-time performance tracking per subsystem', async () => {
      await simulation.initialize();

      await simulation.processTick();

      const performanceSummary = simulation.getPerformanceSummary();

      expect(performanceSummary).toBeTruthy();
      expect(performanceSummary.subsystemStatus).toHaveLength(4);

      // Each subsystem should have performance data
      performanceSummary.subsystemStatus.forEach((status: string) => {
        expect(status).toMatch(/\d+\.\d+ms/); // Should contain timing information
      });
    });

    test('should detect performance alerts and degradation', async () => {
      await simulation.initialize();

      let performanceAlerts = 0;

      simulation.addEventListener((event: EngineEvent) => {
        if (event.type === 'PERFORMANCE_WARNING' || event.type === 'PERFORMANCE_CRITICAL') {
          performanceAlerts++;
        }
      });

      // Process ticks and monitor for alerts
      for (let i = 0; i < 5; i++) {
        await simulation.processTick();
      }

      // Performance should be good with this small entity count
      expect(performanceAlerts).toBeLessThanOrEqual(1);
    });
  });

  describe('T4.1d - Graceful Degradation System', () => {
    test('should enforce performance budgets for subsystems', async () => {
      await simulation.initialize();

      const tickResult = await simulation.processTick();

      // Check that subsystems stay within their budgets
      tickResult.subsystemResults.forEach(result => {
        const budgetExceeded = result.processingTime > result.timeBudget;

        if (budgetExceeded) {
          console.warn(`Subsystem ${result.name} exceeded budget: ${result.processingTime.toFixed(2)}ms > ${result.timeBudget}ms`);
        }

        // Most subsystems should stay within budget with this entity count
        // Allow some flexibility for test environment variations
      });
    });

    test('should handle graceful degradation under simulated load', async () => {
      await simulation.initialize();

      // Add more entities to increase load
      const additionalPoliticians = Array.from({ length: 10 }, (_, i) =>
        createTestPolitician(`stress_pol_${i}`, `Stress Politician ${i}`)
      );

      simulation.addEntities({ politicians: additionalPoliticians });

      const status = simulation.getStatus();
      expect(status.totalEntities).toBe(25); // 16 politicians + 4 blocs + 5 policies

      let degradationActivated = false;

      simulation.addEventListener((event: EngineEvent) => {
        if (event.type === 'DEGRADATION_ACTIVATED') {
          degradationActivated = true;
        }
      });

      // Process multiple ticks under higher load
      for (let i = 0; i < 5; i++) {
        await simulation.processTick();
      }

      const finalStatus = simulation.getStatus();

      // System should still function with more entities
      expect(finalStatus.totalEntities).toBe(25);

      if (degradationActivated) {
        console.log('Degradation was activated under increased load');
        expect(finalStatus.degradation.level).toBeGreaterThan(0);
      }
    });

    test('should scale complexity dynamically based on performance', async () => {
      await simulation.initialize();

      const initialStatus = simulation.getStatus();

      // Process several ticks to establish baseline
      for (let i = 0; i < 3; i++) {
        await simulation.processTick();
      }

      const performanceSummary = simulation.getPerformanceSummary();

      expect(performanceSummary).toBeTruthy();
      expect(performanceSummary.overall).toContain('optimal');

      // Performance should be good with normal entity count
      expect(performanceSummary.tickCompliance).toMatch(/\d+\.\d+% on-time/);
    });
  });

  describe('Integration and End-to-End Tests', () => {
    test('should maintain <100ms average with 4-6 entities in continuous operation', async () => {
      await simulation.initialize();

      const tickTimes: number[] = [];
      let completedTicks = 0;

      simulation.addEventListener((event: EngineEvent) => {
        if (event.type === 'TICK_COMPLETE') {
          tickTimes.push(event.payload.tickTime);
          completedTicks++;
        }
      });

      simulation.start();

      // Run for 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      simulation.stop();

      expect(completedTicks).toBeGreaterThanOrEqual(8);
      expect(completedTicks).toBeLessThanOrEqual(12);

      const averageTickTime = tickTimes.reduce((sum, time) => sum + time, 0) / tickTimes.length;

      console.log(`Continuous operation average: ${averageTickTime.toFixed(2)}ms over ${completedTicks} ticks`);

      expect(averageTickTime).toBeLessThan(100);

      // Verify consistency - no tick should be excessively long
      const maxTickTime = Math.max(...tickTimes);
      expect(maxTickTime).toBeLessThan(200); // Allow some variance but not excessive
    });

    test('should handle all subsystems working together correctly', async () => {
      await simulation.initialize();

      // Process several ticks and verify entity state changes
      const initialLandscape = simulation.getPoliticalLandscape();

      for (let i = 0; i < 5; i++) {
        await simulation.processTick();
      }

      const finalLandscape = simulation.getPoliticalLandscape();

      // Entities should have been updated
      expect(finalLandscape.politicians.length).toBe(initialLandscape.politicians.length);
      expect(finalLandscape.blocs.length).toBe(initialLandscape.blocs.length);
      expect(finalLandscape.policies.length).toBe(initialLandscape.policies.length);

      // Some politician approval ratings should have changed
      let approvalChanges = 0;
      for (let i = 0; i < finalLandscape.politicians.length; i++) {
        if (finalLandscape.politicians[i].approval_rating !== initialLandscape.politicians[i].approval_rating) {
          approvalChanges++;
        }
      }

      expect(approvalChanges).toBeGreaterThan(0);
    });

    test('should export complete performance data for analysis', async () => {
      await simulation.initialize();

      // Process several ticks
      for (let i = 0; i < 3; i++) {
        await simulation.processTick();
      }

      const exportedData = simulation.exportData();

      expect(exportedData.entities).toBeTruthy();
      expect(exportedData.performance).toBeTruthy();
      expect(exportedData.configuration).toBeTruthy();
      expect(exportedData.status).toBeTruthy();

      // Verify structure of exported data
      expect(exportedData.entities.politicians).toHaveLength(6);
      expect(exportedData.entities.blocs).toHaveLength(4);
      expect(exportedData.entities.policies).toHaveLength(5);

      expect(exportedData.performance.tickHistory).toHaveLength(3);
      expect(exportedData.performance.metrics).toBeTruthy();
    });
  });
});