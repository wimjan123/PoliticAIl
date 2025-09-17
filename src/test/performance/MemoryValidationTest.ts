/**
 * Memory Usage Validation Test
 *
 * Specialized testing for memory usage patterns, leak detection,
 * and validation against baseline and peak thresholds.
 */

import { PrototypeSimulation } from '../../simulation/PrototypeSimulation';
import { Politician, Bloc, Policy } from '../../types/entities';

interface MemoryTestConfig {
  baselineThreshold: number; // 200MB
  peakThreshold: number; // 500MB
  testDuration: number; // Test duration in ms
  samplingInterval: number; // Memory sampling interval
  gcInterval: number; // Force garbage collection interval
  entityGrowthRate: number; // Rate at which entities are added
}

interface MemoryTestResult {
  testName: string;
  duration: number;
  samples: MemorySample[];
  analysis: MemoryAnalysis;
  validation: MemoryValidation;
  timestamp: Date;
}

interface MemorySample {
  timestamp: number;
  tickNumber: number;
  entityCount: number;
  memory: NodeJS.MemoryUsage;
  gcForced?: boolean;
}

interface MemoryAnalysis {
  baseline: number;
  peak: number;
  average: number;
  growth: {
    linearGrowth: number; // MB/minute
    exponentialGrowth: boolean;
    stabilizationPoint?: number; // Tick where memory stabilizes
  };
  leak: {
    detected: boolean;
    severity: 'none' | 'minor' | 'major' | 'critical';
    growthRate?: number; // MB/minute
  };
  pressure: {
    timeAboveBaseline: number; // Percentage of time above baseline
    timeAbovePeak: number; // Percentage of time above peak
    sustainedPressure: boolean; // Extended periods of high usage
  };
}

interface MemoryValidation {
  baselineCompliance: boolean;
  peakCompliance: boolean;
  noMemoryLeaks: boolean;
  stableOperation: boolean;
  overallPass: boolean;
  issues: string[];
  recommendations: string[];
}

export class MemoryValidationTest {
  private config: MemoryTestConfig;
  private simulation?: PrototypeSimulation;
  private samples: MemorySample[] = [];
  private currentEntityCount = 0;

  constructor(config?: Partial<MemoryTestConfig>) {
    this.config = {
      baselineThreshold: 200 * 1024 * 1024, // 200MB
      peakThreshold: 500 * 1024 * 1024, // 500MB
      testDuration: 10 * 60 * 1000, // 10 minutes for memory tests
      samplingInterval: 2000, // Sample every 2 seconds
      gcInterval: 30000, // Force GC every 30 seconds
      entityGrowthRate: 0.1, // Add 10% more entities periodically
      ...config
    };
  }

  /**
   * Run comprehensive memory validation
   */
  public async runMemoryValidation(): Promise<MemoryTestResult[]> {
    console.log('[MemoryValidationTest] Starting memory validation tests...');

    const results: MemoryTestResult[] = [];

    // Test 1: Static entity count memory stability
    results.push(await this.runStaticMemoryTest());

    // Test 2: Dynamic entity growth memory management
    results.push(await this.runDynamicMemoryTest());

    // Test 3: Memory stress test
    results.push(await this.runMemoryStressTest());

    // Test 4: Memory leak detection
    results.push(await this.runMemoryLeakTest());

    console.log('[MemoryValidationTest] Memory validation completed!');
    return results;
  }

