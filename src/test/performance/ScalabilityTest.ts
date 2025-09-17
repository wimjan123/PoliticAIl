/**
 * Scalability Test Suite
 *
 * Tests simulation performance scaling characteristics with increasing
 * entity counts to determine performance correlation and breaking points.
 */

import { PrototypeSimulation } from '../../simulation/PrototypeSimulation';
import { Politician, Bloc, Policy } from '../../types/entities';

interface ScalabilityTestConfig {
  entityCounts: number[]; // Array of entity counts to test
  testDuration: number; // Duration for each test in ms
  warmupTicks: number; // Number of ticks to warm up before measuring
  measurementTicks: number; // Number of ticks to measure performance
  performanceTarget: number; // Target tick time in ms
  scalabilityThreshold: number; // Acceptable performance degradation %
}

interface ScalabilityTestResult {
  entityCount: number;
  performance: {
    averageTickTime: number;
    medianTickTime: number;
    p95TickTime: number;
    maxTickTime: number;
    minTickTime: number;
    standardDeviation: number;
    targetCompliance: number; // % of ticks under target
  };
  throughput: {
    ticksPerSecond: number;
    entitiesPerSecond: number;
    subsystemsPerSecond: number;
  };
  scalability: {
    linearityScore: number; // 0-100, how linear the scaling is
    efficiencyScore: number; // 0-100, performance per entity
    degradationFromBaseline: number; // % performance loss from smallest test
  };
  memory: {
    peakUsage: number;
    averageUsage: number;
    memoryPerEntity: number;
  };
  timestamp: Date;
}

interface ScalabilityAnalysis {
  optimalEntityCount: number;
  breakingPoint?: number; // Entity count where performance becomes unacceptable
  scalingCharacteristics: {
    pattern: 'linear' | 'logarithmic' | 'exponential' | 'irregular';
    efficiency: 'excellent' | 'good' | 'acceptable' | 'poor';
    recommendation: string;
  };
  performanceCorrelation: {
    entityCountCorrelation: number; // -1 to 1, correlation between entity count and tick time
    memoryCorrelation: number; // Correlation between entity count and memory usage
    predictive: boolean; // Whether scaling is predictable
  };
  resourceBottlenecks: {
    cpu: boolean;
    memory: boolean;
    subsystems: string[]; // Which subsystems are bottlenecks
  };
}

export class ScalabilityTest {
  private config: ScalabilityTestConfig;
  private results: ScalabilityTestResult[] = [];

  constructor(config?: Partial<ScalabilityTestConfig>) {
    this.config = {
      entityCounts: [2, 4, 6, 8, 10, 12, 15, 18, 20, 25], // Progressive entity counts
      testDuration: 2 * 60 * 1000, // 2 minutes per test
      warmupTicks: 10, // 10 ticks warmup
      measurementTicks: 100, // Measure over 100 ticks
      performanceTarget: 100, // 100ms target
      scalabilityThreshold: 50, // 50% degradation threshold
      ...config
    };
  }

  /**
   * Run complete scalability test suite
   */
  public async runScalabilityTests(): Promise<{
    results: ScalabilityTestResult[];
    analysis: ScalabilityAnalysis;
  }> {
    console.log('[ScalabilityTest] Starting scalability test suite...');
    console.log(`Testing entity counts: ${this.config.entityCounts.join(', ')}`);

    this.results = [];

    for (const entityCount of this.config.entityCounts) {
      console.log(`\n[ScalabilityTest] Testing ${entityCount} entities...`);

      const result = await this.runSingleScalabilityTest(entityCount);
      this.results.push(result);

      this.logScalabilityResult(result);

      // Brief cooldown between tests
      await this.sleep(3000);

      // Early termination if performance becomes unacceptable
      if (result.performance.averageTickTime > this.config.performanceTarget * 3) {
        console.log(`[ScalabilityTest] Performance severely degraded at ${entityCount} entities. Stopping tests.`);
        break;
      }
    }

    const analysis = this.analyzeScalability();

    console.log('\n[ScalabilityTest] Scalability testing completed!');
    this.logScalabilityAnalysis(analysis);

    return {
      results: this.results,
      analysis
    };
  }

