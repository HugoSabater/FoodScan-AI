require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { apiRoutes } = require('./routes');
const { errorHandler, notFound } = require('./middlewares');
const { env } = require('./config');

/**
 * Express Application Setup
 */
const app = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: env.cors.origin,
    credentials: env.cors.credentials,
  })
);

// Body Parsing Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
app.use('/api', apiRoutes);

// Root Route
app.get('/', (_req, res) => {
  res.json({
    name: 'FoodScan AI API',
    version: '1.0.0',
    description: 'Backend API para escaneo y análisis nutricional de productos',
    author: 'Hugo Cabeza',
    environment: env.nodeEnv,
    endpoints: {
      health: 'GET /api/health',
      users: {
        list: 'GET /api/users',
        create: 'POST /api/users',
        getById: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
      },
      products: {
        list: 'GET /api/products',
        create: 'POST /api/products',
        getByBarcode: 'GET /api/products/:barcode',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
      },
      scans: {
        list: 'GET /api/scans',
        create: 'POST /api/scans',
        getByUser: 'GET /api/scans/user/:userId',
      },
    },
    documentation: 'https://github.com/HugoSabater/FoodScan-AI',
    status: 'running',
  });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
