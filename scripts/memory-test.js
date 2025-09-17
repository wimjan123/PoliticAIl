#!/usr/bin/env node

/**
 * Memory Test Runner
 * Runs memory stress tests and analyzes memory usage patterns
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MEMORY_THRESHOLD_MB = 500; // Maximum memory usage threshold in MB
const GC_INTERVAL = 1000; // Garbage collection interval in ms

class MemoryTester {
  constructor() {
    this.memorySnapshots = [];
    this.testResults = {
      peakMemory: 0,
      averageMemory: 0,
      memoryLeaks: [],
      gcEvents: 0,
      testsPassed: 0,
      testsFailed: 0,
    };
  }

  logMemoryUsage(label = '') {
    if (global.gc) {
      global.gc();
    }

    const usage = process.memoryUsage();
    const snapshot = {
      timestamp: Date.now(),
      label,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
    };

    this.memorySnapshots.push(snapshot);
    this.testResults.peakMemory = Math.max(this.testResults.peakMemory, snapshot.heapUsed);

    console.log(`[${label}] Memory: ${snapshot.heapUsed}MB heap, ${snapshot.rss}MB RSS`);
    return snapshot;
  }

  detectMemoryLeaks() {
    if (this.memorySnapshots.length < 10) {
      return [];
    }

    const leaks = [];
    const recent = this.memorySnapshots.slice(-10);
    const older = this.memorySnapshots.slice(-20, -10);

    if (recent.length === 0 || older.length === 0) {
      return leaks;
    }

    const recentAvg = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.heapUsed, 0) / older.length;

    // Detect significant memory growth (>50MB increase)
    if (recentAvg - olderAvg > 50) {
      leaks.push({
        type: 'memory_growth',
        increase: recentAvg - olderAvg,
        timespan: recent[recent.length - 1].timestamp - recent[0].timestamp,
      });
    }

    return leaks;
  }

  async runMemoryStressTest() {
    console.log('🔄 Starting memory stress test...');
    this.logMemoryUsage('test_start');

    try {
      // Test 1: Window creation/destruction memory usage
      await this.testWindowMemoryUsage();

      // Test 2: Simulation state memory usage
      await this.testSimulationMemoryUsage();

      // Test 3: Rapid state updates memory usage
      await this.testRapidUpdatesMemoryUsage();

      // Test 4: Large data set handling
      await this.testLargeDataSetMemoryUsage();

      this.logMemoryUsage('test_end');
      this.analyzeResults();

    } catch (error) {
      console.error('❌ Memory stress test failed:', error.message);
      this.testResults.testsFailed++;
      throw error;
    }
  }

  async testWindowMemoryUsage() {
    console.log('🪟 Testing window creation/destruction memory usage...');
    this.logMemoryUsage('window_test_start');

    // Simulate creating and destroying multiple windows
    const windows = [];
    for (let i = 0; i < 20; i++) {
      // Simulate window object creation
      const window = {
        id: `window_${i}`,
        config: {
          title: `Test Window ${i}`,
          width: 800,
          height: 600,
          data: new Array(1000).fill(0).map(() => Math.random()),
        },
        components: new Array(100).fill(0).map(() => ({
          id: Math.random(),
          props: { data: new Array(50).fill(0) },
        })),
      };
      windows.push(window);

      if (i % 5 === 0) {
        this.logMemoryUsage(`window_created_${i}`);
      }
    }

    // Clear windows to test cleanup
    windows.splice(0, windows.length);
    if (global.gc) global.gc();

    this.logMemoryUsage('window_test_end');
    this.testResults.testsPassed++;
  }

  async testSimulationMemoryUsage() {
    console.log('⚙️ Testing simulation state memory usage...');
    this.logMemoryUsage('simulation_test_start');

    // Simulate large simulation state
    const simulationState = {
      players: new Array(100).fill(0).map((_, i) => ({
        id: `player_${i}`,
        policies: new Array(50).fill(0).map((_, j) => ({
          id: `policy_${i}_${j}`,
          data: new Array(20).fill(0),
        })),
        relationships: new Array(30).fill(0),
        history: new Array(200).fill(0),
      })),
      events: new Array(500).fill(0).map(() => ({
        id: Math.random(),
        data: new Array(10).fill(0),
        choices: new Array(5).fill(0),
      })),
    };

    // Simulate state updates
    for (let i = 0; i < 100; i++) {
      simulationState.players.forEach(player => {
        player.policies.push({
          id: `policy_update_${i}`,
          data: new Array(20).fill(Math.random()),
        });
      });

      if (i % 20 === 0) {
        this.logMemoryUsage(`simulation_update_${i}`);
      }
    }

    this.logMemoryUsage('simulation_test_end');
    this.testResults.testsPassed++;
  }

  async testRapidUpdatesMemoryUsage() {
    console.log('⚡ Testing rapid state updates memory usage...');
    this.logMemoryUsage('rapid_test_start');

    const stateCache = new Map();

    // Simulate rapid updates
    for (let i = 0; i < 1000; i++) {
      const key = `state_${i % 100}`; // Reuse keys to test cleanup
      const value = {
        timestamp: Date.now(),
        data: new Array(100).fill(Math.random()),
      };

      stateCache.set(key, value);

      if (i % 100 === 0) {
        this.logMemoryUsage(`rapid_update_${i}`);
        // Trigger leak detection
        const leaks = this.detectMemoryLeaks();
        if (leaks.length > 0) {
          this.testResults.memoryLeaks.push(...leaks);
        }
      }
    }

    stateCache.clear();
    this.logMemoryUsage('rapid_test_end');
    this.testResults.testsPassed++;
  }

  async testLargeDataSetMemoryUsage() {
    console.log('📊 Testing large data set memory usage...');
    this.logMemoryUsage('large_data_test_start');

    // Simulate large data sets
    const largeDataSets = [];
    for (let i = 0; i < 10; i++) {
      const dataSet = {
        id: `dataset_${i}`,
        data: new Array(10000).fill(0).map(() => ({
          id: Math.random(),
          value: Math.random(),
          metadata: new Array(10).fill(0),
        })),
      };
      largeDataSets.push(dataSet);
      this.logMemoryUsage(`large_data_${i}`);
    }

    // Process data sets to simulate real usage
    largeDataSets.forEach((dataSet, index) => {
      const processed = dataSet.data
        .filter(item => item.value > 0.5)
        .map(item => ({ ...item, processed: true }));

      if (index % 3 === 0) {
        this.logMemoryUsage(`data_processing_${index}`);
      }
    });

    largeDataSets.splice(0, largeDataSets.length);
    if (global.gc) global.gc();

    this.logMemoryUsage('large_data_test_end');
    this.testResults.testsPassed++;
  }

  analyzeResults() {
    const totalSnapshots = this.memorySnapshots.length;
    if (totalSnapshots === 0) {
      console.warn('⚠️ No memory snapshots collected');
      return;
    }

    this.testResults.averageMemory = Math.round(
      this.memorySnapshots.reduce((sum, s) => sum + s.heapUsed, 0) / totalSnapshots
    );

    console.log('\n📊 Memory Test Results:');
    console.log(`📈 Peak Memory Usage: ${this.testResults.peakMemory}MB`);
    console.log(`📊 Average Memory Usage: ${this.testResults.averageMemory}MB`);
    console.log(`✅ Tests Passed: ${this.testResults.testsPassed}`);
    console.log(`❌ Tests Failed: ${this.testResults.testsFailed}`);

    if (this.testResults.memoryLeaks.length > 0) {
      console.log(`🚨 Memory Leaks Detected: ${this.testResults.memoryLeaks.length}`);
      this.testResults.memoryLeaks.forEach((leak, index) => {
        console.log(`  ${index + 1}. ${leak.type}: +${leak.increase}MB over ${leak.timespan}ms`);
      });
    } else {
      console.log('✅ No memory leaks detected');
    }

    // Check against thresholds
    const memoryPassed = this.testResults.peakMemory <= MEMORY_THRESHOLD_MB;
    const leaksPassed = this.testResults.memoryLeaks.length === 0;

    console.log('\n🎯 Threshold Analysis:');
    console.log(`Memory Usage (${this.testResults.peakMemory}MB <= ${MEMORY_THRESHOLD_MB}MB): ${memoryPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Memory Leaks (${this.testResults.memoryLeaks.length} detected): ${leaksPassed ? '✅ PASS' : '❌ FAIL'}`);

    // Save detailed results
    this.saveResults();

    if (!memoryPassed || !leaksPassed) {
      throw new Error('Memory tests failed threshold checks');
    }
  }

  saveResults() {
    const resultsPath = path.join(process.cwd(), 'memory-test-results.json');
    const detailedResults = {
      ...this.testResults,
      snapshots: this.memorySnapshots,
      timestamp: new Date().toISOString(),
      thresholds: {
        maxMemoryMB: MEMORY_THRESHOLD_MB,
        passed: this.testResults.peakMemory <= MEMORY_THRESHOLD_MB && this.testResults.memoryLeaks.length === 0,
      },
    };

    fs.writeFileSync(resultsPath, JSON.stringify(detailedResults, null, 2));
    console.log(`📄 Detailed results saved to: ${resultsPath}`);
  }
}

// Main execution
async function runMemoryTests() {
  const tester = new MemoryTester();

  try {
    await tester.runMemoryStressTest();
    console.log('\n🎉 All memory tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Memory tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting memory stress tests...');
  console.log(`Memory threshold: ${MEMORY_THRESHOLD_MB}MB`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log('');

  runMemoryTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MemoryTester };