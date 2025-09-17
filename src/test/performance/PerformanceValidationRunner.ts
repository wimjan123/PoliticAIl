/**
 * Performance Validation Runner
 *
 * Main orchestrator for T5.2 Performance Validation task.
 * Coordinates all performance tests, validates targets, and generates comprehensive reports.
 */

import { ExtendedPerformanceTest } from './ExtendedPerformanceTest';
import { MemoryValidationTest } from './MemoryValidationTest';
import { ScalabilityTest } from './ScalabilityTest';
import { CombinedLoadTest } from './CombinedLoadTest';
import { PerformanceBenchmark } from './PerformanceBenchmark';

interface ValidationConfig {
  performanceTargets: {
    maxTickTime: number; // 100ms
    averageTickTime: number; // 50ms
    targetCompliance: number; // 90%
  };
  memoryTargets: {
    baseline: number; // 200MB
    peak: number; // 500MB
  };
  scalabilityTargets: {
    minEntityCount: number; // 4
    optimalEntityCount: number; // 8
    maxEntityCount: number; // 10+
  };
  testDurations: {
    extended: number; // 30 minutes
    memory: number; // 10 minutes
    scalability: number; // 2 minutes per test
    combinedLoad: number; // 5 minutes
  };
  regressionThresholds: {
    performance: number; // 20% degradation
    memory: number; // 30% increase
    stability: number; // 10% decrease
  };
}

interface ValidationResult {
  testName: string;
  status: 'pass' | 'warn' | 'fail';
  metrics: {
    [key: string]: {
      value: number;
      target: number;
      status: 'pass' | 'warn' | 'fail';
      unit: string;
    };
  };
  details: any;
  timestamp: Date;
}

interface ValidationReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallStatus: 'pass' | 'warn' | 'fail';
    overallScore: number;
  };
  testResults: ValidationResult[];
  performanceBaselines: any;
  recommendations: string[];
  nextSteps: string[];
  metadata: {
    environment: any;
    duration: number;
    timestamp: Date;
  };
}

