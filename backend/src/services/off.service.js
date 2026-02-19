const axios = require('axios');

/**
 * OpenFoodFacts Service - Trending Products
 * Fetches popular products for Quick Scan feature
 */

// Lista de códigos de barras populares predefinidos
const TRENDING_BARCODES = [
  '3017620422003', // Nutella
  '5449000000996', // Coca-Cola Original
  '8480000590718', // Avena Hacendado
  '8410199010063', // Hummus Carrefour
  '3017620425035', // Nutella B-ready
  '5449000000439', // Coca-Cola Zero
];

/**
 * Obtiene productos trending desde OpenFoodFacts
 * @returns {Promise<Array>} Array de productos simplificados
 */
async function getTrendingProducts() {
  try {
    const productPromises = TRENDING_BARCODES.map(async barcode => {
      try {
        const response = await axios.get(
          `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
          {
            timeout: 10000,
            headers: {
              'User-Agent': 'FoodScanAI/1.0 (https://github.com/HugoSabater/FoodScan-AI)',
            },
          }
        );

        if (response.data.status === 1 && response.data.product) {
          const product = response.data.product;
          return {
            barcode: barcode,
            name: product.product_name || 'Producto sin nombre',
            brand: product.brands || 'Marca desconocida',
            image_url: product.image_url || product.image_front_url || null,
          };
        }
        return null;
      } catch (error) {
        console.warn(`Failed to fetch product ${barcode}:`, error.message);
        return null;
      }
    });

    const products = await Promise.all(productPromises);

    // Filtrar productos nulos (fallidos) y devolver solo los exitosos
    return products.filter(p => p !== null);
  } catch (error) {
    console.error('Error fetching trending products:', error);
    throw new Error('Failed to fetch trending products', { cause: error });
  }
}

module.exports = {
  getTrendingProducts,
};
