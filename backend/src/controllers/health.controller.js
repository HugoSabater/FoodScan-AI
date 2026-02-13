/**
 * Health Controller
 * Handles health check endpoints for the API
 */

const getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
};

module.exports = {
  getHealth,
};
