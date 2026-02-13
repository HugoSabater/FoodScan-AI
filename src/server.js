const app = require('./app');
const { env } = require('./config');

/**
 * Server Entry Point
 * Starts the Express server
 */
const PORT = env.port;

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
