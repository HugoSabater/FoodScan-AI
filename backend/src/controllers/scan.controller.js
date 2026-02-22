/**
 * Scan Controller
 * Handles product scanning operations with intelligent analysis.
 *
 * Cache strategy (TFG):
 *   - Before calling Groq, we look for an existing Scan record for the same
 *     (product_code, profile_hash).  If found, we return the stored analysis.
 *   - This ensures the Scanner and History always agree on the verdict for a
 *     given (product, profile) combination, regardless of when the scan happened.
 *   - profile_hash = SHA-256 of a stable string derived from diet + sorted allergies.
 *     We compute it with Node's built-in `crypto` module — no extra dependencies.
 */

const crypto = require('crypto');
const { Scan, Product, User, AnalysisResult } = require('../models');
const { openFoodFactsService, aiService } = require('../services');

// ── Profile hash ──────────────────────────────────────────────────────────────

/**
 * Produces a deterministic 16-char hex token for a user profile.
 * The same (diet, allergies) always produces the same hash.
 *
 * @param {{ dietary_preference?: string, diet?: string, allergies?: string[] }} profile
 * @returns {string}
 */
function buildProfileHash(profile) {
  const diet = (profile.dietary_preference || profile.diet || 'none').toLowerCase().trim();
  const allergies = (profile.allergies || [])
    .map(a => a.toLowerCase().trim())
    .sort()
    .join(',');

  return crypto.createHash('sha256').update(`${diet}::${allergies}`).digest('hex').slice(0, 16); // first 16 hex chars is plenty for a cache key
}

// ── Controller ────────────────────────────────────────────────────────────────

/**
 * Scan a product with intelligent analysis.
 * @route POST /api/scan
 * @body { barcode, userId, customProfile? }
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
    let product = await Product.findOne({ where: { barcode } });
    let productSource = 'database';

    // Step 2: If not found, fetch from OpenFoodFacts and cache locally
    if (!product) {
      try {
        const externalData = await openFoodFactsService.fetchProductData(barcode);

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

    const userProfile = customProfile || {
      dietary_preference: user.dietary_preference,
      allergies: user.allergies || [],
    };

    const diet = (userProfile.dietary_preference || userProfile.diet || 'none')
      .toLowerCase()
      .trim();
    const sortedAllergies =
      (userProfile.allergies || [])
        .map(a => a.toLowerCase().trim())
        .sort()
        .join(',') || 'none';

    const profileHash = buildProfileHash(userProfile);

    // Step 4: Cache lookup — shared AnalysisResult table
    // same product + same diet + same allergies = reuse stored analysis for ANY user
    const cachedAnalysis = await AnalysisResult.findOne({
      where: {
        product_code: barcode,
        diet,
        allergies: sortedAllergies,
      },
    });

    let analysis;
    let analysisSource;

    if (cachedAnalysis) {
      // ✅ Cache hit — use shared analysis results
      console.info(
        `[Scan] Global Cache HIT for (barcode=${barcode}, diet=${diet}, allergies=${sortedAllergies})`
      );
      analysis = {
        is_suitable: cachedAnalysis.is_suitable,
        analysis_reason: cachedAnalysis.reason,
        custom_health_score: cachedAnalysis.health_score,
        diet: cachedAnalysis.diet,
        allergies: cachedAnalysis.allergies,
        ai_model: 'llama-3.3-70b-versatile (cached)',
        analyzed_at: cachedAnalysis.createdAt,
      };
      analysisSource = 'cache';
    } else {
      // ❌ Cache miss — call Groq and store the result in AnalysisResult
      console.info(
        `[Scan] Global Cache MISS for (barcode=${barcode}, diet=${diet}, allergies=${sortedAllergies}) — calling Groq.`
      );
      analysis = await aiService.analyzeHealth(
        {
          name: product.name,
          brand: product.brand,
          ingredients_text: product.ingredients_text,
          nutri_score: product.nutri_score,
        },
        userProfile
      );

      analysisSource = analysis.ai_model === 'fallback' ? 'fallback' : 'ai';

      // Save to shared cache if it's a real AI result (not fallback)
      if (analysisSource === 'ai') {
        await AnalysisResult.create({
          product_code: barcode,
          diet,
          allergies: sortedAllergies,
          health_score: analysis.custom_health_score,
          is_suitable: analysis.is_suitable,
          reason: analysis.analysis_reason,
        });

        // Add profile context to the analysis object for the frontend
        analysis.diet = diet;
        analysis.allergies = sortedAllergies;
      }
    }

    // Step 5: Always create a new Scan record (preserves full history)
    //         but store the analysis result and profile hash for future cache hits.
    const scan = await Scan.create({
      user_id: userId,
      product_code: product.barcode,
      scanned_at: new Date(),
      profile_hash: profileHash,
      analysis_result: analysis,
      analysis_source: analysisSource,
    });

    // Step 6: Return complete response
    return res.status(201).json({
      success: true,
      message: 'Scanned successfully',
      data: {
        scan: {
          id: scan.id,
          scanned_at: scan.scanned_at,
          analysis_source: analysisSource, // useful for the frontend to show "from cache"
        },
        product: {
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
 * Get user scan history.
 * @route GET /api/users/:userId/history
 */
const getUserHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        userId,
      });
    }

    const scans = await Scan.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['barcode', 'name', 'brand', 'nutri_score', 'image_url'],
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