export class PerformanceValidationRunner {
  private config: ValidationConfig;
  private results: ValidationResult[] = [];

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      performanceTargets: {
        maxTickTime: 100, // 100ms research target
        averageTickTime: 50, // 50ms average target
        targetCompliance: 90 // 90% of ticks under target
      },
      memoryTargets: {
        baseline: 200 * 1024 * 1024, // 200MB baseline
        peak: 500 * 1024 * 1024 // 500MB peak
      },
      scalabilityTargets: {
        minEntityCount: 4,
        optimalEntityCount: 8,
        maxEntityCount: 10
      },
      testDurations: {
        extended: 30 * 60 * 1000, // 30 minutes
        memory: 10 * 60 * 1000, // 10 minutes
        scalability: 2 * 60 * 1000, // 2 minutes per test
        combinedLoad: 5 * 60 * 1000 // 5 minutes
      },
      regressionThresholds: {
        performance: 20, // 20% degradation
        memory: 30, // 30% increase
        stability: 10 // 10% decrease
      },
      ...config
    };
  }

  /**
   * Run complete T5.2 Performance Validation
   */
  public async runCompleteValidation(): Promise<ValidationReport> {
    console.log('🚀 Starting T5.2 Performance Validation...');
    console.log('📋 Task Requirements:');
    console.log('  • Extended 30-minute performance tests');
    console.log('  • Memory usage validation (<200MB baseline, <500MB peak)');
    console.log('  • Scalability testing (4, 6, 8, 10+ entities)');
    console.log('  • Combined load testing (multiple windows + simulation)');
    console.log('  • Performance baseline documentation');
    console.log('  • Tick performance consistency (<100ms target)');

    const startTime = Date.now();
    this.results = [];

    try {
      // 1. Extended Performance Tests (30-minute sessions)
      console.log('\n📈 Running Extended Performance Tests...');
      await this.runExtendedPerformanceValidation();

      // 2. Memory Usage Validation
      console.log('\n🧠 Running Memory Usage Validation...');
      await this.runMemoryUsageValidation();

      // 3. Scalability Testing
      console.log('\n📊 Running Scalability Tests...');
      await this.runScalabilityValidation();

      // 4. Combined Load Testing
      console.log('\n⚡ Running Combined Load Tests...');
      await this.runCombinedLoadValidation();

      // 5. Performance Benchmarking and Baseline Creation
      console.log('\n📏 Establishing Performance Baselines...');
      const benchmarkResults = await this.runPerformanceBenchmarking();

      // Generate comprehensive validation report
      const report = this.generateValidationReport(benchmarkResults, Date.now() - startTime);

      console.log('\n✅ T5.2 Performance Validation Completed!');
      this.logValidationSummary(report);

      return report;

    } catch (error) {
      console.error('\n❌ Performance Validation Failed:', error);
      throw error;
    }
  }

  /**
   * Run extended performance validation (30-minute sessions)
   */
  private async runExtendedPerformanceValidation(): Promise<void> {
    const extendedTest = new ExtendedPerformanceTest({
      duration: this.config.testDurations.extended,
      entityCounts: [4, 6, 8, 10], // Progressive entity counts
      performanceThreshold: {
        maxTickTime: this.config.performanceTargets.maxTickTime,
        averageTickTime: this.config.performanceTargets.averageTickTime
      },
      memoryThreshold: {
        baseline: this.config.memoryTargets.baseline,
        peak: this.config.memoryTargets.peak
      }
    });

    const results = await extendedTest.runExtendedValidation();

    // Validate results against targets
    const validationResult = this.validateExtendedPerformanceResults(results);
    this.results.push(validationResult);

    console.log(`  ✓ Extended performance tests completed (${results.length} scenarios)`);
  }

  /**
   * Run memory usage validation
   */
  private async runMemoryUsageValidation(): Promise<void> {
    const memoryTest = new MemoryValidationTest({
      baselineThreshold: this.config.memoryTargets.baseline,
      peakThreshold: this.config.memoryTargets.peak,
      testDuration: this.config.testDurations.memory
    });

    const results = await memoryTest.runMemoryValidation();

    // Validate results against targets
    const validationResult = this.validateMemoryResults(results);
    this.results.push(validationResult);

    console.log(`  ✓ Memory validation tests completed (${results.length} scenarios)`);
  }

  /**
   * Run scalability validation
   */
  private async runScalabilityValidation(): Promise<void> {
    const scalabilityTest = new ScalabilityTest({
      entityCounts: [4, 6, 8, 10, 12, 15],
      testDuration: this.config.testDurations.scalability,
      performanceTarget: this.config.performanceTargets.maxTickTime
    });

    const { results, analysis } = await scalabilityTest.runScalabilityTests();

    // Validate results against targets
    const validationResult = this.validateScalabilityResults(results, analysis);
    this.results.push(validationResult);

    console.log(`  ✓ Scalability tests completed (${results.length} entity counts)`);
  }

  /**
   * Run combined load validation
   */
  private async runCombinedLoadValidation(): Promise<void> {
    const combinedLoadTest = new CombinedLoadTest({
      simulationEntityCount: 8,
      simulationDuration: this.config.testDurations.combinedLoad
    });

    const results = await combinedLoadTest.runCombinedLoadTests();

    // Validate results against targets
    const validationResult = this.validateCombinedLoadResults(results);
    this.results.push(validationResult);

    console.log(`  ✓ Combined load tests completed (${results.length} scenarios)`);
  }

  /**
   * Run performance benchmarking and baseline creation
   */
  private async runPerformanceBenchmarking(): Promise<any> {
    const benchmarkTest = new PerformanceBenchmark({
      baselineVersion: '1.0.0'
    });

    const { results, baseline, summary } = await benchmarkTest.runBenchmarkSuite();

    // Validate benchmark results
    const validationResult = this.validateBenchmarkResults(summary);
    this.results.push(validationResult);

    console.log(`  ✓ Performance benchmarking completed (${results.length} benchmarks)`);

    return { results, baseline, summary };
  }

  /**
   * Validate extended performance results
   */
  private validateExtendedPerformanceResults(results: any[]): ValidationResult {
    const metrics: ValidationResult['metrics'] = {};

    if (results.length > 0) {
      // Calculate aggregate metrics
      const avgPerformance = results.reduce((sum, r) => sum + r.performance.averageTickTime, 0) / results.length;
      const avgCompliance = results.reduce((sum, r) => sum + r.performance.targetCompliance, 0) / results.length;
      const avgMemoryPeak = results.reduce((sum, r) => sum + r.memory.peak, 0) / results.length;
      const passedTests = results.filter(r =>
        r.performance.averageTickTime <= this.config.performanceTargets.maxTickTime &&
        r.memory.peak <= this.config.memoryTargets.peak
      ).length;

      metrics.averageTickTime = {
        value: avgPerformance,
        target: this.config.performanceTargets.averageTickTime,
        status: avgPerformance <= this.config.performanceTargets.averageTickTime ? 'pass' :
                avgPerformance <= this.config.performanceTargets.maxTickTime ? 'warn' : 'fail',
        unit: 'ms'
      };

      metrics.targetCompliance = {
        value: avgCompliance,
        target: this.config.performanceTargets.targetCompliance,
        status: avgCompliance >= this.config.performanceTargets.targetCompliance ? 'pass' :
                avgCompliance >= 80 ? 'warn' : 'fail',
        unit: '%'
      };

      metrics.memoryPeak = {
        value: avgMemoryPeak / 1024 / 1024,
        target: this.config.memoryTargets.peak / 1024 / 1024,
        status: avgMemoryPeak <= this.config.memoryTargets.peak ? 'pass' : 'fail',
        unit: 'MB'
      };

      metrics.testPassRate = {
        value: (passedTests / results.length) * 100,
        target: 90,
        status: (passedTests / results.length) >= 0.9 ? 'pass' :
                (passedTests / results.length) >= 0.7 ? 'warn' : 'fail',
        unit: '%'
      };
    }

    const overallStatus = this.determineOverallStatus(metrics);

    return {
      testName: 'Extended Performance Tests',
      status: overallStatus,
      metrics,
      details: results,
      timestamp: new Date()
    };
  }

  /**
   * Validate memory results
   */
  private validateMemoryResults(results: any[]): ValidationResult {
    const metrics: ValidationResult['metrics'] = {};

    if (results.length > 0) {
      const passedTests = results.filter(r => r.validation.overallPass).length;
      const avgBaseline = results.reduce((sum, r) => sum + r.analysis.baseline, 0) / results.length;
      const avgPeak = results.reduce((sum, r) => sum + r.analysis.peak, 0) / results.length;
      const leakTests = results.filter(r => r.analysis.leak.detected).length;

      metrics.memoryPassRate = {
        value: (passedTests / results.length) * 100,
        target: 100,
        status: passedTests === results.length ? 'pass' :
                passedTests >= results.length * 0.8 ? 'warn' : 'fail',
        unit: '%'
      };

      metrics.baselineMemory = {
        value: avgBaseline / 1024 / 1024,
        target: this.config.memoryTargets.baseline / 1024 / 1024,
        status: avgBaseline <= this.config.memoryTargets.baseline ? 'pass' : 'fail',
        unit: 'MB'
      };

      metrics.peakMemory = {
        value: avgPeak / 1024 / 1024,
        target: this.config.memoryTargets.peak / 1024 / 1024,
        status: avgPeak <= this.config.memoryTargets.peak ? 'pass' : 'fail',
        unit: 'MB'
      };

      metrics.memoryLeaks = {
        value: leakTests,
        target: 0,
        status: leakTests === 0 ? 'pass' : leakTests <= 1 ? 'warn' : 'fail',
        unit: 'count'
      };
    }

    const overallStatus = this.determineOverallStatus(metrics);

    return {
      testName: 'Memory Usage Validation',
      status: overallStatus,
      metrics,
      details: results,
      timestamp: new Date()
    };
  }

  /**
   * Validate scalability results
   */
  private validateScalabilityResults(results: any[], analysis: any): ValidationResult {
    const metrics: ValidationResult['metrics'] = {};

    if (results.length > 0 && analysis) {
      const avgLinearityScore = results.reduce((sum, r) => sum + r.scalability.linearityScore, 0) / results.length;
      const avgEfficiencyScore = results.reduce((sum, r) => sum + r.scalability.efficiencyScore, 0) / results.length;

      metrics.optimalEntityCount = {
        value: analysis.optimalEntityCount,
        target: this.config.scalabilityTargets.optimalEntityCount,
        status: analysis.optimalEntityCount >= this.config.scalabilityTargets.minEntityCount ? 'pass' : 'warn',
        unit: 'entities'
      };

      metrics.linearityScore = {
        value: avgLinearityScore,
        target: 80,
        status: avgLinearityScore >= 80 ? 'pass' : avgLinearityScore >= 60 ? 'warn' : 'fail',
        unit: 'score'
      };

      metrics.efficiencyScore = {
        value: avgEfficiencyScore,
        target: 80,
        status: avgEfficiencyScore >= 80 ? 'pass' : avgEfficiencyScore >= 60 ? 'warn' : 'fail',
        unit: 'score'
      };

      if (analysis.breakingPoint) {
        metrics.breakingPoint = {
          value: analysis.breakingPoint,
          target: this.config.scalabilityTargets.maxEntityCount,
          status: analysis.breakingPoint >= this.config.scalabilityTargets.maxEntityCount ? 'pass' : 'warn',
          unit: 'entities'
        };
      }
    }

    const overallStatus = this.determineOverallStatus(metrics);

    return {
      testName: 'Scalability Testing',
      status: overallStatus,
      metrics,
      details: { results, analysis },
      timestamp: new Date()
    };
  }

  /**
   * Validate combined load results
   */
  private validateCombinedLoadResults(results: any[]): ValidationResult {
    const metrics: ValidationResult['metrics'] = {};

    if (results.length > 0) {
      const stableTests = results.filter(r => r.stability.overallStable).length;
      const avgSimulationPerf = results.reduce((sum, r) => sum + r.performance.simulation.averageTickTime, 0) / results.length;
      const avgUIPerf = results.reduce((sum, r) => sum + r.performance.ui.averageResponseTime, 0) / results.length;

      metrics.stabilityRate = {
        value: (stableTests / results.length) * 100,
        target: 100,
        status: stableTests === results.length ? 'pass' :
                stableTests >= results.length * 0.8 ? 'warn' : 'fail',
        unit: '%'
      };

      metrics.simulationPerformance = {
        value: avgSimulationPerf,
        target: this.config.performanceTargets.maxTickTime,
        status: avgSimulationPerf <= this.config.performanceTargets.maxTickTime ? 'pass' :
                avgSimulationPerf <= this.config.performanceTargets.maxTickTime * 1.5 ? 'warn' : 'fail',
        unit: 'ms'
      };

      metrics.uiPerformance = {
        value: avgUIPerf,
        target: 200,
        status: avgUIPerf <= 200 ? 'pass' : avgUIPerf <= 300 ? 'warn' : 'fail',
        unit: 'ms'
      };
    }

    const overallStatus = this.determineOverallStatus(metrics);

    return {
      testName: 'Combined Load Testing',
      status: overallStatus,
      metrics,
      details: results,
      timestamp: new Date()
    };
  }

  /**
   * Validate benchmark results
   */
  private validateBenchmarkResults(summary: any): ValidationResult {
    const metrics: ValidationResult['metrics'] = {};

    if (summary) {
      metrics.overallScore = {
        value: summary.overallScore,
        target: 80,
        status: summary.overallScore >= 80 ? 'pass' :
                summary.overallScore >= 60 ? 'warn' : 'fail',
        unit: 'score'
      };

      metrics.passRate = {
        value: summary.passRate,
        target: 90,
        status: summary.passRate >= 90 ? 'pass' :
                summary.passRate >= 70 ? 'warn' : 'fail',
        unit: '%'
      };

      metrics.criticalIssues = {
        value: summary.criticalIssues.length,
        target: 0,
        status: summary.criticalIssues.length === 0 ? 'pass' :
                summary.criticalIssues.length <= 2 ? 'warn' : 'fail',
        unit: 'count'
      };
    }

    const overallStatus = this.determineOverallStatus(metrics);

    return {
      testName: 'Performance Benchmarking',
      status: overallStatus,
      metrics,
      details: summary,
      timestamp: new Date()
    };
  }

  /**
   * Determine overall status from metrics
   */
  private determineOverallStatus(metrics: ValidationResult['metrics']): 'pass' | 'warn' | 'fail' {
    const statuses = Object.values(metrics).map(m => m.status);

    if (statuses.includes('fail')) return 'fail';
    if (statuses.includes('warn')) return 'warn';
    return 'pass';
  }

  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(benchmarkResults: any, duration: number): ValidationReport {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'pass').length;
    const failedTests = this.results.filter(r => r.status === 'fail').length;

    const overallStatus = failedTests > 0 ? 'fail' :
                         passedTests < totalTests ? 'warn' : 'pass';

    // Calculate overall score
    const scores = this.results.map(r => {
      const metricValues = Object.values(r.metrics);
      const passCount = metricValues.filter(m => m.status === 'pass').length;
      return (passCount / metricValues.length) * 100;
    });
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Generate recommendations
    const recommendations = this.generateRecommendations();
    const nextSteps = this.generateNextSteps();

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallStatus,
        overallScore
      },
      testResults: this.results,
      performanceBaselines: benchmarkResults.baseline,
      recommendations,
      nextSteps,
      metadata: {
        environment: this.detectEnvironment(),
        duration,
        timestamp: new Date()
      }
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.results.filter(r => r.status === 'fail');

    // Performance recommendations
    const performanceIssues = failedTests.filter(r =>
      Object.keys(r.metrics).some(key => key.includes('Time') || key.includes('Performance'))
    );
    if (performanceIssues.length > 0) {
      recommendations.push('Implement performance optimization in simulation tick processing');
      recommendations.push('Consider implementing performance budgeting for subsystems');
      recommendations.push('Optimize critical path algorithms in political entity processing');
    }

    // Memory recommendations
    const memoryIssues = failedTests.filter(r =>
      Object.keys(r.metrics).some(key => key.includes('memory') || key.includes('Memory'))
    );
    if (memoryIssues.length > 0) {
      recommendations.push('Implement memory pooling and object reuse strategies');
      recommendations.push('Optimize garbage collection patterns and timing');
      recommendations.push('Review and optimize data structure choices for memory efficiency');
    }

    // Scalability recommendations
    const scalabilityIssues = failedTests.filter(r => r.testName.includes('Scalability'));
    if (scalabilityIssues.length > 0) {
      recommendations.push('Implement entity processing optimization for higher counts');
      recommendations.push('Consider implementing load balancing across subsystems');
      recommendations.push('Optimize algorithms for O(n) complexity where possible');
    }

    // Stability recommendations
    const stabilityIssues = failedTests.filter(r =>
      Object.keys(r.metrics).some(key => key.includes('stability') || key.includes('Stability'))
    );
    if (stabilityIssues.length > 0) {
      recommendations.push('Improve error handling and graceful degradation mechanisms');
      recommendations.push('Implement resource monitoring and automatic throttling');
      recommendations.push('Enhance system stability through better resource management');
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance targets met - focus on optimization opportunities');
      recommendations.push('Consider implementing advanced performance monitoring');
      recommendations.push('Document current performance characteristics as baselines');
    }

    return recommendations;
  }

  /**
   * Generate next steps for development
   */
  private generateNextSteps(): string[] {
    const nextSteps: string[] = [];
    const failedTests = this.results.filter(r => r.status === 'fail');

    if (failedTests.length > 0) {
      nextSteps.push('Address critical performance issues identified in failed tests');
      nextSteps.push('Implement recommended optimizations in priority order');
      nextSteps.push('Re-run validation tests to verify improvements');
    } else {
      nextSteps.push('Implement continuous performance monitoring in CI/CD pipeline');
      nextSteps.push('Set up performance regression detection alerts');
      nextSteps.push('Plan for performance optimization in next development cycle');
    }

    nextSteps.push('Document performance baselines in project documentation');
    nextSteps.push('Schedule regular performance validation runs');
    nextSteps.push('Consider implementing automated performance testing');

    return nextSteps;
  }

  /**
   * Detect test environment
   */
  private detectEnvironment(): any {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCores: require('os').cpus().length,
      totalMemory: Math.floor(require('os').totalmem() / 1024 / 1024),
      architecture: process.arch,
      timestamp: new Date()
    };
  }

  /**
   * Log validation summary
   */
  private logValidationSummary(report: ValidationReport): void {
    console.log('\n🎯 T5.2 Performance Validation Summary');
    console.log('=' .repeat(50));

    console.log(`📊 Overall Status: ${report.summary.overallStatus.toUpperCase()}`);
    console.log(`📈 Overall Score: ${report.summary.overallScore.toFixed(1)}%`);
    console.log(`✅ Passed Tests: ${report.summary.passedTests}/${report.summary.totalTests}`);

    if (report.summary.failedTests > 0) {
      console.log(`❌ Failed Tests: ${report.summary.failedTests}`);
    }

    console.log('\n📋 Test Results:');
    for (const result of report.testResults) {
      const status = result.status === 'pass' ? '✅' :
                    result.status === 'warn' ? '⚠️' : '❌';
      console.log(`  ${status} ${result.testName}: ${result.status.toUpperCase()}`);
    }

    console.log('\n🎯 Performance Targets Validation:');
    console.log(`  • Simulation Tick Performance: <100ms consistently`);
    console.log(`  • Memory Usage: <200MB baseline, <500MB peak`);
    console.log(`  • UI Responsiveness: <200ms for all interactions`);
    console.log(`  • Scalability: 4-10+ entity support`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    if (report.nextSteps.length > 0) {
      console.log('\n🚀 Next Steps:');
      report.nextSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    }

    console.log(`\n⏱️  Total Duration: ${(report.metadata.duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`🕒 Completed: ${report.metadata.timestamp.toISOString()}`);
  }

  /**
   * Export validation report
   */
  public exportValidationReport(report: ValidationReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get validation results
   */
  public getResults(): ValidationResult[] {
    return [...this.results];
  }
}