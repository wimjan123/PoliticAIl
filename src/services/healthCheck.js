// Health Check Service for Political Desktop OS Simulation
// Comprehensive monitoring of all system components

import databaseConfig from '../config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

/**
 * Elasticsearch Health Check
 */
async function checkElasticsearch() {
  try {
    if (!process.env.ELASTICSEARCH_URL) {
      return {
        status: 'disabled',
        message: 'Elasticsearch not configured'
      };
    }

    const response = await fetch(`${process.env.ELASTICSEARCH_URL}/_cluster/health`);
    const data = await response.json();

    return {
      status: data.status === 'red' ? 'unhealthy' : 'healthy',
      message: `Elasticsearch cluster status: ${data.status}`,
      details: {
        cluster_name: data.cluster_name,
        number_of_nodes: data.number_of_nodes,
        active_primary_shards: data.active_primary_shards,
        active_shards: data.active_shards
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Elasticsearch health check failed: ${error.message}`
    };
  }
}

/**
 * LLM Provider Health Checks
 */
async function checkLLMProviders() {
  const results = {};

  // OpenAI Health Check
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'User-Agent': 'PoliticAI-HealthCheck/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        results.openai = {
          status: 'healthy',
          message: 'OpenAI API accessible'
        };
      } else {
        results.openai = {
          status: 'unhealthy',
          message: `OpenAI API returned ${response.status}`
        };
      }
    } catch (error) {
      results.openai = {
        status: 'error',
        message: `OpenAI API check failed: ${error.message}`
      };
    }
  } else {
    results.openai = {
      status: 'disabled',
      message: 'OpenAI API key not configured'
    };
  }

  // Anthropic Health Check
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }]
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok || response.status === 400) {
        // 400 is expected for minimal test request
        results.anthropic = {
          status: 'healthy',
          message: 'Anthropic API accessible'
        };
      } else {
        results.anthropic = {
          status: 'unhealthy',
          message: `Anthropic API returned ${response.status}`
        };
      }
    } catch (error) {
      results.anthropic = {
        status: 'error',
        message: `Anthropic API check failed: ${error.message}`
      };
    }
  } else {
    results.anthropic = {
      status: 'disabled',
      message: 'Anthropic API key not configured'
    };
  }

  // Local LLM Health Check
  if (process.env.LOCAL_LLM_ENDPOINT) {
    try {
      const response = await fetch(`${process.env.LOCAL_LLM_ENDPOINT}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        results.local_llm = {
          status: 'healthy',
          message: 'Local LLM accessible',
          details: {
            models_available: data.models?.length || 0
          }
        };
      } else {
        results.local_llm = {
          status: 'unhealthy',
          message: `Local LLM returned ${response.status}`
        };
      }
    } catch (error) {
      results.local_llm = {
        status: 'error',
        message: `Local LLM check failed: ${error.message}`
      };
    }
  } else {
    results.local_llm = {
      status: 'disabled',
      message: 'Local LLM endpoint not configured'
    };
  }

  return results;
}

/**
 * News API Health Checks
 */
