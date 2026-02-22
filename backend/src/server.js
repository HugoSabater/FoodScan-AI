const app = require('./app');
const { env } = require('./config');
const { syncDatabase } = require('./models');

/**
 * Server Entry Point
 * Syncs the DB schema first, then starts the Express server.
 */
const PORT = env.port;

async function start() {
  // 1. Sync Sequelize models → runs ALTER TABLE for any new columns
  await syncDatabase({ alter: true });

  // 2. Only start listening once the schema is ready
  const server = app.listen(PORT, () => {
    console.info(`
  🚀 FoodScan AI Server is running!
  
  📍 Environment: ${env.nodeEnv}
  🌐 URL: http://localhost:${PORT}
  💚 Health Check: http://localhost:${PORT}/api/health
  
  Press CTRL+C to stop
  `);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.info('HTTP server closed');
      process.exit(0);
    });
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
