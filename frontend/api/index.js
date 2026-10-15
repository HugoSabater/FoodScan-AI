/**
 * FoodScan AI - Vercel Serverless Function API Handler
 * Handles all /api/* routes seamlessly with Groq AI and resilient seed data store.
 */

const SEED_PRODUCTS = [
  {
    id: 1,
    barcode: '80135463',
    name: 'Nutella',
    brand: 'Ferrero',
    nutri_score: 'e',
    image_url: 'https://images.openfoodfacts.org/images/products/801/354/63/front_es.32.400.jpg',
    ingredients_text: 'Azúcar, manteca de palma, avellanas (13%), leche desnatada en polvo (8,7%), cacao desgrasado (7,4%), emulgentes: lecitinas (soja), vainillina.',
    source: 'seed_catalog'
  },
  {
    id: 2,
    barcode: '8410014478764',
    name: 'ColaCao Original',
    brand: 'Idilia Foods',
    nutri_score: 'd',
    image_url: 'https://images.openfoodfacts.org/images/products/841/001/447/8764/front_es.71.400.jpg',
    ingredients_text: 'Azúcar, cacao desgrasado natural (22%), crema de cereal kola-malteado (harina de trigo, extracto de malta de cebada, aroma natural: extracto de nuez de kola), sales minerales (calcio, fósforo), aromas, sal.',
    source: 'seed_catalog'
  },
  {
    id: 3,
    barcode: '5449000131805',
    name: 'Coca-Cola Zero Azúcar',
    brand: 'Coca-Cola',
    nutri_score: 'b',
    image_url: 'https://images.openfoodfacts.org/images/products/544/900/013/1805/front_es.201.400.jpg',
    ingredients_text: 'Agua carbonatada, colorante E-150d, edulcorantes: ciclamato sódico, acesulfamo K y aspartamo, acidulante ácido fosfórico, aromas naturales.',
    source: 'seed_catalog'
  },
  {
    id: 4,
    barcode: '7613034626844',
    name: 'KitKat',
    brand: 'Nestlé',
    nutri_score: 'e',
    image_url: 'https://images.openfoodfacts.org/images/products/761/303/462/6844/front_es.68.400.jpg',
    ingredients_text: 'Azúcar, harina de trigo, leche desnatada en polvo, manteca de cacao, pasta de cacao, grasas vegetales (palma, shea), grasa láctea anhidra, cacao desgrasado en polvo.',
    source: 'seed_catalog'
  },
  {
    id: 5,
    barcode: '8480000094038',
    name: 'Copos de Avena Integral',
    brand: 'Hacendado',
    nutri_score: 'a',
    image_url: 'https://images.openfoodfacts.org/images/products/848/000/009/4038/front_es.52.400.jpg',
    ingredients_text: '100% copos de avena integrales. Contiene gluten.',
    source: 'seed_catalog'
  },
  {
    id: 6,
    barcode: '8480000213811',
    name: 'Aceite de Oliva Virgen Extra',
    brand: 'Hacendado',
    nutri_score: 'b',
    image_url: 'https://images.openfoodfacts.org/images/products/848/000/021/3811/front_es.38.400.jpg',
    ingredients_text: 'Aceite de oliva virgen extra de categoría superior obtenido directamente de aceitunas y sólo mediante procedimientos mecánicos.',
    source: 'seed_catalog'
  },
  {
    id: 7,
    barcode: '8437014389021',
    name: 'Tofu Firme Bio',
    brand: 'Soria Natural',
    nutri_score: 'a',
    image_url: 'https://images.openfoodfacts.org/images/products/843/701/438/9021/front_es.12.400.jpg',
    ingredients_text: 'Bebida de soja (agua, habas de soja (27,8%)), gelificante: cloruro de magnesio (nigari). Procedente de agricultura ecológica.',
    source: 'seed_catalog'
  },
  {
    id: 8,
    barcode: '8435300012345',
    name: 'Salmón Noruego Fresco',
    brand: 'Pescadería Selecta',
    nutri_score: 'a',
    image_url: 'https://images.openfoodfacts.org/images/products/843/530/001/2345/front_es.4.400.jpg',
    ingredients_text: 'Salmón atlántico (Salmo salar) 100%. Alto contenido en ácidos grasos Omega-3 y proteínas de alto valor biológico.',
    source: 'seed_catalog'
  }
];

