const axios = require('axios');
const { Product } = require('../models');

/**
 * OpenFoodFacts Service — Trending Products
 *
 * Strategy:
 *   1. Return in-memory cache if < 1 hour old (avoids hammering the public API).
 *   2. Fetch from OpenFoodFacts in parallel with a per-product timeout.
 *   3. If the API returns nothing (rate-limited / all timed out), fall back to
 *      our own database so the UI is never empty.
 */

// ── Barcodes ─────────────────────────────────────────────────────────────────
// Productos españoles cotidianos — dieta mediterránea, muy estables en OFF.
const TRENDING_BARCODES = [
  '8410036004169', // Leche Entera Puleva
  '8410069016481', // Macarrones Gallo
  '8410066110946', // Tomate Frito Orlando
  '8410010210081', // Aceite de Oliva Carbonell
  '8410000003051', // Atún Claro Calvo
];

// ── In-memory cache ───────────────────────────────────────────────────────────
let cachedTrending = null;
let lastFetch = 0;
const CACHE_TTL_MS = 3_600_000; // 1 hour

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetches a single product from OpenFoodFacts.
 * Returns a normalised object or null on failure.
 */
async function fetchFromOFF(barcode) {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        timeout: 8000,
        headers: {
          'User-Agent': 'FoodScanAI/1.0 (https://github.com/HugoSabater/FoodScan-AI)',
        },
      }
    );

    if (response.data?.status === 1 && response.data?.product) {
      const p = response.data.product;
      return {
        barcode,
        name: p.product_name || 'Producto sin nombre',
        brand: p.brands || 'Marca desconocida',
        image_url: p.image_url || p.image_front_url || null,
      };
    }
    return null;
  } catch (err) {
    console.warn(`[OFF] Failed to fetch barcode ${barcode}: ${err.message}`);
    return null;
  }
}

/**
 * Falls back to the local database when the external API is unavailable.
 * Maps Sequelize Product instances to the same shape as fetchFromOFF().
 */
async function fetchFromDatabase() {
  try {
    console.info('[OFF] API unavailable — falling back to local database products.');
    const rows = await Product.findAll({ limit: 6 });
    return rows.map(row => ({
      barcode: row.barcode || row.code || String(row.id),
      name: row.name || 'Producto sin nombre',
      brand: row.brand || 'Marca desconocida',
      image_url: row.image_url || null,
    }));
  } catch (dbErr) {
    console.error('[OFF] Database fallback also failed:', dbErr.message);
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns trending products, honouring the 1-hour in-memory cache.
 * If OpenFoodFacts is unavailable the response comes from the local DB.
 *
 * @returns {Promise<Array<{barcode, name, brand, image_url}>>}
 */
async function getTrendingProducts() {
  // 1. Cache hit — return immediately, no external call
  const now = Date.now();
  if (cachedTrending?.length && now - lastFetch < CACHE_TTL_MS) {
    console.debug('[OFF] Returning cached trending products.');
    return cachedTrending;
  }

  // 2. Fetch from OpenFoodFacts in parallel
  try {
    const results = await Promise.all(TRENDING_BARCODES.map(fetchFromOFF));
    const products = results.filter(Boolean);

    // 3. Fallback: if OFF returned nothing meaningful, query local DB
    if (products.length === 0) {
      const dbProducts = await fetchFromDatabase();
      // Only cache DB results for 5 minutes so we retry OFF sooner
      if (dbProducts.length > 0) {
        cachedTrending = dbProducts;
        lastFetch = now - CACHE_TTL_MS + 300_000; // expire in 5 min
      }
      return dbProducts;
    }

    // 4. Update cache with fresh OFF data
    cachedTrending = products;
    lastFetch = now;
    console.info(`[OFF] Cached ${products.length} trending products (TTL: 1 h).`);
    return products;
  } catch (err) {
    console.error('[OFF] Unexpected error in getTrendingProducts:', err);
    // Still try the DB before giving up
    return fetchFromDatabase();
  }
}

module.exports = {
  getTrendingProducts,
};