  /**
   * Run scalability test for specific entity count
   */
  private async runSingleScalabilityTest(entityCount: number): Promise<ScalabilityTestResult> {
    const simulation = this.createSimulation(entityCount);
    await simulation.initialize();

    // Warmup phase
    console.log(`  Warmup phase (${this.config.warmupTicks} ticks)...`);
    simulation.start();

    // Wait for warmup ticks
    const startTick = simulation.getStatus().currentTick;
    while (simulation.getStatus().currentTick < startTick + this.config.warmupTicks) {
      await this.sleep(50);
    }

    // Measurement phase
    console.log(`  Measurement phase (${this.config.measurementTicks} ticks)...`);
    const measurementStart = Date.now();
    const tickTimes: number[] = [];
    const memoryUsages: number[] = [];

    let lastTick = simulation.getStatus().currentTick;
    const targetTicks = lastTick + this.config.measurementTicks;

    while (simulation.getStatus().currentTick < targetTicks) {
      const currentTick = simulation.getStatus().currentTick;

      if (currentTick > lastTick) {
        // Record tick performance
        const performanceSummary = simulation.getPerformanceSummary();
        if (performanceSummary && performanceSummary.tickTimes) {
          const recentTickTime = performanceSummary.tickTimes[performanceSummary.tickTimes.length - 1];
          if (recentTickTime) {
            tickTimes.push(recentTickTime);
          }
        }

        // Record memory usage
        memoryUsages.push(process.memoryUsage().heapUsed);
        lastTick = currentTick;
      }

      await this.sleep(10);
    }

    const measurementDuration = Date.now() - measurementStart;

    simulation.stop();
    simulation.cleanup();

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(tickTimes);
    const throughput = this.calculateThroughputMetrics(tickTimes.length, entityCount, measurementDuration);
    const scalability = this.calculateScalabilityMetrics(entityCount, performance);
    const memory = this.calculateMemoryMetrics(memoryUsages, entityCount);

    return {
      entityCount,
      performance,
      throughput,
      scalability,
      memory,
      timestamp: new Date()
    };
  }

  /**
   * Create simulation with specified entity count
   */
  private createSimulation(entityCount: number): PrototypeSimulation {
    const entities = this.generateScalabilityTestEntities(entityCount);

    return new PrototypeSimulation({
      initialEntities: entities,
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: false, // Disable degradation for pure performance testing
      performance: {
        maxTickTime: this.config.performanceTarget,
        subsystemBudgets: new Map([
          ['PoliticalEntitySubsystem', 25],
          ['RelationshipSubsystem', 15],
          ['EventSubsystem', 20],
          ['DecisionSubsystem', 30]
        ]),
        degradationThresholds: {
          warning: 80,
          critical: 95
        },
        monitoringWindow: 20
      }
    });
  }

