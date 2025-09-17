/**
 * Extended Performance Test Suite
 *
 * Comprehensive performance validation for 30-minute continuous sessions,
 * memory usage monitoring, and long-term stability testing.
 */

import { PrototypeSimulation } from '../../simulation/PrototypeSimulation';
import { PerformanceMonitor } from '../../engine/PerformanceMonitor';
import { Politician, Bloc, Policy } from '../../types/entities';

interface ExtendedTestConfig {
  duration: number; // Duration in milliseconds
  entityCounts: number[]; // Array of entity counts to test
  memoryThreshold: {
    baseline: number; // 200MB baseline
    peak: number; // 500MB peak
  };
  performanceThreshold: {
    maxTickTime: number; // 100ms target
    averageTickTime: number; // 50ms average target
  };
  samplingInterval: number; // How often to sample metrics (ms)
}

interface ExtendedTestResult {
  testName: string;
  duration: number;
  totalTicks: number;
  entityCount: number;
  performance: {
    averageTickTime: number;
    maxTickTime: number;
    minTickTime: number;
    tickTimeVariance: number;
    targetCompliance: number; // % of ticks under 100ms
  };
  memory: {
    baseline: number;
    peak: number;
    average: number;
    samples: MemorySample[];
  };
  stability: {
    degradationEvents: number;
    performanceWarnings: number;
    performanceCritical: number;
    memoryLeakDetected: boolean;
  };
  timestamp: Date;
}

interface MemorySample {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export class ExtendedPerformanceTest {
  private config: ExtendedTestConfig;
  private results: ExtendedTestResult[] = [];

  constructor(config?: Partial<ExtendedTestConfig>) {
    this.config = {
      duration: 30 * 60 * 1000, // 30 minutes
      entityCounts: [4, 6, 8, 10, 12], // Entity counts to test
      memoryThreshold: {
        baseline: 200 * 1024 * 1024, // 200MB
        peak: 500 * 1024 * 1024 // 500MB
      },
      performanceThreshold: {
        maxTickTime: 100, // 100ms
        averageTickTime: 50 // 50ms average
      },
      samplingInterval: 5000, // Sample every 5 seconds
      ...config
    };
  }

  /**
   * Run extended performance validation
   */
  public async runExtendedValidation(): Promise<ExtendedTestResult[]> {
    console.log('[ExtendedPerformanceTest] Starting extended performance validation...');
    console.log(`Duration: ${this.config.duration / 60000} minutes`);
    console.log(`Entity counts: ${this.config.entityCounts.join(', ')}`);

    this.results = [];

    for (const entityCount of this.config.entityCounts) {
      console.log(`\n[ExtendedPerformanceTest] Testing with ${entityCount} entities...`);
      const result = await this.runSingleExtendedTest(entityCount);
      this.results.push(result);

      // Log immediate results
      this.logTestResult(result);

      // Allow brief cooldown between tests
      await this.sleep(5000);
    }

    console.log('\n[ExtendedPerformanceTest] Extended validation completed!');
    return this.results;
  }

  /**
   * Run a single extended test session
   */
  private async runSingleExtendedTest(entityCount: number): Promise<ExtendedTestResult> {
    const testName = `Extended-${entityCount}-Entities`;
    const startTime = Date.now();

    // Create simulation with specified entity count
    const simulation = this.createSimulationWithEntities(entityCount);

    await simulation.initialize();

    // Set up monitoring
    const memorySamples: MemorySample[] = [];
    const performanceData: any[] = [];
    let degradationEvents = 0;
    let performanceWarnings = 0;
    let performanceCritical = 0;

    // Event listeners for monitoring
    simulation.addEventListener((event) => {
      if (event.type === 'PERFORMANCE_WARNING') {
        performanceWarnings++;
      } else if (event.type === 'PERFORMANCE_CRITICAL') {
        performanceCritical++;
      } else if (event.type === 'DEGRADATION_APPLIED') {
        degradationEvents++;
      }
    });

    // Start memory sampling
    const memorySamplingInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      memorySamples.push({
        timestamp: Date.now() - startTime,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      });
    }, this.config.samplingInterval);

    // Start simulation
    simulation.start();

    // Wait for test duration
    await this.sleep(this.config.duration);

    // Stop simulation and cleanup
    simulation.stop();
    clearInterval(memorySamplingInterval);

    // Collect final performance data
    const performanceSummary = simulation.getPerformanceSummary();
    const status = simulation.getStatus();

    simulation.cleanup();

    // Analyze results
    const memoryAnalysis = this.analyzeMemoryUsage(memorySamples);
    const performanceAnalysis = this.analyzePerformance(performanceSummary);
    const stabilityAnalysis = this.analyzeStability(memorySamples, performanceAnalysis);

