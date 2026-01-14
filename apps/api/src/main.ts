/**
 * API Server Bootstrap
 * Initializes and starts the Fastify HTTP server with all routes
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appConfig, dbConfig } from '@fashion/config';
import { registerAnalyticsRoutes } from './modules/analytics/analytics.controller.js';
import { closeDb } from '@fashion/db';

/**
 * Main server initialization and startup
 * 
 * Responsibilities:
 * 1. Create Fastify application instance
 * 2. Register middleware (CORS, logging)
 * 3. Register route handlers
 * 4. Start HTTP server
 * 5. Setup graceful shutdown handlers
 */
async function bootstrap() {
  // Create Fastify instance with logging
  const app = Fastify({
    logger: {
      level: appConfig.logLevel,
      transport:
        appConfig.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register CORS middleware
  // Allows frontend applications to access the API
  await app.register(cors, {
    origin: true, // Allow all origins in development; configure for production
    credentials: true,
  });

  // Health check endpoint for load balancers/monitoring
  app.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: appConfig.nodeEnv,
    });
  });

  // Register analytics module routes
  await registerAnalyticsRoutes(app);

  // Graceful shutdown handler
  const closeGracefully = async (signal: string) => {
    app.log.info(`Received signal ${signal}, closing gracefully...`);
    
    try {
      // Close HTTP server
      await app.close();
      
      // Close database connections
      await closeDb();
      
      app.log.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      app.log.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => closeGracefully('SIGTERM'));
  process.on('SIGINT', () => closeGracefully('SIGINT'));

  // Start server
  try {
    await app.listen({
      port: appConfig.apiPort,
      host: appConfig.apiHost,
    });

    // Log database configuration (sanitized)
    app.log.info({
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
    }, 'Database configuration');

    app.log.info(
      `🚀 Fashion Trend Alchemist API running on http://${appConfig.apiHost}:${appConfig.apiPort}`
    );
    app.log.info(`📊 Analytics endpoint: http://localhost:${appConfig.apiPort}/analytics/top-bottom`);
    app.log.info(`🏥 Health check: http://localhost:${appConfig.apiPort}/health`);
    app.log.info(`Environment: ${appConfig.nodeEnv}`);
  } catch (error) {
    app.log.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the application
bootstrap();