  /**
   * Test memory usage with static entity count
   */
  private async runStaticMemoryTest(): Promise<MemoryTestResult> {
    console.log('[MemoryValidationTest] Running static memory test...');

    this.samples = [];
    this.currentEntityCount = 8; // Fixed entity count

    this.simulation = this.createSimulation(this.currentEntityCount);
    await this.simulation.initialize();

    const startTime = Date.now();
    let lastGC = startTime;

    // Start memory sampling
    const samplingInterval = setInterval(() => {
      const now = Date.now();
      const tickNumber = this.simulation?.getStatus().currentTick || 0;

      // Force GC periodically
      let gcForced = false;
      if (now - lastGC >= this.config.gcInterval) {
        if (global.gc) {
          global.gc();
          gcForced = true;
          lastGC = now;
        }
      }

      this.samples.push({
        timestamp: now - startTime,
        tickNumber,
        entityCount: this.currentEntityCount,
        memory: process.memoryUsage(),
        gcForced
      });
    }, this.config.samplingInterval);

    // Start simulation
    this.simulation.start();

    // Wait for test duration
    await this.sleep(this.config.testDuration);

    // Cleanup
    this.simulation.stop();
    clearInterval(samplingInterval);

    const analysis = this.analyzeMemoryUsage(this.samples);
    const validation = this.validateMemoryUsage(analysis);

    this.simulation.cleanup();

    return {
      testName: 'Static Memory Test',
      duration: this.config.testDuration,
      samples: [...this.samples],
      analysis,
      validation,
      timestamp: new Date()
    };
  }

  /**
   * Test memory usage with dynamic entity growth
   */
  private async runDynamicMemoryTest(): Promise<MemoryTestResult> {
    console.log('[MemoryValidationTest] Running dynamic memory test...');

    this.samples = [];
    this.currentEntityCount = 4; // Start with fewer entities

    this.simulation = this.createSimulation(this.currentEntityCount);
    await this.simulation.initialize();

    const startTime = Date.now();
    let lastGC = startTime;
    let lastEntityGrowth = startTime;

    // Start memory sampling
    const samplingInterval = setInterval(() => {
      const now = Date.now();
      const tickNumber = this.simulation?.getStatus().currentTick || 0;

      // Force GC periodically
      let gcForced = false;
      if (now - lastGC >= this.config.gcInterval) {
        if (global.gc) {
          global.gc();
          gcForced = true;
          lastGC = now;
        }
      }

      // Add entities periodically
      if (now - lastEntityGrowth >= 60000 && this.currentEntityCount < 16) { // Every minute, max 16 entities
        const additionalEntities = Math.max(1, Math.floor(this.currentEntityCount * this.config.entityGrowthRate));
        this.addEntities(additionalEntities);
        this.currentEntityCount += additionalEntities;
        lastEntityGrowth = now;
        console.log(`[MemoryValidationTest] Added ${additionalEntities} entities. Total: ${this.currentEntityCount}`);
      }

      this.samples.push({
        timestamp: now - startTime,
        tickNumber,
        entityCount: this.currentEntityCount,
        memory: process.memoryUsage(),
        gcForced
      });
    }, this.config.samplingInterval);

    // Start simulation
    this.simulation.start();

    // Wait for test duration
    await this.sleep(this.config.testDuration);

    // Cleanup
    this.simulation.stop();
    clearInterval(samplingInterval);

    const analysis = this.analyzeMemoryUsage(this.samples);
    const validation = this.validateMemoryUsage(analysis);

    this.simulation.cleanup();

    return {
      testName: 'Dynamic Memory Test',
      duration: this.config.testDuration,
      samples: [...this.samples],
      analysis,
      validation,
      timestamp: new Date()
    };
  }

  /**
   * Test memory usage under stress conditions
   */
  private async runMemoryStressTest(): Promise<MemoryTestResult> {
    console.log('[MemoryValidationTest] Running memory stress test...');

    this.samples = [];
    this.currentEntityCount = 20; // High entity count

    this.simulation = this.createSimulation(this.currentEntityCount);
    await this.simulation.initialize();

    const startTime = Date.now();
    let lastGC = startTime;

    // Start memory sampling with higher frequency
    const samplingInterval = setInterval(() => {
      const now = Date.now();
      const tickNumber = this.simulation?.getStatus().currentTick || 0;

      // Force GC less frequently in stress test
      let gcForced = false;
      if (now - lastGC >= this.config.gcInterval * 2) {
        if (global.gc) {
          global.gc();
          gcForced = true;
          lastGC = now;
        }
      }

      this.samples.push({
        timestamp: now - startTime,
        tickNumber,
        entityCount: this.currentEntityCount,
        memory: process.memoryUsage(),
        gcForced
      });
    }, this.config.samplingInterval / 2); // Sample more frequently

    // Start simulation
    this.simulation.start();

    // Wait for stress test duration (shorter than normal)
    await this.sleep(this.config.testDuration / 2);

    // Cleanup
    this.simulation.stop();
    clearInterval(samplingInterval);

    const analysis = this.analyzeMemoryUsage(this.samples);
    const validation = this.validateMemoryUsage(analysis);

    this.simulation.cleanup();

    return {
      testName: 'Memory Stress Test',
      duration: this.config.testDuration / 2,
      samples: [...this.samples],
      analysis,
      validation,
      timestamp: new Date()
    };
  }