async function checkNewsAPIs() {
  const results = {};

  // NewsAPI Health Check
  if (process.env.NEWSAPI_KEY) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&category=politics&pageSize=1&apiKey=${process.env.NEWSAPI_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        const data = await response.json();
        results.newsapi = {
          status: 'healthy',
          message: 'NewsAPI accessible',
          details: {
            articles_available: data.totalResults || 0
          }
        };
      } else {
        results.newsapi = {
          status: 'unhealthy',
          message: `NewsAPI returned ${response.status}`
        };
      }
    } catch (error) {
      results.newsapi = {
        status: 'error',
        message: `NewsAPI check failed: ${error.message}`
      };
    }
  } else {
    results.newsapi = {
      status: 'disabled',
      message: 'NewsAPI key not configured'
    };
  }

  // Media Bias/Fact Check API
  if (process.env.MBFC_API_KEY) {
    try {
      const response = await fetch(
        `${process.env.MBFC_BASE_URL}/api/search`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MBFC_API_KEY}`
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      results.mbfc = {
        status: response.ok ? 'healthy' : 'unhealthy',
        message: response.ok ? 'MBFC API accessible' : `MBFC API returned ${response.status}`
      };
    } catch (error) {
      results.mbfc = {
        status: 'error',
        message: `MBFC API check failed: ${error.message}`
      };
    }
  } else {
    results.mbfc = {
      status: 'disabled',
      message: 'MBFC API key not configured'
    };
  }

  return results;
}

/**
 * System Resource Health Check
 */
async function checkSystemResources() {
  const results = {};

  try {
    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    results.memory = {
      status: memUsedMB > 500 ? 'warning' : 'healthy',
      message: `Memory usage: ${memUsedMB}MB / ${memTotalMB}MB`,
      details: {
        heap_used_mb: memUsedMB,
        heap_total_mb: memTotalMB,
        external_mb: Math.round(memUsage.external / 1024 / 1024),
        rss_mb: Math.round(memUsage.rss / 1024 / 1024)
      }
    };

    // CPU usage approximation
    const cpuUsage = process.cpuUsage();
    results.cpu = {
      status: 'healthy',
      message: 'CPU monitoring active',
      details: {
        user_time_ms: Math.round(cpuUsage.user / 1000),
        system_time_ms: Math.round(cpuUsage.system / 1000),
        uptime_seconds: Math.round(process.uptime())
      }
    };

    // Environment check
    results.environment = {
      status: 'healthy',
      message: `Running in ${process.env.NODE_ENV || 'unknown'} mode`,
      details: {
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        env: process.env.NODE_ENV || 'development'
      }
    };

  } catch (error) {
    results.system = {
      status: 'error',
      message: `System check failed: ${error.message}`
    };
  }

  return results;
}

/**
 * Comprehensive health check of all services
 */
export async function performComprehensiveHealthCheck() {
  const startTime = Date.now();

  console.log('🏥 Performing comprehensive health check...');

  try {
    // Run all health checks in parallel
    const [
      databaseHealth,
      elasticsearchHealth,
      llmProvidersHealth,
      newsAPIsHealth,
      systemResourcesHealth
    ] = await Promise.all([
      databaseConfig.healthCheck(),
      checkElasticsearch(),
      checkLLMProviders(),
      checkNewsAPIs(),
      checkSystemResources()
    ]);

    const healthReport = {
      timestamp: new Date().toISOString(),
      check_duration_ms: Date.now() - startTime,
      overall_status: 'healthy',
      services: {
        // Database services
        mongodb: databaseHealth.services.mongodb,
        redis: databaseHealth.services.redis,

        // Search service
        elasticsearch: elasticsearchHealth,

        // LLM providers
        ...llmProvidersHealth,

        // News APIs
        ...newsAPIsHealth,

        // System resources
        ...systemResourcesHealth
      }
    };

    // Determine overall health status
    const serviceStatuses = Object.values(healthReport.services);
    const criticalServices = ['mongodb', 'redis'];

    const hasCriticalFailure = criticalServices.some(service => {
      const status = healthReport.services[service]?.status;
      return status === 'unhealthy' || status === 'error';
    });

    const hasAnyFailure = serviceStatuses.some(service =>
      service.status === 'unhealthy' || service.status === 'error'
    );

    const hasWarnings = serviceStatuses.some(service =>
      service.status === 'warning'
    );

    if (hasCriticalFailure) {
      healthReport.overall_status = 'critical';
    } else if (hasAnyFailure) {
      healthReport.overall_status = 'unhealthy';
    } else if (hasWarnings) {
      healthReport.overall_status = 'degraded';
    }

    console.log(`✅ Health check completed in ${healthReport.check_duration_ms}ms`);
    console.log(`📊 Overall status: ${healthReport.overall_status.toUpperCase()}`);

    return healthReport;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return {
      timestamp: new Date().toISOString(),
      check_duration_ms: Date.now() - startTime,
      overall_status: 'error',
      error: error.message,
      services: {}
    };
  }
}

/**
 * Quick health check for essential services only
 */
export async function performQuickHealthCheck() {
  try {
    const databaseHealth = await databaseConfig.healthCheck();

    return {
      timestamp: new Date().toISOString(),
      overall_status: databaseHealth.overall,
      services: {
        mongodb: databaseHealth.services.mongodb,
        redis: databaseHealth.services.redis
      }
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      overall_status: 'error',
      error: error.message,
      services: {}
    };
  }
}

/**
 * Start periodic health monitoring
 */
export function startHealthMonitoring(intervalMinutes = 5) {
  console.log(`🔄 Starting health monitoring (every ${intervalMinutes} minutes)`);

  const interval = setInterval(async () => {
    try {
      const health = await performQuickHealthCheck();
      if (health.overall_status !== 'healthy') {
        console.warn(`⚠️  Health warning: ${health.overall_status}`);
        console.warn('Services status:', health.services);
      }
    } catch (error) {
      console.error('❌ Health monitoring error:', error.message);
    }
  }, intervalMinutes * 60 * 1000);

  return interval;
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(interval) {
  if (interval) {
    clearInterval(interval);
    console.log('🛑 Health monitoring stopped');
  }
}

export default {
  comprehensive: performComprehensiveHealthCheck,
  quick: performQuickHealthCheck,
  start: startHealthMonitoring,
  stop: stopHealthMonitoring
};