  /**
   * Generate entities optimized for scalability testing
   */
  private generateScalabilityTestEntities(count: number): {
    politicians: Politician[];
    blocs: Bloc[];
    policies: Policy[];
  } {
    const politicians: Politician[] = [];
    const blocs: Bloc[] = [];
    const policies: Policy[] = [];

    // Calculate distribution - favor politicians for complexity
    const politicianCount = Math.max(1, Math.floor(count * 0.7));
    const blocCount = Math.max(1, Math.floor(count * 0.2));
    const policyCount = Math.max(1, count - politicianCount - blocCount);

    // Generate politicians with consistent complexity
    for (let i = 0; i < politicianCount; i++) {
      const networkSize = Math.min(5, Math.floor(politicianCount / 3)); // Limit network size
      const network: string[] = [];

      for (let j = 0; j < networkSize; j++) {
        const networkId = `politician-scale-${(i + j + 1) % politicianCount}`;
        if (networkId !== `politician-scale-${i}`) {
          network.push(networkId);
        }
      }

      politicians.push({
        id: `politician-scale-${i}`,
        name: `Scalability Test Politician ${i}`,
        ideology: {
          economic: (i % 21 - 10) * 10, // Predictable distribution
          social: ((i * 7) % 21 - 10) * 10
        },
        resources: {
          political_capital: 50 + (i % 50),
          funding: 500000 + (i % 10) * 100000
        },
        reputation: 50 + (i % 50),
        experience: 5 + (i % 20),
        network,
        traits: [`trait_${i % 8}`, `secondary_${i % 5}`],
        current_position: i % 3 === 0 ? 'government' : 'opposition'
      });
    }

    // Generate blocs with consistent complexity
    for (let i = 0; i < blocCount; i++) {
      const memberCount = Math.min(4, Math.max(2, Math.floor(politicianCount / blocCount)));
      const startIdx = i * Math.floor(politicianCount / blocCount);
      const members = politicians.slice(startIdx, startIdx + memberCount);

      blocs.push({
        id: `bloc-scale-${i}`,
        name: `Scalability Test Bloc ${i}`,
        ideology: {
          economic: (i % 11 - 5) * 20,
          social: ((i * 3) % 11 - 5) * 20
        },
        members,
        resources: {
          political_capital: 200 + (i % 100),
          funding: 2000000 + (i % 5) * 1000000
        },
        influence: 40 + (i % 40),
        cohesion: 60 + (i % 30)
      });
    }

    // Generate policies with consistent complexity
    for (let i = 0; i < policyCount; i++) {
      policies.push({
        id: `policy-scale-${i}`,
        name: `Scalability Test Policy ${i}`,
        description: `Scalability test policy ${i} for performance testing`,
        ideology_impact: {
          economic: (i % 9 - 4) * 5,
          social: ((i * 2) % 9 - 4) * 5
        },
        support_base: 30 + (i % 40),
        implementation_cost: 100000 + (i % 10) * 200000,
        status: ['proposed', 'under_review', 'approved'][i % 3] as any,
        sponsor: politicians[i % politicians.length]?.id || 'unknown'
      });
    }

    return { politicians, blocs, policies };
  }

