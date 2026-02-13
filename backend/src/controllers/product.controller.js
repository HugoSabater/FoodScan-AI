/**
 * Product Controller
 * Handles product-related operations
 */

const { Product } = require('../models');

/**
 * Get product by barcode
 * @route GET /api/products/:barcode
 */
const getProductByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({
      where: { barcode },
    });

    if (!product) {
      // TODO: In the future, connect to AI/external API to fetch product data
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        barcode,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products
 * @route GET /api/products
 */
const getAllProducts = async (_req, res, next) => {
  try {
    const products = await Product.findAll({
      order: [['name', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trending products for Quick Scan
 * @route GET /api/products/trending
 */
const getTrendingProducts = async (_req, res, next) => {
  try {
    const offService = require('../services/off.service');
    const trendingProducts = await offService.getTrendingProducts();

    return res.status(200).json({
      success: true,
      count: trendingProducts.length,
      data: trendingProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductByBarcode,
  getAllProducts,
  getTrendingProducts,
};
