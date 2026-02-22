/**
 * Scraper Service — Trending Products via OpenFoodFacts Barcode API
 *
 * Strategy:
 *   1. Maintain a curated dictionary of Spanish staple products with clean names.
 *   2. Fetch each product from the OFF /api/v2/product/{barcode}.json endpoint.
 *      Tries world.openfoodfacts.org first, then es.openfoodfacts.org as fallback
 *      (some Spanish products are only indexed on the country subdomain).
 *   3. From the API response, take ONLY the image and brand — the name always
 *      comes from our dictionary to ensure consistency and readability.
 *   4. Cache results for 24 hours to avoid hammering OFF servers.
 *
 * Zero third-party dependencies: uses only Node.js built-in `https`.
 */

const https = require('https');
const { Product } = require('../models');

// ── 24-hour in-memory cache ───────────────────────────────────────────────────
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Curated product dictionary ────────────────────────────────────────────────
// cleanName is what we ALWAYS send to the frontend — OFF names are ignored.
const STAPLE_PRODUCTS = [
  { barcode: '8410014478764', cleanName: 'ColaCao' },
  { barcode: '8410127044101', cleanName: 'Aceite de Oliva Extra' },
  { barcode: '8410376010107', cleanName: 'Avena' },
  { barcode: '8410036004169', cleanName: 'Leche' },
];

// OFF subdomains tried in order — some Spanish products only on es.
const OFF_HOSTS = ['world.openfoodfacts.org', 'es.openfoodfacts.org'];

// ── HTTP helper ───────────────────────────────────────────────────────────────

/**
 * GETs a URL and returns the parsed JSON body.
 * Follows HTTP 301/302 redirects automatically.
 *
 * @param {string} url
 * @returns {Promise<any>}
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'FoodScanAI/1.0 (TFG project)',
          Accept: 'application/json',
        },
      },
      res => {
        if ([301, 302].includes(res.statusCode) && res.headers.location) {
          return fetchJson(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }

        res.setEncoding('utf8');
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      }
    );

    req.setTimeout(12_000, () => req.destroy(new Error(`Timeout fetching ${url}`)));
    req.on('error', reject);
  });
}

// ── Per-product fetcher ───────────────────────────────────────────────────────

/**
 * Fetches a single product from OFF by barcode.
 * Tries each OFF_HOSTS entry in order, stopping at the first success.
 * Returns the curated name from our dictionary — never the OFF name.
 *
 * @param {{ barcode: string, cleanName: string }} entry
 * @returns {Promise<{barcode, name, brand, image_url} | null>}
 */
async function fetchProduct({ barcode, cleanName }) {
  for (const host of OFF_HOSTS) {
    const url = `https://${host}/api/v2/product/${barcode}.json`;

    try {
      const data = await fetchJson(url);

      if (data.status !== 1 || !data.product) {
        // Product node not present on this host — try next
        continue;
      }

      const p = data.product;

      // Brand — take first tag, prettify hyphens
      const brand =
        p.brands_tags?.[0]?.replace(/-/g, ' ') ||
        p.brands?.split(',')[0]?.trim() ||
        'Marca desconocida';

      // Image — prefer the front image
      const image_url = p.image_front_url || p.image_url || p.image_front_small_url || null;

      // CRITICAL: name always from our dictionary, never from OFF
      const result = { barcode, name: cleanName, brand, image_url };

      console.info(
        `[Scraper] OK ${cleanName} (${barcode}) via ${host} | brand: ${brand} | img: ${!!image_url}`
      );
      return result;
    } catch (err) {
      if (err.message.startsWith('HTTP 404')) {
        // Silently try the next host
        continue;
      }
      console.warn(`[Scraper] Error fetching "${cleanName}" from ${host}: ${err.message}`);
    }
  }

  console.warn(`[Scraper] "${cleanName}" (${barcode}) not found on any OFF host.`);
  return null;
}

// ── DB fallback ───────────────────────────────────────────────────────────────

async function fetchFromDatabase() {
  try {
    console.info('[Scraper] Using local database as fallback.');
    const rows = await Product.findAll({ limit: 6 });
    return rows.map(row => ({
      barcode: row.barcode || String(row.id),
      name: row.name || 'Producto sin nombre',
      brand: row.brand || 'Marca desconocida',
      image_url: row.image_url || null,
    }));
  } catch (err) {
    console.error('[Scraper] Database fallback failed:', err.message);
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the curated list of trending Spanish products.
 * Results are cached for 24 hours.
 *
 * @returns {Promise<Array<{barcode, name, brand, image_url}>>}
 */
async function scrapeSpanishStaples() {
  const now = Date.now();

  if (_cache?.length && now - _cacheTime < CACHE_TTL_MS) {
    console.debug('[Scraper] Returning 24 h cached products.');
    return _cache;
  }

  try {
    // Fetch all products in parallel — each fetchProduct already handles per-host retries
    // Individual .catch() for resilience: if one fails, others continue.
    const results = await Promise.all(
      STAPLE_PRODUCTS.map(entry =>
        fetchProduct(entry).catch(err => {
          console.error(`[Scraper] Failed to fetch ${entry.cleanName}:`, err.message);
          return null;
        })
      )
    );

    // Filter out null (failed) entries
    const products = results.filter(Boolean);

    // Step 3: Synchronize with database (upsert)
    for (const p of products) {
      try {
        await Product.upsert({
          barcode: p.barcode,
          name: p.name, // CURATED clean name from STAPLE_PRODUCTS
          brand: p.brand,
          image_url: p.image_url,
        });
      } catch (dbErr) {
        console.error(`[Scraper] Database sync failed for ${p.name}:`, dbErr.message);
      }
    }

    if (products.length > 0) {
      _cache = products;
      _cacheTime = now;
      console.info(`[Scraper] Cached ${products.length} products (TTL: 24 h).`);
      return products;
    }

    // Nothing from the API — fall back to local DB, retry sooner
    console.warn('[Scraper] No products from OFF API, falling back to DB.');
    const dbProducts = await fetchFromDatabase();
    if (dbProducts.length) {
      _cache = dbProducts;
      _cacheTime = now - CACHE_TTL_MS + 5 * 60 * 1000; // retry in 5 min
    }
    return dbProducts;
  } catch (err) {
    console.error('[Scraper] Unexpected error:', err.message);
    return fetchFromDatabase();
  }
}

module.exports = { scrapeSpanishStaples };
