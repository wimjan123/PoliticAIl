/**
 * Performance Benchmarking and Baseline System
 *
 * Establishes performance baselines, tracks regression, and provides
 * benchmarking capabilities for future optimization work.
 */

import { ExtendedPerformanceTest } from './ExtendedPerformanceTest';
import { MemoryValidationTest } from './MemoryValidationTest';
import { ScalabilityTest } from './ScalabilityTest';
import { CombinedLoadTest } from './CombinedLoadTest';

interface BenchmarkConfig {
  baselineVersion: string;
  testEnvironment: {
    platform: string;
    nodeVersion: string;
    cpuCores: number;
    totalMemory: number;
    architecture: string;
  };
  benchmarkSuites: BenchmarkSuite[];
  regressionThresholds: {
    performance: number; // % degradation threshold
    memory: number; // % increase threshold
    stability: number; // % decrease threshold
  };
}

interface BenchmarkSuite {
  name: string;
  description: string;
  tests: BenchmarkTest[];
  weight: number; // Importance weight (1-10)
  criticalPath: boolean; // Is this a critical performance path?
}

interface BenchmarkTest {
  name: string;
  type: 'extended' | 'memory' | 'scalability' | 'combined_load' | 'tick_consistency';
  config: any;
  baseline?: BenchmarkResult;
  targetMetrics: {
    [key: string]: {
      target: number;
      threshold: number;
      unit: string;
    };
  };
}

interface BenchmarkResult {
  testName: string;
  version: string;
  timestamp: Date;
  environment: BenchmarkConfig['testEnvironment'];
  metrics: {
    [key: string]: {
      value: number;
      unit: string;
      status: 'pass' | 'warn' | 'fail';
      baseline?: number;
      regression?: number; // % change from baseline
    };
  };
  rawData: any;
  performance: {
    score: number; // 0-100 overall performance score
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    breakdown: {
      [category: string]: number;
    };
  };
}

interface BaselineDocument {
  version: string;
  createdAt: Date;
  environment: BenchmarkConfig['testEnvironment'];
  baselines: {
    [testName: string]: {
      metrics: { [key: string]: number };
      targets: { [key: string]: number };
      description: string;
    };
  };
  metadata: {
    totalTests: number;
    overallScore: number;
    criticalPathMetrics: string[];
    optimizationTargets: string[];
  };
}

