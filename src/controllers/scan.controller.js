/**
 * Scan Controller
 * Handles product scanning operations with intelligent analysis
 */

const { Scan, Product, User } = require('../models');
const { openFoodFactsService, aiService } = require('../services');

/**
 * Scan a product with intelligent analysis
 * @route POST /api/scan
 * @body { barcode, userId }
 */
const scanProduct = async (req, res, next) => {
  try {
    const { barcode, userId, customProfile } = req.body;

    // Validate required fields
    if (!barcode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: barcode and userId are required',
      });
    }

    // Verify user exists (for database record)
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        userId,
      });
    }

    // Step 1: Try to find product in local database
    let product = await Product.findOne({
      where: { barcode },
    });

    let productSource = 'database';

    // Step 2: If not found, fetch from OpenFoodFacts
    if (!product) {
      try {
        const externalData = await openFoodFactsService.fetchProductData(barcode);

        // Cache the product in our database
        product = await Product.create({
          barcode: externalData.barcode,
          name: externalData.name,
          brand: externalData.brand,
          ingredients_text: externalData.ingredients_text,
          nutri_score: externalData.nutri_score,
          image_url: externalData.image_url,
        });

        productSource = 'openfoodfacts';
      } catch (fetchError) {
        // Product not found in OpenFoodFacts either
        if (fetchError.statusCode === 404) {
          return res.status(404).json({
            success: false,
            message: 'Product not found in database or OpenFoodFacts',
            barcode,
          });
        }
        throw fetchError;
      }
    }

    // Step 3: Analyze product with AI
    // Use customProfile from frontend if provided, otherwise fall back to database user
    const userProfile = customProfile || {
      dietary_preference: user.dietary_preference,
      allergies: user.allergies || [],
    };

    const analysis = await aiService.analyzeHealth(
      {
        name: product.name,
        brand: product.brand,
        ingredients_text: product.ingredients_text,
        nutri_score: product.nutri_score,
      },
      userProfile
    );

    // Step 4: Create scan record
    const scan = await Scan.create({
      user_id: userId,
      product_id: product.id,
      scanned_at: new Date(),
    });

    // Step 5: Return complete response
    return res.status(201).json({
      success: true,
      message: 'Scanned successfully',
      data: {
        scan: {
          id: scan.id,
          scanned_at: scan.scanned_at,
        },
        product: {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          nutri_score: product.nutri_score,
          image_url: product.image_url,
          ingredients_text: product.ingredients_text,
          source: productSource,
        },
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user scan history
 * @route GET /api/users/:userId/history
 */
const getUserHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        userId,
      });
    }

    // Get all scans for user with product data
    const scans = await Scan.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'barcode', 'name', 'brand', 'nutri_score', 'image_url'],
        },
      ],
      order: [['scanned_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: scans.length,
      data: scans,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanProduct,
  getUserHistory,
};
