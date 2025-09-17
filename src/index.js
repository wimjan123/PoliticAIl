// Political Desktop OS Simulation - Backend Server
// Main application entry point for the Node.js backend

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import our database and service configurations
import databaseConfig, { initializeDatabases, closeDatabases } from './config/database.js';
import healthCheckService from './services/healthCheck.js';

// Load environment variables
dotenv.config({ path: '.env.development' });

/**
 * Main Application Class
 */
class PoliticalSimulationApp {
  constructor() {
    this.app = express();
    this.port = process.env.APP_PORT || 3000;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Political Desktop OS Simulation Backend...');

      // Initialize database connections
      await this.initializeDatabases();

      // Setup Express middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Start the server
      await this.startServer();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('✅ Application initialized successfully');

    } catch (error) {
      console.error('❌ Application initialization failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Initialize database connections
   */
  async initializeDatabases() {
    console.log('🔌 Connecting to databases...');
    await initializeDatabases();
    console.log('✅ Database connections established');
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    console.log('⚙️  Setting up middleware...');

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow for development
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));

    // Compression middleware
    this.app.use(compression());

    // Request logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    console.log('✅ Middleware configured');
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    console.log('🛣️  Setting up routes...');

    // Health check endpoints
    this.app.get('/health', async (req, res) => {
      try {
        const health = await healthCheckService.quick();
        const statusCode = health.overall_status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(503).json({
          overall_status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.app.get('/health/comprehensive', async (req, res) => {
      try {
        const health = await healthCheckService.comprehensive();
        const statusCode = health.overall_status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(503).json({
          overall_status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Application info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        name: 'Political Desktop OS Simulation',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        node_version: process.version,
        features: {
          real_time_news: process.env.ENABLE_REAL_TIME_NEWS === 'true',
          llm_personas: process.env.ENABLE_LLM_PERSONAS === 'true',
          social_media_simulation: process.env.ENABLE_SOCIAL_MEDIA_SIMULATION === 'true',
          debug_features: process.env.ENABLE_DEBUG_FEATURES === 'true'
        }
      });
    });

    // API routes placeholder
    this.app.get('/api', (req, res) => {
      res.json({
        message: 'Political Desktop OS Simulation API',
        version: 'v1',
        endpoints: {
          health: '/health',
          comprehensive_health: '/health/comprehensive',
          info: '/info',
          documentation: '/docs'
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Welcome to Political Desktop OS Simulation Backend',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/docs',
        health: '/health'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Routes configured');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    console.log('🛡️  Setting up error handling...');

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error(`❌ Error in request ${req.id}:`, error.message);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';

      res.status(error.status || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? error.message : 'Something went wrong',
        request_id: req.id,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error.message);
      console.error(error.stack);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise);
      console.error('Reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    console.log('✅ Error handling configured');
  }

  /**
   * Start the Express server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🌟 Server running on http://localhost:${this.port}`);
          console.log(`📊 Health check: http://localhost:${this.port}/health`);
          console.log(`📋 API info: http://localhost:${this.port}/info`);
          resolve(server);
        }
      });

      // Store server reference for graceful shutdown
      this.server = server;
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    shutdownSignals.forEach(signal => {
      process.on(signal, () => {
        console.log(`📡 Received ${signal}, starting graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });

    console.log('✅ Graceful shutdown configured');
  }

  /**
   * Perform graceful shutdown
   */
  async gracefulShutdown(reason) {
    if (this.isShuttingDown) {
      console.log('🔄 Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`🛑 Starting graceful shutdown (reason: ${reason})...`);

    try {
      // Close HTTP server
      if (this.server) {
        console.log('🔌 Closing HTTP server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('✅ HTTP server closed');
      }

      // Close database connections
      console.log('🔌 Closing database connections...');
      await closeDatabases();
      console.log('✅ Database connections closed');

      console.log('✅ Graceful shutdown completed');
      process.exit(0);

    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Start the application
 */
async function startApplication() {
  const app = new PoliticalSimulationApp();
  await app.initialize();
}

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startApplication().catch(error => {
    console.error('💥 Failed to start application:', error.message);
    process.exit(1);
  });
}

export default PoliticalSimulationApp;