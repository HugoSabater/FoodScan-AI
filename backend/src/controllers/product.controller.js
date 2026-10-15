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

const SEED_BACKEND_PRODUCTS = [
  { barcode: '80135463', name: 'Nutella', brand: 'Ferrero', nutri_score: 'e', image_url: 'https://images.openfoodfacts.org/images/products/801/354/63/front_es.32.400.jpg' },
  { barcode: '8410014478764', name: 'ColaCao Original', brand: 'Idilia Foods', nutri_score: 'd', image_url: 'https://images.openfoodfacts.org/images/products/841/001/447/8764/front_es.71.400.jpg' },
  { barcode: '5449000131805', name: 'Coca-Cola Zero', brand: 'Coca-Cola', nutri_score: 'b', image_url: 'https://images.openfoodfacts.org/images/products/544/900/013/1805/front_es.201.400.jpg' },
  { barcode: '7613034626844', name: 'KitKat', brand: 'Nestlé', nutri_score: 'e', image_url: 'https://images.openfoodfacts.org/images/products/761/303/462/6844/front_es.68.400.jpg' },
  { barcode: '8480000094038', name: 'Copos de Avena Integral', brand: 'Hacendado', nutri_score: 'a', image_url: 'https://images.openfoodfacts.org/images/products/848/000/009/4038/front_es.52.400.jpg' },
  { barcode: '8480000213811', name: 'Aceite de Oliva Virgen Extra', brand: 'Hacendado', nutri_score: 'b', image_url: 'https://images.openfoodfacts.org/images/products/848/000/021/3811/front_es.38.400.jpg' }
];

/**
 * Get trending products for Quick Scan (Web Scraper strategy)
 * @route GET /api/products/trending
 */
const getTrendingProducts = async (_req, res, next) => {
  try {
    const trendingProducts = await Product.findAll({
      limit: 6,
      order: [['updated_at', 'DESC']],
    });

    if (trendingProducts && trendingProducts.length > 0) {
      return res.status(200).json({
        success: true,
        count: trendingProducts.length,
        data: trendingProducts,
      });
    }

    return res.status(200).json({
      success: true,
      count: SEED_BACKEND_PRODUCTS.length,
      data: SEED_BACKEND_PRODUCTS,
    });
  } catch (error) {
    console.warn('[ProductController] DB query failed, returning seed trending products:', error.message);
    return res.status(200).json({
      success: true,
      count: SEED_BACKEND_PRODUCTS.length,
      data: SEED_BACKEND_PRODUCTS,
    });
  }
};

module.exports = {
  getProductByBarcode,
  getAllProducts,
  getTrendingProducts,
};
