#!/usr/bin/env node

/**
 * Database Test Runner Script
 * Standalone script to test database schema and operations
 */

import { runDatabaseTests } from '../src/database/test_database.js';
import { closeDatabases } from '../src/config/database.js';

async function main() {
  console.log('🚀 Starting Database Test Suite...\n');

  try {
    // Run all database tests
    const results = await runDatabaseTests();

    // Display results
    console.log('\n📋 Test Results Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Tests: ${results.summary.total_tests}`);
    console.log(`✅ Passed: ${results.summary.passed_tests}`);
    console.log(`❌ Failed: ${results.summary.failed_tests}`);
    console.log(`📈 Success Rate: ${results.summary.success_rate}%`);

    if (results.summary.performance_issues.length > 0) {
      console.log(`⚠️  Performance Issues: ${results.summary.performance_issues.length}`);
      results.summary.performance_issues.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.executionTime}ms (${issue.warning})`);
      });
    }

    // Show detailed results for failed tests
    if (results.summary.failed_tests > 0) {
      console.log('\n❌ Failed Tests Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      Object.values(results.tests).forEach(testGroup => {
        testGroup.forEach(test => {
          if (test.status === 'failed') {
            console.log(`   ❌ ${test.name}: ${test.error}`);
          }
        });
      });
    }

    // Show performance summary
    console.log('\n⚡ Performance Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    Object.entries(results.tests).forEach(([category, tests]) => {
      const avgTime = tests
        .filter(t => t.status === 'passed')
        .reduce((sum, t) => sum + t.executionTime, 0) / tests.filter(t => t.status === 'passed').length;

      console.log(`   📂 ${category}: avg ${Math.round(avgTime)}ms`);
    });

    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.summary.success_rate >= 95) {
      console.log('🏆 EXCELLENT: Database implementation is highly robust');
    } else if (results.summary.success_rate >= 85) {
      console.log('✅ GOOD: Database implementation is solid with minor issues');
    } else if (results.summary.success_rate >= 70) {
      console.log('⚠️  FAIR: Database implementation needs attention');
    } else {
      console.log('🚨 POOR: Database implementation has significant issues');
    }

    if (results.summary.performance_issues.length === 0) {
      console.log('⚡ Performance meets <50ms target for all operations');
    } else {
      console.log(`⚠️  ${results.summary.performance_issues.length} operations exceed 50ms performance target`);
    }

    // Exit with appropriate code
    const exitCode = results.summary.failed_tests === 0 ? 0 : 1;
    console.log(`\n${exitCode === 0 ? '✅' : '❌'} Tests ${exitCode === 0 ? 'PASSED' : 'FAILED'}\n`);

    process.exit(exitCode);

  } catch (error) {
    console.error('\n💥 Test suite failed to run:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Clean up database connections
    try {
      await closeDatabases();
    } catch (error) {
      console.error('Error closing databases:', error.message);
    }
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main();