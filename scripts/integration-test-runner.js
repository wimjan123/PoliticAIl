#!/usr/bin/env node

/**
 * Integration Test Runner
 * Orchestrates comprehensive integration test execution with proper setup and teardown
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class IntegrationTestRunner {
  constructor() {
    this.platform = os.platform();
    this.testResults = {
      windowSimulation: { status: 'pending', duration: 0, errors: [] },
      dataPersistence: { status: 'pending', duration: 0, errors: [] },
      crossPlatform: { status: 'pending', duration: 0, errors: [] },
      performance: { status: 'pending', duration: 0, errors: [] },
    };
    this.totalStartTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[level] || 'ℹ️';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async setupTestEnvironment() {
    this.log('Setting up integration test environment...');

    try {
      // Ensure test directories exist
      const testDirs = [
        'coverage',
        'test-results',
        'test-artifacts',
      ];

      testDirs.forEach(dir => {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          this.log(`Created directory: ${dirPath}`);
        }
      });

      // Platform-specific setup
      await this.setupPlatformSpecific();

      // Environment variable setup
      process.env.NODE_ENV = 'test';
      process.env.FORCE_COLOR = '1'; // Enable colored output
      process.env.CI = process.env.CI || 'false';

      this.log('Test environment setup complete', 'success');
    } catch (error) {
      this.log(`Failed to setup test environment: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupPlatformSpecific() {
    switch (this.platform) {
      case 'linux':
        await this.setupLinuxEnvironment();
        break;
      case 'darwin':
        await this.setupMacOSEnvironment();
        break;
      case 'win32':
        await this.setupWindowsEnvironment();
        break;
      default:
        this.log(`Unknown platform: ${this.platform}`, 'warning');
    }
  }

  async setupLinuxEnvironment() {
    this.log('Setting up Linux test environment...');

    try {
      // Check for X11 display
      if (!process.env.DISPLAY) {
        this.log('No DISPLAY set, checking for Xvfb...');

        try {
          execSync('which Xvfb', { stdio: 'ignore' });
          this.log('Starting Xvfb for headless testing...');

          // Start Xvfb
          const xvfb = spawn('Xvfb', [':99', '-screen', '0', '1920x1080x24'], {
            detached: true,
            stdio: 'ignore',
          });

          process.env.DISPLAY = ':99';
          this.xvfbProcess = xvfb;

          // Wait for Xvfb to start
          await new Promise(resolve => setTimeout(resolve, 2000));
          this.log('Xvfb started successfully', 'success');
        } catch (error) {
          this.log('Xvfb not available, some tests may fail', 'warning');
        }
      }
    } catch (error) {
      this.log(`Linux setup failed: ${error.message}`, 'warning');
    }
  }

  async setupMacOSEnvironment() {
    this.log('Setting up macOS test environment...');
    // macOS-specific setup can be added here
  }

  async setupWindowsEnvironment() {
    this.log('Setting up Windows test environment...');
    // Windows-specific setup can be added here
  }

  async runTestSuite(suiteName, testPattern, options = {}) {
    const startTime = Date.now();
    this.log(`Starting ${suiteName} test suite...`);

    try {
      const testCommand = [
        'npm', 'run', 'test:integration',
        '--',
        `--testPathPattern="${testPattern}"`,
        '--runInBand',
        '--verbose',
        '--detectOpenHandles',
        '--forceExit',
        `--testTimeout=${options.timeout || 30000}`,
        '--coverage=false', // Individual suites don't need coverage
      ];

      if (options.maxWorkers) {
        testCommand.push(`--maxWorkers=${options.maxWorkers}`);
      }

      const result = await this.executeCommand(testCommand.join(' '));

      const duration = Date.now() - startTime;
      this.testResults[this.getTestKey(suiteName)] = {
        status: 'passed',
        duration,
        errors: [],
      };

      this.log(`${suiteName} tests completed successfully in ${duration}ms`, 'success');
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.testResults[this.getTestKey(suiteName)] = {
        status: 'failed',
        duration,
        errors: [error.message],
      };

      this.log(`${suiteName} tests failed after ${duration}ms: ${error.message}`, 'error');
      throw error;
    }
  }

  getTestKey(suiteName) {
    const keyMap = {
      'Window-Simulation Integration': 'windowSimulation',
      'Data Persistence Integration': 'dataPersistence',
      'Cross-Platform Compatibility': 'crossPlatform',
      'Performance Integration': 'performance',
    };
    return keyMap[suiteName] || suiteName.toLowerCase().replace(/\s+/g, '');
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${command}`);

      const child = spawn('sh', ['-c', command], {
        stdio: 'inherit',
        env: { ...process.env },
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runAllIntegrationTests() {
    this.log('🚀 Starting comprehensive integration test suite...');
    this.log(`Platform: ${this.platform}`);
    this.log(`Node.js: ${process.version}`);
    this.log(`Working directory: ${process.cwd()}`);

    try {
      await this.setupTestEnvironment();

      // Test suite configurations
      const testSuites = [
        {
          name: 'Window-Simulation Integration',
          pattern: 'window-simulation.integration.test',
          options: { timeout: 45000 },
        },
        {
          name: 'Data Persistence Integration',
          pattern: 'data-persistence.integration.test',
          options: { timeout: 60000 },
        },
        {
          name: 'Cross-Platform Compatibility',
          pattern: 'cross-platform.integration.test',
          options: { timeout: 30000 },
        },
        {
          name: 'Performance Integration',
          pattern: 'performance.integration.test',
          options: { timeout: 120000, maxWorkers: 1 },
        },
      ];

      // Run test suites sequentially for better resource management
      for (const suite of testSuites) {
        try {
          await this.runTestSuite(suite.name, suite.pattern, suite.options);
        } catch (error) {
          this.log(`Test suite ${suite.name} failed, continuing with remaining tests...`, 'warning');
          // Continue with other tests even if one fails
        }
      }

      // Generate final coverage report
      await this.generateCoverageReport();

      // Generate comprehensive report
      await this.generateTestReport();

      const totalDuration = Date.now() - this.totalStartTime;
      this.log(`All integration tests completed in ${totalDuration}ms`, 'success');

      // Check if any tests failed
      const failedTests = Object.values(this.testResults).filter(result => result.status === 'failed');
      if (failedTests.length > 0) {
        throw new Error(`${failedTests.length} test suite(s) failed`);
      }

    } finally {
      await this.cleanup();
    }
  }

  async generateCoverageReport() {
    try {
      this.log('Generating comprehensive coverage report...');

      const coverageCommand = [
        'npm', 'run', 'test:integration',
        '--',
        '--coverage',
        '--coverageReporters=text',
        '--coverageReporters=lcov',
        '--coverageReporters=html',
        '--coverageReporters=json-summary',
        '--passWithNoTests',
      ].join(' ');

      await this.executeCommand(coverageCommand);
      this.log('Coverage report generated', 'success');
    } catch (error) {
      this.log(`Failed to generate coverage report: ${error.message}`, 'warning');
    }
  }

  async generateTestReport() {
    const reportPath = path.join(process.cwd(), 'test-results', 'integration-test-report.json');

    const report = {
      timestamp: new Date().toISOString(),
      platform: this.platform,
      nodeVersion: process.version,
      totalDuration: Date.now() - this.totalStartTime,
      testResults: this.testResults,
      summary: {
        total: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(r => r.status === 'passed').length,
        failed: Object.values(this.testResults).filter(r => r.status === 'failed').length,
        pending: Object.values(this.testResults).filter(r => r.status === 'pending').length,
      },
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Test report saved to: ${reportPath}`, 'success');

    // Generate human-readable summary
    console.log('\n📊 Integration Test Summary:');
    console.log(`Platform: ${this.platform}`);
    console.log(`Total Duration: ${report.totalDuration}ms`);
    console.log(`Tests Passed: ${report.summary.passed}/${report.summary.total}`);
    console.log(`Tests Failed: ${report.summary.failed}/${report.summary.total}`);

    Object.entries(this.testResults).forEach(([suite, result]) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
      console.log(`  ${status} ${suite}: ${result.duration}ms`);
    });
  }

  async cleanup() {
    this.log('Cleaning up test environment...');

    try {
      // Kill Xvfb if we started it
      if (this.xvfbProcess) {
        this.xvfbProcess.kill();
        this.log('Xvfb process terminated');
      }

      // Clean up temporary files if needed
      // This can be extended based on specific cleanup needs

      this.log('Cleanup completed', 'success');
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'warning');
    }
  }
}

// CLI interface
async function main() {
  const runner = new IntegrationTestRunner();

  try {
    await runner.runAllIntegrationTests();
    console.log('\n🎉 All integration tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Integration tests failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { IntegrationTestRunner };