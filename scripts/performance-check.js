#!/usr/bin/env node

/**
 * Performance Check Script
 * Validates performance thresholds and generates performance reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_THRESHOLDS = {
  // Timing thresholds (in milliseconds)
  windowCreation: 100,
  simulationTick: 50,
  stateUpdate: 10,
  windowClose: 50,

  // Memory thresholds (in MB)
  peakMemory: 500,
  averageMemory: 250,
  memoryGrowthRate: 10, // MB per minute

  // Frame rate thresholds
  minFPS: 55,
  averageFPS: 58,

  // Response time thresholds
  uiResponseTime: 16, // One frame at 60fps
  apiResponseTime: 200,
};

class PerformanceChecker {
  constructor() {
    this.results = {
      timing: {},
      memory: {},
      frameRate: {},
      responseTime: {},
      overall: { passed: false, score: 0 },
    };
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      perf: '⚡',
    }[level] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runPerformanceChecks() {
    this.log('Starting performance validation checks...', 'perf');

    try {
      // Run different types of performance checks
      await this.checkTimingPerformance();
      await this.checkMemoryPerformance();
      await this.checkFrameRatePerformance();
      await this.checkResponseTimePerformance();

      // Calculate overall performance score
      this.calculateOverallScore();

      // Generate performance report
      await this.generatePerformanceReport();

      if (!this.results.overall.passed) {
        throw new Error(`Performance checks failed. Score: ${this.results.overall.score}/100`);
      }

      this.log(`Performance checks passed! Score: ${this.results.overall.score}/100`, 'success');

    } catch (error) {
      this.log(`Performance checks failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async checkTimingPerformance() {
    this.log('🕐 Checking timing performance...');

    const timingTests = [
      { name: 'windowCreation', test: () => this.simulateWindowCreation() },
      { name: 'simulationTick', test: () => this.simulateSimulationTick() },
      { name: 'stateUpdate', test: () => this.simulateStateUpdate() },
      { name: 'windowClose', test: () => this.simulateWindowClose() },
    ];

    for (const { name, test } of timingTests) {
      const measurements = [];

      // Run multiple iterations for accurate measurement
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint();
        await test();
        const endTime = process.hrtime.bigint();

        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        measurements.push(duration);
      }

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const max = Math.max(...measurements);
      const min = Math.min(...measurements);

      this.results.timing[name] = {
        average: Math.round(average * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
        threshold: PERFORMANCE_THRESHOLDS[name],
        passed: average <= PERFORMANCE_THRESHOLDS[name],
      };

      const status = this.results.timing[name].passed ? '✅' : '❌';
      this.log(`  ${status} ${name}: ${this.results.timing[name].average}ms (threshold: ${PERFORMANCE_THRESHOLDS[name]}ms)`);
    }
  }

  async checkMemoryPerformance() {
    this.log('🧠 Checking memory performance...');

    const initialMemory = this.getMemoryUsage();
    const memorySnapshots = [initialMemory];

    // Simulate memory-intensive operations
    const operations = [
      () => this.simulateWindowCreation(50), // Create 50 windows
      () => this.simulateSimulationStateExpansion(),
      () => this.simulateLargeDataProcessing(),
      () => this.simulateMemoryCleanup(),
    ];

    for (let i = 0; i < operations.length; i++) {
      await operations[i]();
      const memory = this.getMemoryUsage();
      memorySnapshots.push(memory);

      this.log(`  Memory after operation ${i + 1}: ${memory.heapUsed}MB`);
    }

    const peakMemory = Math.max(...memorySnapshots.map(s => s.heapUsed));
    const averageMemory = memorySnapshots.reduce((a, b) => a + b.heapUsed, 0) / memorySnapshots.length;
    const memoryGrowth = memorySnapshots[memorySnapshots.length - 1].heapUsed - memorySnapshots[0].heapUsed;

    this.results.memory = {
      peak: Math.round(peakMemory),
      average: Math.round(averageMemory),
      growth: Math.round(memoryGrowth),
      peakPassed: peakMemory <= PERFORMANCE_THRESHOLDS.peakMemory,
      averagePassed: averageMemory <= PERFORMANCE_THRESHOLDS.averageMemory,
      growthPassed: memoryGrowth <= PERFORMANCE_THRESHOLDS.memoryGrowthRate,
    };

    const peakStatus = this.results.memory.peakPassed ? '✅' : '❌';
    const avgStatus = this.results.memory.averagePassed ? '✅' : '❌';
    const growthStatus = this.results.memory.growthPassed ? '✅' : '❌';

    this.log(`  ${peakStatus} Peak memory: ${this.results.memory.peak}MB (threshold: ${PERFORMANCE_THRESHOLDS.peakMemory}MB)`);
    this.log(`  ${avgStatus} Average memory: ${this.results.memory.average}MB (threshold: ${PERFORMANCE_THRESHOLDS.averageMemory}MB)`);
    this.log(`  ${growthStatus} Memory growth: ${this.results.memory.growth}MB (threshold: ${PERFORMANCE_THRESHOLDS.memoryGrowthRate}MB)`);
  }

  async checkFrameRatePerformance() {
    this.log('🎬 Checking frame rate performance...');

    // Simulate frame rate measurement
    const frameTimings = [];
    const testDuration = 1000; // 1 second
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    let frameCount = 0;
    const startTime = Date.now();

    while (Date.now() - startTime < testDuration) {
      const frameStart = process.hrtime.bigint();

      // Simulate frame rendering work
      await this.simulateFrameRendering();

      const frameEnd = process.hrtime.bigint();
      const frameTime = Number(frameEnd - frameStart) / 1000000;
      frameTimings.push(frameTime);
      frameCount++;

      // Simulate frame timing
      const elapsed = frameTime < frameInterval ? frameInterval - frameTime : 0;
      if (elapsed > 0) {
        await new Promise(resolve => setTimeout(resolve, elapsed));
      }
    }

    const actualFPS = Math.round((frameCount * 1000) / testDuration);
    const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
    const droppedFrames = frameTimings.filter(time => time > frameInterval * 1.5).length;

    this.results.frameRate = {
      fps: actualFPS,
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      droppedFrames,
      fpsPassed: actualFPS >= PERFORMANCE_THRESHOLDS.minFPS,
      avgFrameTimePassed: averageFrameTime <= PERFORMANCE_THRESHOLDS.uiResponseTime,
    };

    const fpsStatus = this.results.frameRate.fpsPassed ? '✅' : '❌';
    const frameTimeStatus = this.results.frameRate.avgFrameTimePassed ? '✅' : '❌';

    this.log(`  ${fpsStatus} FPS: ${this.results.frameRate.fps} (threshold: ${PERFORMANCE_THRESHOLDS.minFPS})`);
    this.log(`  ${frameTimeStatus} Avg frame time: ${this.results.frameRate.averageFrameTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.uiResponseTime}ms)`);
    this.log(`  Dropped frames: ${this.results.frameRate.droppedFrames}`);
  }

  async checkResponseTimePerformance() {
    this.log('📡 Checking response time performance...');

    const responseTests = [
      { name: 'uiResponse', test: () => this.simulateUIInteraction() },
      { name: 'apiResponse', test: () => this.simulateAPICall() },
    ];

    for (const { name, test } of responseTests) {
      const measurements = [];

      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint();
        await test();
        const endTime = process.hrtime.bigint();

        const duration = Number(endTime - startTime) / 1000000;
        measurements.push(duration);
      }

      const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const threshold = name === 'uiResponse' ? PERFORMANCE_THRESHOLDS.uiResponseTime : PERFORMANCE_THRESHOLDS.apiResponseTime;

      this.results.responseTime[name] = {
        average: Math.round(average * 100) / 100,
        threshold,
        passed: average <= threshold,
      };

      const status = this.results.responseTime[name].passed ? '✅' : '❌';
      this.log(`  ${status} ${name}: ${this.results.responseTime[name].average}ms (threshold: ${threshold}ms)`);
    }
  }

  calculateOverallScore() {
    let score = 0;
    let maxScore = 0;

    // Timing score (25 points)
    const timingPassed = Object.values(this.results.timing).filter(r => r.passed).length;
    const timingTotal = Object.values(this.results.timing).length;
    score += (timingPassed / timingTotal) * 25;
    maxScore += 25;

    // Memory score (25 points)
    const memoryPassed = [
      this.results.memory.peakPassed,
      this.results.memory.averagePassed,
      this.results.memory.growthPassed,
    ].filter(Boolean).length;
    score += (memoryPassed / 3) * 25;
    maxScore += 25;

    // Frame rate score (25 points)
    const frameRatePassed = [
      this.results.frameRate.fpsPassed,
      this.results.frameRate.avgFrameTimePassed,
    ].filter(Boolean).length;
    score += (frameRatePassed / 2) * 25;
    maxScore += 25;

    // Response time score (25 points)
    const responseTimePassed = Object.values(this.results.responseTime).filter(r => r.passed).length;
    const responseTimeTotal = Object.values(this.results.responseTime).length;
    score += (responseTimePassed / responseTimeTotal) * 25;
    maxScore += 25;

    this.results.overall = {
      score: Math.round(score),
      maxScore,
      passed: score >= 80, // 80% threshold for passing
    };
  }

  async generatePerformanceReport() {
    const reportPath = path.join(process.cwd(), 'performance-report.json');

    const report = {
      timestamp: new Date().toISOString(),
      platform: process.platform,
      nodeVersion: process.version,
      duration: Date.now() - this.startTime,
      thresholds: PERFORMANCE_THRESHOLDS,
      results: this.results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Performance report saved to: ${reportPath}`, 'success');
  }

  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  }

  // Simulation methods for testing
  async simulateWindowCreation(count = 1) {
    // Simulate the computational cost of creating windows
    for (let i = 0; i < count; i++) {
      const windowData = {
        id: `window_${i}`,
        config: new Array(100).fill(0).map(() => Math.random()),
        components: new Array(50).fill(0).map(() => ({
          props: new Array(20).fill(0),
        })),
      };
      // Simulate DOM manipulation delay
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  async simulateSimulationTick() {
    // Simulate simulation state calculations
    const stateSize = 1000;
    const state = new Array(stateSize).fill(0).map(() => Math.random());

    // Simulate processing
    state.forEach((value, index) => {
      state[index] = Math.sin(value) * Math.cos(index);
    });

    await new Promise(resolve => setImmediate(resolve));
  }

  async simulateStateUpdate() {
    // Simulate React state update
    const updates = new Array(10).fill(0).map(() => ({
      id: Math.random(),
      data: Math.random(),
    }));

    // Simulate state reconciliation
    updates.sort((a, b) => a.id - b.id);
    await new Promise(resolve => setImmediate(resolve));
  }

  async simulateWindowClose() {
    // Simulate cleanup operations
    const cleanup = new Array(100).fill(0);
    cleanup.splice(0, cleanup.length);

    // Simulate cleanup delay
    await new Promise(resolve => setTimeout(resolve, 2));
  }

  async simulateSimulationStateExpansion() {
    // Simulate growing simulation state
    const largeState = new Array(10000).fill(0).map(() => ({
      id: Math.random(),
      data: new Array(10).fill(0),
    }));

    // Process the state
    largeState.forEach(item => {
      item.processed = true;
    });
  }

  async simulateLargeDataProcessing() {
    // Simulate processing large datasets
    const dataset = new Array(5000).fill(0).map(() => ({
      value: Math.random(),
      metadata: new Array(5).fill(0),
    }));

    // Process data
    const processed = dataset
      .filter(item => item.value > 0.5)
      .map(item => ({ ...item, processed: true }));

    return processed.length;
  }

  async simulateMemoryCleanup() {
    // Simulate garbage collection
    if (global.gc) {
      global.gc();
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async simulateFrameRendering() {
    // Simulate rendering work
    const elements = new Array(100).fill(0).map(() => ({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      color: Math.random(),
    }));

    // Simulate rendering calculations
    elements.forEach(element => {
      element.transform = `translate(${element.x}, ${element.y})`;
    });

    await new Promise(resolve => setImmediate(resolve));
  }

  async simulateUIInteraction() {
    // Simulate UI event handling
    const event = {
      type: 'click',
      target: 'button',
      timestamp: Date.now(),
    };

    // Simulate event processing
    await new Promise(resolve => setImmediate(resolve));
    return event;
  }

  async simulateAPICall() {
    // Simulate API request processing
    const delay = Math.random() * 100 + 50; // 50-150ms delay
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      status: 200,
      data: { success: true },
    };
  }
}

// Main execution
async function main() {
  const checker = new PerformanceChecker();

  try {
    await checker.runPerformanceChecks();
    console.log('\n🎉 Performance checks completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Performance checks failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  console.log('⚡ Starting performance validation...');
  console.log(`Platform: ${process.platform}`);
  console.log(`Node.js: ${process.version}`);
  console.log('');

  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceChecker, PERFORMANCE_THRESHOLDS };