  /**
   * Test for memory leaks over extended period
   */
  private async runMemoryLeakTest(): Promise<MemoryTestResult> {
    console.log('[MemoryValidationTest] Running memory leak detection test...');

    this.samples = [];
    this.currentEntityCount = 6; // Moderate entity count

    this.simulation = this.createSimulation(this.currentEntityCount);
    await this.simulation.initialize();

    const startTime = Date.now();

    // Start memory sampling without forced GC to detect leaks
    const samplingInterval = setInterval(() => {
      const now = Date.now();
      const tickNumber = this.simulation?.getStatus().currentTick || 0;

      this.samples.push({
        timestamp: now - startTime,
        tickNumber,
        entityCount: this.currentEntityCount,
        memory: process.memoryUsage()
      });
    }, this.config.samplingInterval);

    // Start simulation
    this.simulation.start();

    // Wait for extended duration to detect leaks
    await this.sleep(this.config.testDuration * 1.5);

    // Cleanup
    this.simulation.stop();
    clearInterval(samplingInterval);

    const analysis = this.analyzeMemoryUsage(this.samples);
    const validation = this.validateMemoryUsage(analysis);

    this.simulation.cleanup();

    return {
      testName: 'Memory Leak Detection Test',
      duration: this.config.testDuration * 1.5,
      samples: [...this.samples],
      analysis,
      validation,
      timestamp: new Date()
    };
  }