export class PerformanceBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private currentBaseline?: BaselineDocument;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = {
      baselineVersion: '1.0.0',
      testEnvironment: this.detectEnvironment(),
      benchmarkSuites: this.getDefaultBenchmarkSuites(),
      regressionThresholds: {
        performance: 20, // 20% performance degradation
        memory: 30, // 30% memory increase
        stability: 10 // 10% stability decrease
      },
      ...config
    };
  }

  /**
   * Run complete benchmark suite and establish baselines
   */
  public async runBenchmarkSuite(): Promise<{
    results: BenchmarkResult[];
    baseline: BaselineDocument;
    summary: any;
  }> {
    console.log('[PerformanceBenchmark] Starting comprehensive benchmark suite...');
    console.log(`Environment: ${this.config.testEnvironment.platform} ${this.config.testEnvironment.architecture}`);
    console.log(`Node: ${this.config.testEnvironment.nodeVersion}, CPU: ${this.config.testEnvironment.cpuCores} cores`);

    this.results = [];

    for (const suite of this.config.benchmarkSuites) {
      console.log(`\n[PerformanceBenchmark] Running benchmark suite: ${suite.name}`);

      for (const test of suite.tests) {
        console.log(`  Running test: ${test.name}`);

        try {
          const result = await this.runBenchmarkTest(test, suite);
          this.results.push(result);
          this.logBenchmarkResult(result);
        } catch (error) {
          console.error(`  Failed to run test ${test.name}:`, error);
        }

        // Brief cooldown between tests
        await this.sleep(5000);
      }
    }

    // Generate baseline document
    const baseline = this.generateBaselineDocument();
    this.currentBaseline = baseline;

    // Generate summary
    const summary = this.generateBenchmarkSummary();

    console.log('\n[PerformanceBenchmark] Benchmark suite completed!');
    this.logBenchmarkSummary(summary);

    return {
      results: this.results,
      baseline,
      summary
    };
  }

  /**
   * Run individual benchmark test
   */
  private async runBenchmarkTest(test: BenchmarkTest, suite: BenchmarkSuite): Promise<BenchmarkResult> {
    const startTime = Date.now();
    let rawData: any;
    let metrics: BenchmarkResult['metrics'] = {};

    switch (test.type) {
      case 'extended':
        rawData = await this.runExtendedPerformanceTest(test.config);
        metrics = this.extractExtendedMetrics(rawData, test);
        break;

      case 'memory':
        rawData = await this.runMemoryValidationTest(test.config);
        metrics = this.extractMemoryMetrics(rawData, test);
        break;

      case 'scalability':
        rawData = await this.runScalabilityTest(test.config);
        metrics = this.extractScalabilityMetrics(rawData, test);
        break;

      case 'combined_load':
        rawData = await this.runCombinedLoadTest(test.config);
        metrics = this.extractCombinedLoadMetrics(rawData, test);
        break;

      case 'tick_consistency':
        rawData = await this.runTickConsistencyTest(test.config);
        metrics = this.extractTickConsistencyMetrics(rawData, test);
        break;

      default:
        throw new Error(`Unknown test type: ${test.type}`);
    }

    // Calculate performance score
    const performance = this.calculatePerformanceScore(metrics, test, suite);

    const duration = Date.now() - startTime;
    console.log(`    Completed in ${(duration / 1000).toFixed(2)}s`);

    return {
      testName: test.name,
      version: this.config.baselineVersion,
      timestamp: new Date(),
      environment: this.config.testEnvironment,
      metrics,
      rawData,
      performance
    };
  }

  /**
   * Run extended performance test
   */
  private async runExtendedPerformanceTest(config: any): Promise<any> {
    const extendedTest = new ExtendedPerformanceTest(config);
    return await extendedTest.runExtendedValidation();
  }

  /**
   * Run memory validation test
   */
  private async runMemoryValidationTest(config: any): Promise<any> {
    const memoryTest = new MemoryValidationTest(config);
    return await memoryTest.runMemoryValidation();
  }

  /**
   * Run scalability test
   */
  private async runScalabilityTest(config: any): Promise<any> {
    const scalabilityTest = new ScalabilityTest(config);
    const result = await scalabilityTest.runScalabilityTests();
    return result;
  }

  /**
   * Run combined load test
   */
  private async runCombinedLoadTest(config: any): Promise<any> {
    const combinedTest = new CombinedLoadTest(config);
    return await combinedTest.runCombinedLoadTests();
  }

  /**
   * Run tick consistency test
   */
  private async runTickConsistencyTest(config: any): Promise<any> {
    // Simplified tick consistency test
    const { PrototypeSimulation } = await import('../../simulation/PrototypeSimulation');

    const simulation = new PrototypeSimulation({
      initialEntities: {
        politicians: this.generateTestPoliticians(config.entityCount || 6),
        blocs: [],
        policies: []
      },
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: false
    });

    await simulation.initialize();
    simulation.start();

    const tickTimes: number[] = [];
    const targetTicks = config.measurementTicks || 100;
    let tickCount = 0;

    while (tickCount < targetTicks) {
      const currentTick = simulation.getStatus().currentTick;
      if (currentTick > tickCount) {
        const perfSummary = simulation.getPerformanceSummary();
        if (perfSummary && perfSummary.tickTimes && perfSummary.tickTimes.length > 0) {
          tickTimes.push(perfSummary.tickTimes[perfSummary.tickTimes.length - 1]);
        }
        tickCount = currentTick;
      }
      await this.sleep(10);
    }

    simulation.stop();
    simulation.cleanup();

    return { tickTimes, targetTicks, entityCount: config.entityCount || 6 };
  }

  /**
   * Extract metrics from extended performance test
   */
  private extractExtendedMetrics(rawData: any[], test: BenchmarkTest): BenchmarkResult['metrics'] {
    const metrics: BenchmarkResult['metrics'] = {};

    if (rawData.length > 0) {
      const avgPerformance = rawData.reduce((sum, r) => sum + r.performance.averageTickTime, 0) / rawData.length;
      const avgCompliance = rawData.reduce((sum, r) => sum + r.performance.targetCompliance, 0) / rawData.length;
      const avgMemoryPeak = rawData.reduce((sum, r) => sum + r.memory.peak, 0) / rawData.length;

      metrics.averageTickTime = this.createMetric(avgPerformance, 'ms', test.targetMetrics.averageTickTime);
      metrics.targetCompliance = this.createMetric(avgCompliance, '%', test.targetMetrics.targetCompliance);
      metrics.memoryPeak = this.createMetric(avgMemoryPeak / 1024 / 1024, 'MB', test.targetMetrics.memoryPeak);
    }

    return metrics;
  }

  /**
   * Extract metrics from memory validation test
   */
  private extractMemoryMetrics(rawData: any[], test: BenchmarkTest): BenchmarkResult['metrics'] {
    const metrics: BenchmarkResult['metrics'] = {};

    if (rawData.length > 0) {
      const passedTests = rawData.filter(r => r.validation.overallPass).length;
      const passRate = (passedTests / rawData.length) * 100;

      const avgBaseline = rawData.reduce((sum, r) => sum + r.analysis.baseline, 0) / rawData.length;
      const avgPeak = rawData.reduce((sum, r) => sum + r.analysis.peak, 0) / rawData.length;
      const leakTests = rawData.filter(r => r.analysis.leak.detected).length;

      metrics.memoryPassRate = this.createMetric(passRate, '%', test.targetMetrics.memoryPassRate);
      metrics.baselineMemory = this.createMetric(avgBaseline / 1024 / 1024, 'MB', test.targetMetrics.baselineMemory);
      metrics.peakMemory = this.createMetric(avgPeak / 1024 / 1024, 'MB', test.targetMetrics.peakMemory);
      metrics.memoryLeaks = this.createMetric(leakTests, 'count', test.targetMetrics.memoryLeaks);
    }

    return metrics;
  }

  /**
   * Extract metrics from scalability test
   */
  private extractScalabilityMetrics(rawData: any, test: BenchmarkTest): BenchmarkResult['metrics'] {
    const metrics: BenchmarkResult['metrics'] = {};

    if (rawData.results && rawData.analysis) {
      const optimalEntityCount = rawData.analysis.optimalEntityCount;
      const avgLinearityScore = rawData.results.reduce((sum: number, r: any) => sum + r.scalability.linearityScore, 0) / rawData.results.length;
      const avgEfficiencyScore = rawData.results.reduce((sum: number, r: any) => sum + r.scalability.efficiencyScore, 0) / rawData.results.length;

      metrics.optimalEntityCount = this.createMetric(optimalEntityCount, 'entities', test.targetMetrics.optimalEntityCount);
      metrics.linearityScore = this.createMetric(avgLinearityScore, 'score', test.targetMetrics.linearityScore);
      metrics.efficiencyScore = this.createMetric(avgEfficiencyScore, 'score', test.targetMetrics.efficiencyScore);

      if (rawData.analysis.breakingPoint) {
        metrics.breakingPoint = this.createMetric(rawData.analysis.breakingPoint, 'entities', test.targetMetrics.breakingPoint);
      }
    }

    return metrics;
  }

  /**
   * Extract metrics from combined load test
   */
  private extractCombinedLoadMetrics(rawData: any[], test: BenchmarkTest): BenchmarkResult['metrics'] {
    const metrics: BenchmarkResult['metrics'] = {};

    if (rawData.length > 0) {
      const stableTests = rawData.filter(r => r.stability.overallStable).length;
      const stabilityRate = (stableTests / rawData.length) * 100;

      const avgSimulationPerf = rawData.reduce((sum, r) => sum + r.performance.simulation.averageTickTime, 0) / rawData.length;
      const avgUIPerf = rawData.reduce((sum, r) => sum + r.performance.ui.averageResponseTime, 0) / rawData.length;

      metrics.stabilityRate = this.createMetric(stabilityRate, '%', test.targetMetrics.stabilityRate);
      metrics.simulationPerformance = this.createMetric(avgSimulationPerf, 'ms', test.targetMetrics.simulationPerformance);
      metrics.uiPerformance = this.createMetric(avgUIPerf, 'ms', test.targetMetrics.uiPerformance);
    }

    return metrics;
  }

  /**
   * Extract metrics from tick consistency test
   */
  private extractTickConsistencyMetrics(rawData: any, test: BenchmarkTest): BenchmarkResult['metrics'] {
    const metrics: BenchmarkResult['metrics'] = {};

    if (rawData.tickTimes && rawData.tickTimes.length > 0) {
      const tickTimes = rawData.tickTimes;
      const avgTickTime = tickTimes.reduce((a: number, b: number) => a + b, 0) / tickTimes.length;
      const maxTickTime = Math.max(...tickTimes);
      const consistentTicks = tickTimes.filter((t: number) => t <= 100).length;
      const consistency = (consistentTicks / tickTimes.length) * 100;

      // Calculate variance
      const variance = tickTimes.reduce((acc: number, time: number) => acc + Math.pow(time - avgTickTime, 2), 0) / tickTimes.length;
      const standardDeviation = Math.sqrt(variance);

      metrics.averageTickTime = this.createMetric(avgTickTime, 'ms', test.targetMetrics.averageTickTime);
      metrics.maxTickTime = this.createMetric(maxTickTime, 'ms', test.targetMetrics.maxTickTime);
      metrics.consistency = this.createMetric(consistency, '%', test.targetMetrics.consistency);
      metrics.variance = this.createMetric(standardDeviation, 'ms', test.targetMetrics.variance);
    }

    return metrics;
  }

  /**
   * Create metric object with status evaluation
   */
  private createMetric(value: number, unit: string, target?: { target: number; threshold: number; unit: string }): BenchmarkResult['metrics'][string] {
    let status: 'pass' | 'warn' | 'fail' = 'pass';

    if (target) {
      if (unit === '%' || unit === 'score') {
        // Higher is better for percentages and scores
        if (value < target.threshold) status = 'fail';
        else if (value < target.target) status = 'warn';
      } else {
        // Lower is better for times, memory, etc.
        if (value > target.threshold) status = 'fail';
        else if (value > target.target) status = 'warn';
      }
    }

    return {
      value,
      unit,
      status
    };
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: BenchmarkResult['metrics'], test: BenchmarkTest, suite: BenchmarkSuite): BenchmarkResult['performance'] {
    const breakdown: { [category: string]: number } = {};
    let totalScore = 0;
    let totalWeight = 0;

    // Calculate score for each metric
    for (const [metricName, metric] of Object.entries(metrics)) {
      let metricScore = 100;

      if (metric.status === 'warn') metricScore = 70;
      else if (metric.status === 'fail') metricScore = 30;

      breakdown[metricName] = metricScore;
      totalScore += metricScore;
      totalWeight++;
    }

    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // Apply suite weight
    const weightedScore = averageScore * (suite.weight / 10);

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (weightedScore >= 90) grade = 'A';
    else if (weightedScore >= 80) grade = 'B';
    else if (weightedScore >= 70) grade = 'C';
    else if (weightedScore >= 60) grade = 'D';
    else grade = 'F';

    return {
      score: weightedScore,
      grade,
      breakdown
    };
  }

  /**
   * Generate baseline document
   */
  private generateBaselineDocument(): BaselineDocument {
    const baselines: BaselineDocument['baselines'] = {};
    let totalScore = 0;
    const criticalPathMetrics: string[] = [];
    const optimizationTargets: string[] = [];

    for (const result of this.results) {
      baselines[result.testName] = {
        metrics: {},
        targets: {},
        description: `Baseline for ${result.testName}`
      };

      for (const [metricName, metric] of Object.entries(result.metrics)) {
        baselines[result.testName].metrics[metricName] = metric.value;

        if (metric.status === 'fail') {
          optimizationTargets.push(`${result.testName}.${metricName}`);
        }

        // Identify critical path metrics (performance-related)
        if (metricName.includes('Time') || metricName.includes('Performance') || metricName.includes('Consistency')) {
          criticalPathMetrics.push(`${result.testName}.${metricName}`);
        }
      }

      totalScore += result.performance.score;
    }

    const overallScore = this.results.length > 0 ? totalScore / this.results.length : 0;

    return {
      version: this.config.baselineVersion,
      createdAt: new Date(),
      environment: this.config.testEnvironment,
      baselines,
      metadata: {
        totalTests: this.results.length,
        overallScore,
        criticalPathMetrics: [...new Set(criticalPathMetrics)],
        optimizationTargets: [...new Set(optimizationTargets)]
      }
    };
  }

  /**
   * Generate benchmark summary
   */
  private generateBenchmarkSummary(): any {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.performance.grade === 'A' || r.performance.grade === 'B').length;
    const overallScore = this.results.reduce((sum, r) => sum + r.performance.score, 0) / totalTests;

    const performanceBreakdown = {
      A: this.results.filter(r => r.performance.grade === 'A').length,
      B: this.results.filter(r => r.performance.grade === 'B').length,
      C: this.results.filter(r => r.performance.grade === 'C').length,
      D: this.results.filter(r => r.performance.grade === 'D').length,
      F: this.results.filter(r => r.performance.grade === 'F').length
    };

    const criticalIssues = this.results.filter(r => r.performance.grade === 'F').map(r => r.testName);
    const recommendations = this.generateRecommendations();

    return {
      totalTests,
      passedTests,
      passRate: (passedTests / totalTests) * 100,
      overallScore,
      performanceBreakdown,
      criticalIssues,
      recommendations,
      environment: this.config.testEnvironment,
      timestamp: new Date()
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedMetrics: string[] = [];

    for (const result of this.results) {
      for (const [metricName, metric] of Object.entries(result.metrics)) {
        if (metric.status === 'fail') {
          failedMetrics.push(`${result.testName}.${metricName}`);
        }
      }
    }

    // Generate specific recommendations based on failed metrics
    if (failedMetrics.some(m => m.includes('averageTickTime'))) {
      recommendations.push('Optimize simulation tick processing and implement performance budgeting');
    }

    if (failedMetrics.some(m => m.includes('memory'))) {
      recommendations.push('Implement memory optimization strategies and garbage collection tuning');
    }

    if (failedMetrics.some(m => m.includes('stability'))) {
      recommendations.push('Improve system stability through better error handling and resource management');
    }

    if (failedMetrics.some(m => m.includes('scalability'))) {
      recommendations.push('Enhance scalability through algorithmic optimization and resource pooling');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance targets met. Focus on optimization opportunities for future scaling.');
    }

    return recommendations;
  }

  /**
   * Detect test environment
   */
  private detectEnvironment(): BenchmarkConfig['testEnvironment'] {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCores: require('os').cpus().length,
      totalMemory: Math.floor(require('os').totalmem() / 1024 / 1024), // MB
      architecture: process.arch
    };
  }

  /**
   * Get default benchmark suites
   */
  private getDefaultBenchmarkSuites(): BenchmarkSuite[] {
    return [
      {
        name: 'Core Performance',
        description: 'Essential performance benchmarks for simulation engine',
        weight: 10,
        criticalPath: true,
        tests: [
          {
            name: 'Tick Consistency',
            type: 'tick_consistency',
            config: { entityCount: 6, measurementTicks: 100 },
            targetMetrics: {
              averageTickTime: { target: 50, threshold: 100, unit: 'ms' },
              maxTickTime: { target: 100, threshold: 200, unit: 'ms' },
              consistency: { target: 95, threshold: 80, unit: '%' },
              variance: { target: 10, threshold: 25, unit: 'ms' }
            }
          },
          {
            name: 'Extended Performance',
            type: 'extended',
            config: { duration: 5 * 60 * 1000, entityCounts: [4, 8] },
            targetMetrics: {
              averageTickTime: { target: 50, threshold: 100, unit: 'ms' },
              targetCompliance: { target: 95, threshold: 80, unit: '%' },
              memoryPeak: { target: 400, threshold: 500, unit: 'MB' }
            }
          }
        ]
      },
      {
        name: 'Memory Management',
        description: 'Memory usage and leak detection benchmarks',
        weight: 8,
        criticalPath: true,
        tests: [
          {
            name: 'Memory Validation',
            type: 'memory',
            config: { testDuration: 3 * 60 * 1000 },
            targetMetrics: {
              memoryPassRate: { target: 100, threshold: 80, unit: '%' },
              baselineMemory: { target: 150, threshold: 200, unit: 'MB' },
              peakMemory: { target: 400, threshold: 500, unit: 'MB' },
              memoryLeaks: { target: 0, threshold: 1, unit: 'count' }
            }
          }
        ]
      },
      {
        name: 'Scalability',
        description: 'Performance scaling characteristics with entity count',
        weight: 7,
        criticalPath: false,
        tests: [
          {
            name: 'Entity Scalability',
            type: 'scalability',
            config: { entityCounts: [4, 8, 12], testDuration: 2 * 60 * 1000 },
            targetMetrics: {
              optimalEntityCount: { target: 8, threshold: 4, unit: 'entities' },
              linearityScore: { target: 80, threshold: 60, unit: 'score' },
              efficiencyScore: { target: 80, threshold: 60, unit: 'score' },
              breakingPoint: { target: 20, threshold: 10, unit: 'entities' }
            }
          }
        ]
      },
      {
        name: 'System Integration',
        description: 'Combined load and system integration benchmarks',
        weight: 6,
        criticalPath: false,
        tests: [
          {
            name: 'Combined Load',
            type: 'combined_load',
            config: { simulationDuration: 3 * 60 * 1000, simulationEntityCount: 6 },
            targetMetrics: {
              stabilityRate: { target: 100, threshold: 80, unit: '%' },
              simulationPerformance: { target: 80, threshold: 120, unit: 'ms' },
              uiPerformance: { target: 150, threshold: 200, unit: 'ms' }
            }
          }
        ]
      }
    ];
  }

  /**
   * Generate test politicians for tick consistency test
   */
  private generateTestPoliticians(count: number): any[] {
    const politicians = [];
    for (let i = 0; i < count; i++) {
      politicians.push({
        id: `politician-bench-${i}`,
        name: `Benchmark Politician ${i}`,
        ideology: {
          economic: (i % 11 - 5) * 20,
          social: ((i * 3) % 11 - 5) * 20
        },
        resources: {
          political_capital: 50 + (i % 50),
          funding: 500000 + (i % 10) * 100000
        },
        reputation: 50 + (i % 50),
        experience: 5 + (i % 20),
        network: [],
        traits: [`trait_${i % 5}`],
        current_position: i % 3 === 0 ? 'government' : 'opposition'
      });
    }
    return politicians;
  }

  /**
   * Log benchmark result
   */
  private logBenchmarkResult(result: BenchmarkResult): void {
    console.log(`    Grade: ${result.performance.grade} (Score: ${result.performance.score.toFixed(1)})`);

    const failedMetrics = Object.entries(result.metrics).filter(([_, metric]) => metric.status === 'fail');
    if (failedMetrics.length > 0) {
      console.log(`    Failed metrics: ${failedMetrics.map(([name, _]) => name).join(', ')}`);
    }
  }

  /**
   * Log benchmark summary
   */
  private logBenchmarkSummary(summary: any): void {
    console.log('\n=== Benchmark Summary ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Pass Rate: ${summary.passRate.toFixed(1)}%`);
    console.log(`Overall Score: ${summary.overallScore.toFixed(1)}`);

    console.log('\nGrade Distribution:');
    Object.entries(summary.performanceBreakdown).forEach(([grade, count]) => {
      console.log(`  ${grade}: ${count}`);
    });

    if (summary.criticalIssues.length > 0) {
      console.log(`\nCritical Issues: ${summary.criticalIssues.join(', ')}`);
    }

    console.log('\nRecommendations:');
    summary.recommendations.forEach((rec: string, i: number) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  /**
   * Export benchmark results
   */
  public exportBenchmarkData(): string {
    return JSON.stringify({
      config: this.config,
      results: this.results,
      baseline: this.currentBaseline,
      summary: this.generateBenchmarkSummary()
    }, null, 2);
  }

  /**
   * Load baseline for comparison
   */
  public loadBaseline(baseline: BaselineDocument): void {
    this.currentBaseline = baseline;

    // Update results with regression data
    for (const result of this.results) {
      if (baseline.baselines[result.testName]) {
        const baselineMetrics = baseline.baselines[result.testName].metrics;

        for (const [metricName, metric] of Object.entries(result.metrics)) {
          if (baselineMetrics[metricName] !== undefined) {
            metric.baseline = baselineMetrics[metricName];
            metric.regression = ((metric.value - baselineMetrics[metricName]) / baselineMetrics[metricName]) * 100;
          }
        }
      }
    }
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}