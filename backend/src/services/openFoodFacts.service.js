/**
 * OpenFoodFacts Service
 * Fetches product data from the public OpenFoodFacts API
 */

const axios = require('axios');

const BASE_URL = 'https://world.openfoodfacts.org/api/v0/product';

/**
 * Fetch product data from OpenFoodFacts API
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object>} Normalized product data
 * @throws {Error} If product not found or API error
 */
const fetchProductData = async barcode => {
  try {
    const response = await axios.get(`${BASE_URL}/${barcode}.json`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'FoodScanAI/1.0 (TFG Project)',
      },
    });

    const { status, product } = response.data;

    if (status !== 1 || !product) {
      const error = new Error('Product not found in OpenFoodFacts');
      error.statusCode = 404;
      throw error;
    }

    // Normalize and extract only relevant fields
    const normalizedProduct = {
      barcode: product.code || barcode,
      name: product.product_name || product.product_name_es || 'Unknown Product',
      brand: product.brands || null,
      image_url: product.image_url || product.image_front_url || null,
      ingredients_text: product.ingredients_text || product.ingredients_text_es || null,
      nutri_score: product.nutriscore_grade || null,
    };

    return normalizedProduct;
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      const apiError = new Error('OpenFoodFacts API error');
      apiError.statusCode = error.response.status;
      throw apiError;
    }

    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('OpenFoodFacts API timeout');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    // Re-throw custom errors
    if (error.statusCode) {
      throw error;
    }

    // Generic error
    const genericError = new Error('Failed to fetch product data');
    genericError.statusCode = 500;
    throw genericError;
  }
};

module.exports = {
  fetchProductData,
};