  /**
   * Create simulation instance
   */
  private createSimulation(entityCount: number): PrototypeSimulation {
    const entities = this.generateTestEntities(entityCount);

    return new PrototypeSimulation({
      initialEntities: entities,
      autoStart: false,
      enableMonitoring: true,
      enableDegradation: true,
      performance: {
        maxTickTime: 100,
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
   * Add entities to running simulation
   */
  private addEntities(count: number): void {
    if (!this.simulation) return;

    const newEntities = this.generateTestEntities(count);
    this.simulation.addEntities(newEntities);
  }

  /**
   * Generate test entities
   */
  private generateTestEntities(count: number): {
    politicians: Politician[];
    blocs: Bloc[];
    policies: Policy[];
  } {
    const politicians: Politician[] = [];
    const blocs: Bloc[] = [];
    const policies: Policy[] = [];

    const politicianCount = Math.max(1, Math.floor(count * 0.6));
    const blocCount = Math.max(1, Math.floor(count * 0.25));
    const policyCount = Math.max(1, count - politicianCount - blocCount);

    // Generate politicians
    for (let i = 0; i < politicianCount; i++) {
      politicians.push({
        id: `politician-mem-${Date.now()}-${i}`,
        name: `Memory Test Politician ${i}`,
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

    // Generate blocs
    for (let i = 0; i < blocCount; i++) {
      blocs.push({
        id: `bloc-mem-${Date.now()}-${i}`,
        name: `Memory Test Bloc ${i}`,
        ideology: {
          economic: Math.random() * 200 - 100,
          social: Math.random() * 200 - 100
        },
        members: politicians.slice(0, Math.min(2, politicians.length)),
        resources: {
          political_capital: Math.random() * 500,
          funding: Math.random() * 5000000
        },
        influence: Math.random() * 100,
        cohesion: Math.random() * 100
      });
    }

    // Generate policies
    for (let i = 0; i < policyCount; i++) {
      policies.push({
        id: `policy-mem-${Date.now()}-${i}`,
        name: `Memory Test Policy ${i}`,
        description: `Memory test policy description ${i}`,
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
  private analyzeMemoryUsage(samples: MemorySample[]): MemoryAnalysis {
    if (samples.length === 0) {
      return this.getEmptyAnalysis();
    }

    const heapValues = samples.map(s => s.memory.heapUsed);
    const baseline = Math.min(...heapValues);
    const peak = Math.max(...heapValues);
    const average = heapValues.reduce((a, b) => a + b, 0) / heapValues.length;

    // Analyze growth patterns
    const growth = this.analyzeMemoryGrowth(samples);
    const leak = this.detectMemoryLeak(samples);
    const pressure = this.analyzeMemoryPressure(samples);

    return {
      baseline,
      peak,
      average,
      growth,
      leak,
      pressure
    };
  }

  /**
   * Analyze memory growth patterns
   */
  private analyzeMemoryGrowth(samples: MemorySample[]): MemoryAnalysis['growth'] {
    if (samples.length < 10) {
      return { linearGrowth: 0, exponentialGrowth: false };
    }

    const timeSpan = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 60000; // minutes
    const memoryChange = (samples[samples.length - 1].memory.heapUsed - samples[0].memory.heapUsed) / 1024 / 1024; // MB
    const linearGrowth = memoryChange / timeSpan;

    // Check for exponential growth by comparing growth rates across time segments
    const firstQuarter = samples.slice(0, Math.floor(samples.length / 4));
    const lastQuarter = samples.slice(Math.floor(samples.length * 3 / 4));

    const firstAvg = firstQuarter.reduce((sum, s) => sum + s.memory.heapUsed, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, s) => sum + s.memory.heapUsed, 0) / lastQuarter.length;

    const exponentialGrowth = lastAvg > firstAvg * 2; // More than 100% growth

    return {
      linearGrowth,
      exponentialGrowth
    };
  }

  /**
   * Detect memory leaks
   */
  private detectMemoryLeak(samples: MemorySample[]): MemoryAnalysis['leak'] {
    if (samples.length < 20) {
      return { detected: false, severity: 'none' };
    }

    // Compare memory usage over time segments
    const segmentSize = Math.floor(samples.length / 4);
    const segments = [];

    for (let i = 0; i < 4; i++) {
      const start = i * segmentSize;
      const end = i === 3 ? samples.length : (i + 1) * segmentSize;
      const segment = samples.slice(start, end);
      const avgMemory = segment.reduce((sum, s) => sum + s.memory.heapUsed, 0) / segment.length;
      segments.push(avgMemory);
    }

    // Check for consistent growth across segments
    let growthCount = 0;
    for (let i = 1; i < segments.length; i++) {
      if (segments[i] > segments[i - 1]) {
        growthCount++;
      }
    }

    const detected = growthCount >= 3; // Growth in at least 3 of 4 segments
    let severity: MemoryAnalysis['leak']['severity'] = 'none';
    let growthRate: number | undefined;

    if (detected) {
      const totalGrowth = segments[3] - segments[0];
      const timeSpan = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 60000;
      growthRate = (totalGrowth / 1024 / 1024) / timeSpan; // MB/minute

      if (growthRate > 50) severity = 'critical';
      else if (growthRate > 20) severity = 'major';
      else if (growthRate > 5) severity = 'minor';
    }

    return {
      detected,
      severity,
      growthRate
    };
  }

  /**
   * Analyze memory pressure
   */
  private analyzeMemoryPressure(samples: MemorySample[]): MemoryAnalysis['pressure'] {
    const timeAboveBaseline = samples.filter(s => s.memory.heapUsed > this.config.baselineThreshold).length / samples.length * 100;
    const timeAbovePeak = samples.filter(s => s.memory.heapUsed > this.config.peakThreshold).length / samples.length * 100;

    // Check for sustained pressure (consecutive samples above baseline)
    let maxConsecutiveHigh = 0;
    let currentConsecutiveHigh = 0;

    for (const sample of samples) {
      if (sample.memory.heapUsed > this.config.baselineThreshold) {
        currentConsecutiveHigh++;
        maxConsecutiveHigh = Math.max(maxConsecutiveHigh, currentConsecutiveHigh);
      } else {
        currentConsecutiveHigh = 0;
      }
    }

    const sustainedPressure = maxConsecutiveHigh > samples.length * 0.3; // More than 30% consecutive high usage

    return {
      timeAboveBaseline,
      timeAbovePeak,
      sustainedPressure
    };
  }

  /**
   * Validate memory usage against requirements
   */
  private validateMemoryUsage(analysis: MemoryAnalysis): MemoryValidation {
    const baselineCompliance = analysis.baseline <= this.config.baselineThreshold;
    const peakCompliance = analysis.peak <= this.config.peakThreshold;
    const noMemoryLeaks = !analysis.leak.detected || analysis.leak.severity === 'none';
    const stableOperation = !analysis.growth.exponentialGrowth && !analysis.pressure.sustainedPressure;

    const overallPass = baselineCompliance && peakCompliance && noMemoryLeaks && stableOperation;

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!baselineCompliance) {
      issues.push(`Baseline memory usage (${(analysis.baseline / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(this.config.baselineThreshold / 1024 / 1024).toFixed(2)}MB)`);
      recommendations.push('Optimize memory allocation and data structures');
    }

    if (!peakCompliance) {
      issues.push(`Peak memory usage (${(analysis.peak / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(this.config.peakThreshold / 1024 / 1024).toFixed(2)}MB)`);
      recommendations.push('Implement memory pooling and limit concurrent operations');
    }

    if (!noMemoryLeaks) {
      issues.push(`Memory leak detected with ${analysis.leak.severity} severity (${analysis.leak.growthRate?.toFixed(2)} MB/min)`);
      recommendations.push('Review object lifecycle management and event listener cleanup');
    }

    if (!stableOperation) {
      if (analysis.growth.exponentialGrowth) {
        issues.push('Exponential memory growth detected');
        recommendations.push('Implement garbage collection triggers and memory limits');
      }
      if (analysis.pressure.sustainedPressure) {
        issues.push('Sustained memory pressure detected');
        recommendations.push('Optimize data retention policies and implement memory cleanup routines');
      }
    }

    return {
      baselineCompliance,
      peakCompliance,
      noMemoryLeaks,
      stableOperation,
      overallPass,
      issues,
      recommendations
    };
  }

  /**
   * Get empty analysis for error cases
   */
  private getEmptyAnalysis(): MemoryAnalysis {
    return {
      baseline: 0,
      peak: 0,
      average: 0,
      growth: { linearGrowth: 0, exponentialGrowth: false },
      leak: { detected: false, severity: 'none' },
      pressure: { timeAboveBaseline: 0, timeAbovePeak: 0, sustainedPressure: false }
    };
  }

  /**
   * Utility function for sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export memory test results
   */
  public exportResults(results: MemoryTestResult[]): string {
    return JSON.stringify({
      config: this.config,
      results,
      summary: this.generateMemorySummary(results)
    }, null, 2);
  }

  /**
   * Generate memory test summary
   */
  private generateMemorySummary(results: MemoryTestResult[]): any {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.validation.overallPass).length;

    const memoryStats = {
      averageBaseline: results.reduce((sum, r) => sum + r.analysis.baseline, 0) / totalTests / 1024 / 1024,
      averagePeak: results.reduce((sum, r) => sum + r.analysis.peak, 0) / totalTests / 1024 / 1024,
      memoryLeaksDetected: results.filter(r => r.analysis.leak.detected).length,
      sustainedPressureEvents: results.filter(r => r.analysis.pressure.sustainedPressure).length
    };

    return {
      totalTests,
      passedTests,
      passRate: (passedTests / totalTests) * 100,
      memoryStats,
      thresholds: {
        baseline: this.config.baselineThreshold / 1024 / 1024,
        peak: this.config.peakThreshold / 1024 / 1024
      }
    };
  }
}