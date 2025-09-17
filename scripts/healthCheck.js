#!/usr/bin/env node
// Health Check Script for Political Desktop OS Simulation
// Validates all service connections and system readiness

import { performComprehensiveHealthCheck, performQuickHealthCheck } from '../src/services/healthCheck.js';
import { initializeDatabases, closeDatabases } from '../src/config/database.js';
import dotenv from 'dotenv';

// Load environment configuration
dotenv.config({ path: '.env.development' });

/**
 * Main health check execution
 */
async function main() {
  const args = process.argv.slice(2);
  const isQuickCheck = args.includes('--quick') || args.includes('-q');
  const isVerbose = args.includes('--verbose') || args.includes('-v');

  console.log('🏥 Political Desktop OS Simulation - Health Check');
  console.log('================================================\n');

  try {
    // Initialize database connections
    console.log('🔌 Initializing database connections...');
    await initializeDatabases();
    console.log('✅ Database connections established\n');

    // Perform health check
    let healthReport;
    if (isQuickCheck) {
      console.log('⚡ Performing quick health check...');
      healthReport = await performQuickHealthCheck();
    } else {
      console.log('🔍 Performing comprehensive health check...');
      healthReport = await performComprehensiveHealthCheck();
    }

    // Display results
    displayHealthReport(healthReport, isVerbose);

    // Determine exit code
    const exitCode = getExitCode(healthReport.overall_status);

    if (exitCode === 0) {
      console.log('\n🎉 System is healthy and ready for development!');
    } else {
      console.log('\n⚠️  System has issues that need attention.');
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('❌ Health check failed:', error.message);

    if (isVerbose) {
      console.error('\nError details:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    // Clean up connections
    await closeDatabases();
  }
}

/**
 * Display health report in a formatted way
 */
function displayHealthReport(report, verbose = false) {
  const { overall_status, timestamp, check_duration_ms, services, error } = report;

  // Overall status
  console.log(`📊 Overall Status: ${getStatusEmoji(overall_status)} ${overall_status.toUpperCase()}`);
  console.log(`⏱️  Check Duration: ${check_duration_ms}ms`);
  console.log(`🕐 Timestamp: ${new Date(timestamp).toLocaleString()}\n`);

  if (error) {
    console.log(`❌ Error: ${error}\n`);
    return;
  }

  // Service statuses
  console.log('🔧 Service Status:');
  console.log('==================');

  const serviceGroups = {
    'Core Services': ['mongodb', 'redis'],
    'Search Services': ['elasticsearch'],
    'LLM Providers': ['openai', 'anthropic', 'local_llm'],
    'News APIs': ['newsapi', 'mbfc'],
    'System Resources': ['memory', 'cpu', 'environment']
  };

  for (const [groupName, serviceNames] of Object.entries(serviceGroups)) {
    const groupServices = serviceNames.filter(name => services[name]);

    if (groupServices.length > 0) {
      console.log(`\n${groupName}:`);

      for (const serviceName of groupServices) {
        const service = services[serviceName];
        const emoji = getStatusEmoji(service.status);
        const status = service.status.toUpperCase().padEnd(12);

        console.log(`  ${emoji} ${serviceName.padEnd(20)} ${status} ${service.message}`);

        if (verbose && service.details) {
          displayServiceDetails(service.details, '    ');
        }
      }
    }
  }

  // Health recommendations
  displayHealthRecommendations(services);
}

/**
 * Display detailed service information
 */
function displayServiceDetails(details, indent = '') {
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'object' && value !== null) {
      console.log(`${indent}${key}:`);
      displayServiceDetails(value, indent + '  ');
    } else {
      console.log(`${indent}${key}: ${value}`);
    }
  }
}

/**
 * Display health recommendations based on service statuses
 */
function displayHealthRecommendations(services) {
  const issues = [];
  const recommendations = [];

  // Check for critical service issues
  if (services.mongodb?.status !== 'healthy') {
    issues.push('MongoDB is not healthy');
    recommendations.push('• Check MongoDB connection: npm run docker:logs mongodb');
    recommendations.push('• Restart MongoDB: npm run docker:down && npm run docker:up');
  }

  if (services.redis?.status !== 'healthy') {
    issues.push('Redis is not healthy');
    recommendations.push('• Check Redis connection: npm run docker:logs redis');
    recommendations.push('• Restart Redis: npm run docker:down && npm run docker:up');
  }

  // Check for missing API keys
  if (services.openai?.status === 'disabled') {
    recommendations.push('• Configure OpenAI API key in .env.development for AI features');
  }

  if (services.newsapi?.status === 'disabled') {
    recommendations.push('• Configure NewsAPI key in .env.development for real-time news');
  }

  // Check for performance warnings
  if (services.memory?.status === 'warning') {
    recommendations.push('• High memory usage detected - consider restarting the application');
  }

  // Display recommendations
  if (issues.length > 0 || recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    console.log('===================');

    if (issues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      issues.forEach(issue => console.log(`  ❌ ${issue}`));
    }

    if (recommendations.length > 0) {
      console.log('\n📋 Suggestions:');
      recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    console.log('\n📖 For more help, see the troubleshooting section in README.md');
  }
}

/**
 * Get emoji for status
 */
function getStatusEmoji(status) {
  const emojis = {
    healthy: '✅',
    unhealthy: '❌',
    error: '💥',
    warning: '⚠️',
    disabled: '🔒',
    degraded: '🟡',
    critical: '🔥'
  };
  return emojis[status] || '❓';
}

/**
 * Get exit code based on overall status
 */
function getExitCode(status) {
  const exitCodes = {
    healthy: 0,
    degraded: 0,
    unhealthy: 1,
    critical: 2,
    error: 3
  };
  return exitCodes[status] || 1;
}

/**
 * Display usage information
 */
function displayUsage() {
  console.log('Usage: npm run health [options]');
  console.log('');
  console.log('Options:');
  console.log('  -q, --quick     Perform quick health check (core services only)');
  console.log('  -v, --verbose   Show detailed service information');
  console.log('  -h, --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run health              # Full health check');
  console.log('  npm run health -- --quick   # Quick check');
  console.log('  npm run health -- --verbose # Detailed output');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayUsage();
  process.exit(0);
}

// Execute main function
main().catch(error => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
});