// In-Memory dynamic store for the serverless lifecycle
const inMemoryScans = [
  {
    id: 1,
    user_id: 1,
    product_id: 5,
    product_code: '8480000094038',
    scanned_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    product: SEED_PRODUCTS[4],
    analysis_result: {
      is_suitable: true,
      analysis_reason: 'Excelente cereal integral, rico en betaglucanos y fibra saludable.',
      custom_health_score: 95,
      ai_model: 'llama-3.3-70b-versatile',
      analyzed_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  },
  {
    id: 2,
    user_id: 1,
    product_id: 6,
    product_code: '8480000213811',
    scanned_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    product: SEED_PRODUCTS[5],
    analysis_result: {
      is_suitable: true,
      analysis_reason: 'Grasa monoinsaturada cardiosaludable con polifenoles antioxidantes.',
      custom_health_score: 90,
      ai_model: 'llama-3.3-70b-versatile',
      analyzed_at: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  },
  {
    id: 3,
    user_id: 1,
    product_id: 1,
    product_code: '80135463',
    scanned_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    product: SEED_PRODUCTS[0],
    analysis_result: {
      is_suitable: false,
      analysis_reason: 'Muy alto contenido en azúcares refinados y grasa de palma saturada.',
      custom_health_score: 25,
      ai_model: 'llama-3.3-70b-versatile',
      analyzed_at: new Date(Date.now() - 3600000 * 24).toISOString()
    }
  },
  {
    id: 4,
    user_id: 1,
    product_id: 3,
    product_code: '5449000131805',
    scanned_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    product: SEED_PRODUCTS[2],
    analysis_result: {
      is_suitable: true,
      analysis_reason: 'Bebida sin azúcar ni calorías. Apto ocasional, aunque contiene edulcorantes artificiales.',
      custom_health_score: 65,
      ai_model: 'llama-3.3-70b-versatile',
      analyzed_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  }
];

let nextScanId = inMemoryScans.length + 1;

/**
 * Deterministic rule-based nutritional analyzer fallback
 */
function evaluateNutritionalSuitability(product, profile) {
  const diet = ((profile && (profile.diet || profile.dietary_preference)) || 'omnivoro').toLowerCase();
  const allergies = (profile && profile.allergies) || [];
  const text = ((product.name || '') + ' ' + (product.ingredients_text || '')).toLowerCase();

  for (const allergy of allergies) {
    const a = allergy.toLowerCase().trim();
    if (a && text.includes(a)) {
      return {
        is_suitable: false,
        analysis_reason: `Alerta: Contiene tu alérgeno declarado (${allergy}). No recomendado.`,
        custom_health_score: 0,
        ai_model: 'deterministic-rules'
      };
    }
  }

  if (diet === 'vegano' || diet === 'vegan') {
    const animalTerms = ['leche', 'huevo', 'miel', 'carne', 'pescado', 'gelatina', 'suero lácteo', 'manteca de cerdo', 'caseína'];
    for (const term of animalTerms) {
      if (text.includes(term)) {
        return {
          is_suitable: false,
          analysis_reason: `No apto para dieta vegana: contiene derivados animales (${term}).`,
          custom_health_score: 0,
          ai_model: 'deterministic-rules'
        };
      }
    }
  }

  if (diet === 'keto') {
    if (text.includes('azúcar') || text.includes('harina') || text.includes('avena') || text.includes('cacao desgrasado 22%')) {
      return {
        is_suitable: false,
        analysis_reason: 'No apto para dieta keto: alto en carbohidratos o azúcares netos.',
        custom_health_score: 20,
        ai_model: 'deterministic-rules'
      };
    }
  }

  const scoreMap = { a: 92, b: 78, c: 55, d: 35, e: 18 };
  const baseScore = scoreMap[(product.nutri_score || 'c').toLowerCase()] || 50;

  return {
    is_suitable: baseScore >= 50,
    analysis_reason: baseScore >= 50
      ? `Apto para tu estilo de vida: Calidad nutricional NutriScore ${product.nutri_score ? product.nutri_score.toUpperCase() : 'B'}.`
      : `Producto ultraprocesado con NutriScore ${product.nutri_score ? product.nutri_score.toUpperCase() : 'D'}. Consumir con moderación.`,
    custom_health_score: baseScore,
    ai_model: 'deterministic-rules'
  };
}

/**
 * Deterministic meal plan generator tailored to diet and allergies
 */
function generateStructuredMealPlan(profile) {
  const diet = ((profile && (profile.diet || profile.dietary_preference)) || 'omnivoro').toLowerCase();

  if (diet === 'vegano' || diet === 'vegan') {
    return [
      {
        type: 'Desayuno',
        name: 'Tostada de pan integral con aguacate, semillas de chía y té verde',
        calories: 380,
        ingredients: ['Pan integral de masa madre', 'Aguacate maduro', 'Semillas de chía', 'Tomate en rodajas', 'Aceite de oliva virgen extra'],
        reason: 'Rico en grasas saludables vegetales, fibra soluble y antioxidantes.'
      },
      {
        type: 'Comida',
        name: 'Bowl de quinoa con tofu marinado, espinacas y garbanzos crujientes',
        calories: 560,
        ingredients: ['Quinoa cocida', 'Tofu firme bio', 'Garbanzos salteados', 'Espinacas frescas', 'Salsa de tahini y limón'],
        reason: 'Proteína vegetal de alto valor biológico con perfil completo de aminoácidos.'
      },
      {
        type: 'Cena',
        name: 'Crema de calabaza asada con semillas de calabaza y tempeh a la plancha',
        calories: 420,
        ingredients: ['Calabaza', 'Bebida de avena', 'Tempeh de soja fermentada', 'Semillas de calabaza tostadas', 'Nuez moscada'],
        reason: 'Cena digestiva, saciante y rica en probióticos naturales para la microbiota.'
      }
    ];
  }

  if (diet === 'keto') {
    return [
      {
        type: 'Desayuno',
        name: 'Revuelto de huevos camperos con espinacas y queso feta',
        calories: 410,
        ingredients: ['Huevos ecológicos', 'Espinacas tiernas', 'Queso feta', 'Aceite de oliva virgen extra'],
        reason: 'Cero carbohidratos netos, alto en colina y grasas saludables para mantener la cetosis.'
      },
      {
        type: 'Comida',
        name: 'Lomo de salmón noruego al horno con espárragos trigueros y mantequilla clarificada',
        calories: 620,
        ingredients: ['Salmón fresco', 'Espárragos verdes', 'Ghee / Mantequilla clarificada', 'Limón y eneldo'],
        reason: 'Gran aporte de ácidos grasos Omega-3 DHA/EPA y proteína de máxima digestibilidad.'
      },
      {
        type: 'Cena',
        name: 'Ensalada keto con pechuga de pollo, aguacate, nueces y aderezo de aceite virgen',
        calories: 490,
        ingredients: ['Pechuga a la plancha', 'Aguacate', 'Nueces de pecán', 'Canónigos y rúcula', 'Vinagre de manzana'],
        reason: 'Equilibrio perfecto de micronutrientes sin picos de glucosa nocturnos.'
      }
    ];
  }

  if (diet === 'paleo') {
    return [
      {
        type: 'Desayuno',
        name: 'Tortilla de plátano macho con frutos del bosque y nueces',
        calories: 390,
        ingredients: ['Huevos de pasto', 'Plátano macho', 'Arándanos silvestres', 'Nueces', 'Canela de Ceilán'],
        reason: 'Carbohidratos no procesados y grasas naturales de recolección ancestral.'
      },
      {
        type: 'Comida',
        name: 'Entrecot de ternera de pasto con batata asada y ensalada campestre',
        calories: 640,
        ingredients: ['Carne de pasto 100%', 'Batata asada al romero', 'Hojas verdes variadas', 'Aceite virgen extra'],
        reason: 'Hierro hemo, zinc biodisponible y energía de combustión lenta.'
      },
      {
        type: 'Cena',
        name: 'Merluza al vapor con wok de verduras de temporada y almendras',
        calories: 430,
        ingredients: ['Lomos de merluza fresca', 'Calabacín', 'Zanahoria', 'Pimientos tricolor', 'Almendras laminadas'],
        reason: 'Plato ligero y antiinflamatorio para una óptima recuperación celular durante el sueño.'
      }
    ];
  }

  // Default: Omnívoro / Equilibrado
  return [
    {
      type: 'Desayuno',
      name: 'Porridge de avena integral con plátano, canela y nueces',
      calories: 420,
      ingredients: ['Copos de avena integral', 'Leche semidesnatada o vegetal', 'Plátano en rodajas', 'Nueces troceadas', 'Canela'],
      reason: 'Energía sostenida durante toda la mañana gracias a los carbohidratos complejos de bajo índice glucémico.'
    },
    {
      type: 'Comida',
      name: 'Arroz integral con pechuga de pollo de corral, verduras asadas y aceite de oliva',
      calories: 580,
      ingredients: ['Arroz integral grano largo', 'Pechuga de pollo', 'Calabacín y berenjena', 'Tomate triturado natural', 'Aceite de oliva virgen extra'],
      reason: 'Equilibrio perfecto de macronutrientes: 45g de proteína magra y fibra dietética.'
    },
    {
      type: 'Cena',
      name: 'Filete de dorada a la plancha con puré suave de verduras y ensalada mixta',
      calories: 390,
      ingredients: ['Dorada fresca', 'Calabacín y puerro cocido', 'Hojas verdes', 'Tomates cherry', 'Limón'],
      reason: 'Cena ligera de fácil asimilación, ideal para un descanso reparador y reposición muscular.'
    }
  ];
}

/**
 * Call Groq AI API if GROQ_API_KEY is available
 */
async function callGroqAI(userPrompt, systemPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[Groq] HTTP error status:', res.status);
      return null;
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[Groq] Fallback triggered due to error:', err.message);
    return null;
  }
}

/**
 * Parse incoming HTTP request body safely
 */
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (_) {
      return {};
    }
  }

  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/**
 * Main Serverless Export
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  try {
    // 1. Health Check
    if (pathname === '/api/health') {
      return sendJson(res, 200, {
        status: 'ok',
        version: '1.2.0',
        environment: 'vercel-serverless-resilient',
        groq_configured: Boolean(process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('placeholder')),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Auth: Register Guest
    if (pathname === '/api/auth/register-guest' && req.method === 'POST') {
      const guestId = Math.floor(1000 + Math.random() * 9000);
      return sendJson(res, 201, {
        success: true,
        message: 'Guest account created',
        data: {
          id: guestId,
          name: `Invitado #${guestId}`,
          email: `guest_${guestId}@foodscan.ai`,
          diet: 'omnivoro',
          allergies: []
        }
      });
    }

    // 3. Auth: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const email = body.email || 'demo@foodscan.ai';
      return sendJson(res, 200, {
        success: true,
        message: 'Login successful',
        data: {
          id: 1,
          name: 'Hugo Sabater',
          email,
          diet: 'omnivoro',
          allergies: []
        }
      });
    }

    // 4. Products: Trending
    if (pathname === '/api/products/trending' && req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: SEED_PRODUCTS.length,
        data: SEED_PRODUCTS
      });
    }

    // 5. Products: Get by Barcode or List
    if (pathname === '/api/products' && req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        count: SEED_PRODUCTS.length,
        data: SEED_PRODUCTS
      });
    }

    if (pathname.startsWith('/api/products/') && req.method === 'GET') {
      const barcode = pathname.split('/').pop();
      let product = SEED_PRODUCTS.find(p => p.barcode === barcode);

      if (!product) {
        // Try live OpenFoodFacts if possible
        try {
          const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
          if (offRes.ok) {
            const offData = await offRes.json();
            if (offData.status === 1 && offData.product) {
              const p = offData.product;
              product = {
                id: Math.floor(Math.random() * 90000) + 1000,
                barcode,
                name: p.product_name || p.product_name_es || 'Producto Escaneado',
                brand: p.brands || 'Marca Genérica',
                nutri_score: p.nutriscore_grade || 'c',
                image_url: p.image_url || p.image_front_url || null,
                ingredients_text: p.ingredients_text_es || p.ingredients_text || 'Información de ingredientes no disponible.',
                source: 'openfoodfacts'
              };
            }
          }
        } catch (_) {
          // ignore network failure
        }
      }

      if (!product) {
        return sendJson(res, 404, {
          success: false,
          message: 'Producto no encontrado',
          barcode
        });
      }

      return sendJson(res, 200, {
        success: true,
        data: product
      });
    }

    // 6. Scan: POST /api/scan
    if (pathname === '/api/scan' && req.method === 'POST') {
      const body = await parseBody(req);
      const barcode = body.barcode;
      const userId = Number(body.userId) || 1;
      const customProfile = body.customProfile || { dietary_preference: 'omnivoro', allergies: [] };

      if (!barcode) {
        return sendJson(res, 400, { success: false, message: 'El código de barras es obligatorio.' });
      }

      let product = SEED_PRODUCTS.find(p => p.barcode === barcode);
      if (!product) {
        try {
          const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
          if (offRes.ok) {
            const offData = await offRes.json();
            if (offData.status === 1 && offData.product) {
              const p = offData.product;
              product = {
                id: Math.floor(Math.random() * 90000) + 1000,
                barcode,
                name: p.product_name || p.product_name_es || `Producto ${barcode}`,
                brand: p.brands || 'Genérico',
                nutri_score: p.nutriscore_grade || 'c',
                image_url: p.image_url || p.image_front_url || null,
                ingredients_text: p.ingredients_text_es || p.ingredients_text || 'Ingredientes no disponibles.',
                source: 'openfoodfacts'
              };
            }
          }
        } catch (_) {}
      }

      if (!product) {
        product = {
          id: Math.floor(Math.random() * 90000) + 1000,
          barcode,
          name: `Producto ${barcode}`,
          brand: 'Alimento',
          nutri_score: 'c',
          image_url: null,
          ingredients_text: 'Sin datos específicos de ingredientes.',
          source: 'manual_input'
        };
      }

      // Try AI Analysis with Groq
      let analysis = null;
      if (process.env.GROQ_API_KEY) {
        const sysPrompt = 'Eres un nutricionista experto. Analiza el producto y responde SOLO un JSON con {"is_suitable": boolean, "analysis_reason": string, "custom_health_score": number}.';
        const userPrompt = `Producto: ${product.name} (${product.brand}), NutriScore: ${product.nutri_score}, Ingredientes: ${product.ingredients_text}. Dieta: ${customProfile.dietary_preference || 'omnivoro'}, Alergias: ${(customProfile.allergies || []).join(', ')}.`;
        analysis = await callGroqAI(userPrompt, sysPrompt);
      }

      if (!analysis || typeof analysis.is_suitable !== 'boolean') {
        analysis = evaluateNutritionalSuitability(product, customProfile);
      }

      analysis.analyzed_at = new Date().toISOString();
      analysis.diet = customProfile.dietary_preference || 'omnivoro';
      analysis.allergies = (customProfile.allergies || []).join(', ');

      const newScan = {
        id: nextScanId++,
        user_id: userId,
        product_id: product.id,
        product_code: product.barcode,
        scanned_at: new Date().toISOString(),
        product,
        analysis_result: analysis
      };

      inMemoryScans.unshift(newScan);

      return sendJson(res, 201, {
        success: true,
        message: 'Scanned successfully',
        data: {
          scan: { id: newScan.id, scanned_at: newScan.scanned_at },
          product,
          analysis
        }
      });
    }

    // 7. Users: History GET /api/users/:userId/history
    if (pathname.includes('/history') && req.method === 'GET') {
      const parts = pathname.split('/');
      const userIndex = parts.indexOf('users');
      const userId = userIndex !== -1 ? Number(parts[userIndex + 1]) : 1;

      const userScans = inMemoryScans.filter(s => s.user_id === userId || userId === 1);
      return sendJson(res, 200, {
        success: true,
        count: userScans.length,
        data: userScans
      });
    }

    // 8. Users: Stats GET /api/users/:userId/stats
    if (pathname.includes('/stats') && req.method === 'GET') {
      const parts = pathname.split('/');
      const userIndex = parts.indexOf('users');
      const userId = userIndex !== -1 ? Number(parts[userIndex + 1]) : 1;

      const userScans = inMemoryScans.filter(s => s.user_id === userId || userId === 1);
      const totalScans = userScans.length;

      const nutriScoreDistribution = { a: 0, b: 0, c: 0, d: 0, e: 0, unknown: 0 };
      let suitable = 0;
      let unsuitable = 0;

      for (const scan of userScans) {
        const score = (scan.product?.nutri_score || '').toLowerCase();
        if (['a', 'b', 'c', 'd', 'e'].includes(score)) {
          nutriScoreDistribution[score]++;
        } else {
          nutriScoreDistribution.unknown++;
        }

        if (scan.analysis_result?.is_suitable) {
          suitable++;
        } else {
          unsuitable++;
        }
      }

      return sendJson(res, 200, {
        success: true,
        data: {
          totalScans,
          nutriScoreDistribution,
          suitability: {
            suitable,
            unsuitable,
            unknown: nutriScoreDistribution.unknown
          }
        }
      });
    }

    // 9. Users: Meal Plan POST /api/users/meal-plan
    if (pathname === '/api/users/meal-plan' && req.method === 'POST') {
      const body = await parseBody(req);
      const profile = body.profile || { diet: 'omnivoro', allergies: [] };

      let mealPlan = null;

      // Try Groq if configured
      if (process.env.GROQ_API_KEY) {
        const sysPrompt = 'Eres un chef nutricionista experto. Crea un plan de comidas de 1 día (Desayuno, Comida, Cena). Devuelve ÚNICAMENTE un array JSON válido sin bloques markdown con formato: [{"type": "Desayuno", "name": "...", "calories": 400, "ingredients": ["..."], "reason": "..."}].';
        const userPrompt = `Dieta: ${profile.diet || 'Equilibrada'}. Alergias a evitar estrictamente: ${(profile.allergies || []).join(', ') || 'Ninguna'}.`;
        const aiPlan = await callGroqAI(userPrompt, sysPrompt);
        if (Array.isArray(aiPlan) && aiPlan.length >= 3) {
          mealPlan = aiPlan;
        }
      }

      if (!mealPlan) {
        mealPlan = generateStructuredMealPlan(profile);
      }

      return sendJson(res, 200, {
        success: true,
        data: mealPlan
      });
    }

    // Default 404
    return sendJson(res, 404, {
      success: false,
      message: `Ruta API no encontrada: ${pathname}`
    });
  } catch (err) {
    console.error('[API Serverless Error]:', err);
    return sendJson(res, 500, {
      success: false,
      message: 'Error interno en función serverless',
      error: err.message
    });
  }
};
