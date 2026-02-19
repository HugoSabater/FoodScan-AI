const express = require('express');
const {
  healthController,
  productController,
  scanController,
  userController,
} = require('../controllers');

const router = express.Router();

// =====================================
// HEALTH
// =====================================

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', healthController.getHealth);

// =====================================
// AUTH
// =====================================

/**
 * @route   POST /api/auth/login
 * @desc    Login user (simulated for MVP)
 * @access  Public
 * @body    { email }
 */
router.post('/auth/login', userController.login);

// =====================================
// USERS
// =====================================

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Public
 */
router.get('/users', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/users/:id', userController.getUserById);

/**
 * @route   GET /api/users/:userId/history
 * @desc    Get user scan history
 * @access  Public
 */
router.get('/users/:userId/history', scanController.getUserHistory);

/**
 * @route   GET /api/users/:userId/stats
 * @desc    Get user statistics
 * @access  Public
 */
router.get('/users/:userId/stats', userController.getUserStats);

/**
 * @route   POST /api/users/meal-plan
 * @desc    Generate 1-day meal plan
 * @access  Public
 * @body    { userId, profile }
 */
router.post('/users/meal-plan', userController.getMealPlan);

// =====================================
// PRODUCTS
// =====================================

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/products', productController.getAllProducts);

/**
 * @route   GET /api/products/trending
 * @desc    Get trending products for Quick Scan
 * @access  Public
 */
router.get('/products/trending', productController.getTrendingProducts);

/**
 * @route   GET /api/products/:barcode
 * @desc    Get product by barcode
 * @access  Public
 */
router.get('/products/:barcode', productController.getProductByBarcode);

// =====================================
// SCANS
// =====================================

/**
 * @route   POST /api/scan
 * @desc    Scan a product
 * @access  Public
 * @body    { barcode, userId }
 */
router.post('/scan', scanController.scanProduct);

module.exports = router;