    return {
      testName,
      duration: this.config.duration,
      totalTicks: status.currentTick,
      entityCount,
      performance: performanceAnalysis,
      memory: memoryAnalysis,
      stability: {
        degradationEvents,
        performanceWarnings,
        performanceCritical,
        memoryLeakDetected: stabilityAnalysis.memoryLeakDetected
      },
      timestamp: new Date()
    };
  }

  /**
   * Create simulation instance with specified entity count
   */
  private createSimulationWithEntities(entityCount: number): PrototypeSimulation {
    const entities = this.generateTestEntities(entityCount);

    return new PrototypeSimulation({
      initialEntities: entities,
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: true,
      performance: {
        maxTickTime: this.config.performanceThreshold.maxTickTime,
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
  }

  /**
   * Generate test entities for simulation
   */
  private generateTestEntities(count: number): {
    politicians: Politician[];
    blocs: Bloc[];
    policies: Policy[];
  } {
    const politicians: Politician[] = [];
    const blocs: Bloc[] = [];
    const policies: Policy[] = [];

    // Generate politicians (60% of entities)
    const politicianCount = Math.floor(count * 0.6);
    for (let i = 0; i < politicianCount; i++) {
      politicians.push({
        id: `politician-${i}`,
        name: `Test Politician ${i}`,
        ideology: {
          economic: Math.random() * 200 - 100,
          social: Math.random() * 200 - 100
        },
        resources: {
          political_capital: Math.random() * 100,
          funding: Math.random() * 1000000
        },
        reputation: Math.random() * 100,
        experience: Math.random() * 30,
        network: [],
        traits: [`trait_${i % 5}`],
        current_position: i % 3 === 0 ? 'government' : 'opposition'
      });
    }

    // Generate blocs (25% of entities)
    const blocCount = Math.floor(count * 0.25);
    for (let i = 0; i < blocCount; i++) {
      blocs.push({
        id: `bloc-${i}`,
        name: `Test Bloc ${i}`,
        ideology: {
          economic: Math.random() * 200 - 100,
          social: Math.random() * 200 - 100
        },
        members: politicians.slice(0, Math.min(3, politicians.length)),
        resources: {
          political_capital: Math.random() * 500,
          funding: Math.random() * 5000000
        },
        influence: Math.random() * 100,
        cohesion: Math.random() * 100
      });
    }

    // Generate policies (15% of entities)
    const policyCount = Math.max(1, count - politicianCount - blocCount);
    for (let i = 0; i < policyCount; i++) {
      policies.push({
        id: `policy-${i}`,
        name: `Test Policy ${i}`,
        description: `Test policy description ${i}`,
        ideology_impact: {
          economic: Math.random() * 20 - 10,
          social: Math.random() * 20 - 10
        },
        support_base: Math.random() * 100,
        implementation_cost: Math.random() * 1000000,
        status: i % 3 === 0 ? 'proposed' : 'under_review',
        sponsor: politicians[i % politicians.length]?.id || 'unknown'
      });
    }

    return { politicians, blocs, policies };
  }

  /**
   * Analyze memory usage patterns
   */
  private analyzeMemoryUsage(samples: MemorySample[]): {
    baseline: number;
    peak: number;
    average: number;
    samples: MemorySample[];
  } {
    if (samples.length === 0) {
      return {
        baseline: 0,
        peak: 0,
        average: 0,
        samples: []
      };
    }

    const heapValues = samples.map(s => s.heapUsed);
    const baseline = Math.min(...heapValues);
    const peak = Math.max(...heapValues);
    const average = heapValues.reduce((a, b) => a + b, 0) / heapValues.length;

    return {
      baseline,
      peak,
      average,
      samples
    };
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(performanceSummary: any): {
    averageTickTime: number;
    maxTickTime: number;
    minTickTime: number;
    tickTimeVariance: number;
    targetCompliance: number;
  } {
    if (!performanceSummary || !performanceSummary.tickTimes) {
      return {
        averageTickTime: 0,
        maxTickTime: 0,
        minTickTime: 0,
        tickTimeVariance: 0,
        targetCompliance: 0
      };
    }

    const tickTimes = performanceSummary.tickTimes;
    const averageTickTime = tickTimes.reduce((a: number, b: number) => a + b, 0) / tickTimes.length;
    const maxTickTime = Math.max(...tickTimes);
    const minTickTime = Math.min(...tickTimes);

    // Calculate variance
    const variance = tickTimes.reduce((acc: number, time: number) => {
      return acc + Math.pow(time - averageTickTime, 2);
    }, 0) / tickTimes.length;
    const tickTimeVariance = Math.sqrt(variance);

    // Calculate target compliance
    const compliantTicks = tickTimes.filter((time: number) => time <= this.config.performanceThreshold.maxTickTime).length;
    const targetCompliance = (compliantTicks / tickTimes.length) * 100;

    return {
      averageTickTime,
      maxTickTime,
      minTickTime,
      tickTimeVariance,
      targetCompliance
    };
  }

  /**
   * Analyze stability metrics
   */
  private analyzeStability(memorySamples: MemorySample[], performanceAnalysis: any): {
    memoryLeakDetected: boolean;
  } {
    // Simple memory leak detection - check if memory usage consistently increases
    if (memorySamples.length < 10) {
      return { memoryLeakDetected: false };
    }

    const firstHalf = memorySamples.slice(0, Math.floor(memorySamples.length / 2));
    const secondHalf = memorySamples.slice(Math.floor(memorySamples.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, sample) => sum + sample.heapUsed, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, sample) => sum + sample.heapUsed, 0) / secondHalf.length;

    // If second half uses 20% more memory on average, consider it a leak
    const memoryLeakDetected = secondHalfAvg > firstHalfAvg * 1.2;

    return { memoryLeakDetected };
  }

  /**
   * Log test result summary
   */
  private logTestResult(result: ExtendedTestResult): void {
    console.log(`\n=== ${result.testName} Results ===`);
    console.log(`Duration: ${result.duration / 1000}s, Ticks: ${result.totalTicks}`);
    console.log(`Entities: ${result.entityCount}`);

    console.log('\nPerformance:');
    console.log(`  Average Tick Time: ${result.performance.averageTickTime.toFixed(2)}ms`);
    console.log(`  Max Tick Time: ${result.performance.maxTickTime.toFixed(2)}ms`);
    console.log(`  Target Compliance: ${result.performance.targetCompliance.toFixed(1)}%`);

    console.log('\nMemory:');
    console.log(`  Baseline: ${(result.memory.baseline / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(result.memory.peak / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Average: ${(result.memory.average / 1024 / 1024).toFixed(2)}MB`);

    console.log('\nStability:');
    console.log(`  Degradation Events: ${result.stability.degradationEvents}`);
    console.log(`  Performance Warnings: ${result.stability.performanceWarnings}`);
    console.log(`  Performance Critical: ${result.stability.performanceCritical}`);
    console.log(`  Memory Leak Detected: ${result.stability.memoryLeakDetected}`);

    // Validation status
    const memoryValid = result.memory.baseline <= this.config.memoryThreshold.baseline &&
                       result.memory.peak <= this.config.memoryThreshold.peak;
    const performanceValid = result.performance.averageTickTime <= this.config.performanceThreshold.averageTickTime &&
                           result.performance.targetCompliance >= 90;

    console.log(`\nValidation: ${memoryValid && performanceValid ? 'PASSED' : 'FAILED'}`);
    if (!memoryValid) console.log('  Memory thresholds exceeded');
    if (!performanceValid) console.log('  Performance thresholds exceeded');
  }

  /**
   * Get all test results
   */
  public getResults(): ExtendedTestResult[] {
    return [...this.results];
  }

  /**
   * Export results to JSON
   */
  public exportResults(): string {
    return JSON.stringify({
      config: this.config,
      results: this.results,
      summary: this.generateSummary()
    }, null, 2);
  }

  /**
   * Generate test summary
   */
  public generateSummary(): any {
    if (this.results.length === 0) {
      return { message: 'No test results available' };
    }

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r =>
      r.memory.baseline <= this.config.memoryThreshold.baseline &&
      r.memory.peak <= this.config.memoryThreshold.peak &&
      r.performance.averageTickTime <= this.config.performanceThreshold.averageTickTime &&
      r.performance.targetCompliance >= 90
    ).length;

    const avgPerformance = this.results.reduce((sum, r) => sum + r.performance.averageTickTime, 0) / totalTests;
    const avgMemoryPeak = this.results.reduce((sum, r) => sum + r.memory.peak, 0) / totalTests;
    const totalTicks = this.results.reduce((sum, r) => sum + r.totalTicks, 0);

    return {
      totalTests,
      passedTests,
      passRate: (passedTests / totalTests) * 100,
      averageTickTime: avgPerformance,
      averageMemoryPeak: avgMemoryPeak,
      totalTicksProcessed: totalTicks,
      testDuration: this.config.duration,
      thresholds: {
        memory: this.config.memoryThreshold,
        performance: this.config.performanceThreshold
      }
    };
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}