  /**
   * Calculate performance metrics from tick times
   */
  private calculatePerformanceMetrics(tickTimes: number[]): ScalabilityTestResult['performance'] {
    if (tickTimes.length === 0) {
      return {
        averageTickTime: 0,
        medianTickTime: 0,
        p95TickTime: 0,
        maxTickTime: 0,
        minTickTime: 0,
        standardDeviation: 0,
        targetCompliance: 0
      };
    }

    const sortedTimes = [...tickTimes].sort((a, b) => a - b);
    const averageTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
    const medianTickTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const p95TickTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const maxTickTime = Math.max(...tickTimes);
    const minTickTime = Math.min(...tickTimes);

    // Calculate standard deviation
    const variance = tickTimes.reduce((acc, time) => acc + Math.pow(time - averageTickTime, 2), 0) / tickTimes.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate target compliance
    const compliantTicks = tickTimes.filter(time => time <= this.config.performanceTarget).length;
    const targetCompliance = (compliantTicks / tickTimes.length) * 100;

    return {
      averageTickTime,
      medianTickTime,
      p95TickTime,
      maxTickTime,
      minTickTime,
      standardDeviation,
      targetCompliance
    };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(tickCount: number, entityCount: number, duration: number): ScalabilityTestResult['throughput'] {
    const durationInSeconds = duration / 1000;
    const ticksPerSecond = tickCount / durationInSeconds;
    const entitiesPerSecond = (tickCount * entityCount) / durationInSeconds;
    const subsystemsPerSecond = (tickCount * 4) / durationInSeconds; // 4 subsystems

    return {
      ticksPerSecond,
      entitiesPerSecond,
      subsystemsPerSecond
    };
  }

  /**
   * Calculate scalability metrics
   */
  private calculateScalabilityMetrics(entityCount: number, performance: ScalabilityTestResult['performance']): ScalabilityTestResult['scalability'] {
    let linearityScore = 100;
    let efficiencyScore = 100;
    let degradationFromBaseline = 0;

    // If we have baseline results (first test), calculate degradation
    if (this.results.length > 0) {
      const baseline = this.results[0];
      degradationFromBaseline = ((performance.averageTickTime - baseline.performance.averageTickTime) / baseline.performance.averageTickTime) * 100;

      // Calculate linearity score (how close to linear scaling)
      const expectedPerformance = baseline.performance.averageTickTime * (entityCount / baseline.entityCount);
      const actualPerformance = performance.averageTickTime;
      const linearityError = Math.abs(actualPerformance - expectedPerformance) / expectedPerformance;
      linearityScore = Math.max(0, 100 - (linearityError * 100));

      // Calculate efficiency score (performance per entity)
      const baselineEfficiency = baseline.performance.averageTickTime / baseline.entityCount;
      const currentEfficiency = performance.averageTickTime / entityCount;
      const efficiencyRatio = currentEfficiency / baselineEfficiency;
      efficiencyScore = Math.max(0, 100 - ((efficiencyRatio - 1) * 100));
    }

    return {
      linearityScore,
      efficiencyScore,
      degradationFromBaseline
    };
  }

  /**
   * Calculate memory metrics
   */
  private calculateMemoryMetrics(memoryUsages: number[], entityCount: number): ScalabilityTestResult['memory'] {
    if (memoryUsages.length === 0) {
      return { peakUsage: 0, averageUsage: 0, memoryPerEntity: 0 };
    }

    const peakUsage = Math.max(...memoryUsages);
    const averageUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const memoryPerEntity = averageUsage / entityCount;

    return {
      peakUsage,
      averageUsage,
      memoryPerEntity
    };
  }

  /**
   * Analyze overall scalability characteristics
   */
  private analyzeScalability(): ScalabilityAnalysis {
    if (this.results.length === 0) {
      throw new Error('No scalability test results available for analysis');
    }

    // Find optimal entity count (best performance/entity ratio)
    let optimalEntityCount = this.results[0].entityCount;
    let bestEfficiency = this.results[0].scalability.efficiencyScore;

    for (const result of this.results) {
      if (result.scalability.efficiencyScore > bestEfficiency &&
          result.performance.targetCompliance > 90) {
        bestEfficiency = result.scalability.efficiencyScore;
        optimalEntityCount = result.entityCount;
      }
    }

    // Find breaking point
    let breakingPoint: number | undefined;
    for (const result of this.results) {
      if (result.performance.targetCompliance < 70 ||
          result.performance.averageTickTime > this.config.performanceTarget * 2) {
        breakingPoint = result.entityCount;
        break;
      }
    }

    // Analyze scaling characteristics
    const scalingCharacteristics = this.analyzeScalingPattern();
    const performanceCorrelation = this.analyzePerformanceCorrelation();
    const resourceBottlenecks = this.identifyResourceBottlenecks();

    return {
      optimalEntityCount,
      breakingPoint,
      scalingCharacteristics,
      performanceCorrelation,
      resourceBottlenecks
    };
  }

  /**
   * Analyze scaling pattern
   */
  private analyzeScalingPattern(): ScalabilityAnalysis['scalingCharacteristics'] {
    const entityCounts = this.results.map(r => r.entityCount);
    const tickTimes = this.results.map(r => r.performance.averageTickTime);

    // Calculate correlation coefficient for linearity
    const correlation = this.calculateCorrelation(entityCounts, tickTimes);

    let pattern: ScalabilityAnalysis['scalingCharacteristics']['pattern'];
    let efficiency: ScalabilityAnalysis['scalingCharacteristics']['efficiency'];
    let recommendation: string;

    if (correlation > 0.9) {
      pattern = 'linear';
      efficiency = 'excellent';
      recommendation = 'Scaling is highly predictable and efficient. Current architecture handles load well.';
    } else if (correlation > 0.7) {
      pattern = 'linear';
      efficiency = 'good';
      recommendation = 'Generally good scaling with some variation. Monitor for optimization opportunities.';
    } else if (correlation > 0.5) {
      pattern = 'logarithmic';
      efficiency = 'acceptable';
      recommendation = 'Scaling efficiency decreases with load. Consider optimization for higher entity counts.';
    } else {
      // Check for exponential growth
      const growthRates = [];
      for (let i = 1; i < tickTimes.length; i++) {
        growthRates.push(tickTimes[i] / tickTimes[i - 1]);
      }
      const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

      if (avgGrowthRate > 1.5) {
        pattern = 'exponential';
        efficiency = 'poor';
        recommendation = 'Performance degrades rapidly with scale. Significant optimization required.';
      } else {
        pattern = 'irregular';
        efficiency = 'acceptable';
        recommendation = 'Scaling pattern is irregular. Investigate specific bottlenecks at different scales.';
      }
    }

    return { pattern, efficiency, recommendation };
  }

  /**
   * Analyze performance correlation
   */
  private analyzePerformanceCorrelation(): ScalabilityAnalysis['performanceCorrelation'] {
    const entityCounts = this.results.map(r => r.entityCount);
    const tickTimes = this.results.map(r => r.performance.averageTickTime);
    const memoryUsages = this.results.map(r => r.memory.averageUsage);

    const entityCountCorrelation = this.calculateCorrelation(entityCounts, tickTimes);
    const memoryCorrelation = this.calculateCorrelation(entityCounts, memoryUsages);
    const predictive = entityCountCorrelation > 0.7 && memoryCorrelation > 0.7;

    return {
      entityCountCorrelation,
      memoryCorrelation,
      predictive
    };
  }

  /**
   * Identify resource bottlenecks
   */
  private identifyResourceBottlenecks(): ScalabilityAnalysis['resourceBottlenecks'] {
    // Simple heuristic analysis
    const lastResult = this.results[this.results.length - 1];
    const firstResult = this.results[0];

    const memoryGrowthRatio = lastResult.memory.averageUsage / firstResult.memory.averageUsage;
    const entityGrowthRatio = lastResult.entityCount / firstResult.entityCount;
    const performanceGrowthRatio = lastResult.performance.averageTickTime / firstResult.performance.averageTickTime;

    const cpu = performanceGrowthRatio > entityGrowthRatio * 1.5;
    const memory = memoryGrowthRatio > entityGrowthRatio * 1.5;

    // Identify subsystem bottlenecks (simplified analysis)
    const subsystems: string[] = [];
    if (lastResult.performance.averageTickTime > this.config.performanceTarget) {
      // In a real implementation, we'd analyze subsystem-specific metrics
      subsystems.push('PoliticalEntitySubsystem'); // Most likely bottleneck with many entities
    }

    return { cpu, memory, subsystems };
  }

  /**
   * Calculate correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Log scalability result
   */
  private logScalabilityResult(result: ScalabilityTestResult): void {
    console.log(`  Entities: ${result.entityCount}`);
    console.log(`  Avg Tick Time: ${result.performance.averageTickTime.toFixed(2)}ms`);
    console.log(`  Target Compliance: ${result.performance.targetCompliance.toFixed(1)}%`);
    console.log(`  Throughput: ${result.throughput.ticksPerSecond.toFixed(2)} ticks/sec`);
    console.log(`  Memory: ${(result.memory.averageUsage / 1024 / 1024).toFixed(2)}MB avg`);
    console.log(`  Efficiency Score: ${result.scalability.efficiencyScore.toFixed(1)}%`);
  }

  /**
   * Log scalability analysis
   */
  private logScalabilityAnalysis(analysis: ScalabilityAnalysis): void {
    console.log('\n=== Scalability Analysis ===');
    console.log(`Optimal Entity Count: ${analysis.optimalEntityCount}`);
    if (analysis.breakingPoint) {
      console.log(`Breaking Point: ${analysis.breakingPoint} entities`);
    }
    console.log(`Scaling Pattern: ${analysis.scalingCharacteristics.pattern}`);
    console.log(`Efficiency: ${analysis.scalingCharacteristics.efficiency}`);
    console.log(`Recommendation: ${analysis.scalingCharacteristics.recommendation}`);

    console.log('\nPerformance Correlation:');
    console.log(`  Entity Count vs Tick Time: ${analysis.performanceCorrelation.entityCountCorrelation.toFixed(3)}`);
    console.log(`  Entity Count vs Memory: ${analysis.performanceCorrelation.memoryCorrelation.toFixed(3)}`);
    console.log(`  Predictive: ${analysis.performanceCorrelation.predictive}`);

    console.log('\nResource Bottlenecks:');
    console.log(`  CPU: ${analysis.resourceBottlenecks.cpu}`);
    console.log(`  Memory: ${analysis.resourceBottlenecks.memory}`);
    if (analysis.resourceBottlenecks.subsystems.length > 0) {
      console.log(`  Subsystem Bottlenecks: ${analysis.resourceBottlenecks.subsystems.join(', ')}`);
    }
  }

  /**
   * Export scalability results
   */
  public exportResults(): string {
    return JSON.stringify({
      config: this.config,
      results: this.results,
      analysis: this.results.length > 0 ? this.analyzeScalability() : null
    }, null, 2);
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}