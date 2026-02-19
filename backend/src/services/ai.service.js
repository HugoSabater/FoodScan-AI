/**
 * AI Service
 * Integrates with Groq (LLaMA 3 70B) for health analysis
 */

const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Eres un nutricionista experto. Analiza los ingredientes del producto basándote estrictamente en el perfil del usuario (alergias y tipo de dieta).

Devuelve SOLO un JSON válido con este formato exacto, sin bloques de código ni texto adicional:
{
  "is_suitable": boolean,
  "analysis_reason": "Explicación breve de 1 frase",
  "custom_health_score": number (0-100)
}

Reglas estrictas:
- Si el usuario es vegano y el producto contiene ingredientes de origen animal (leche, huevos, miel, carne, pescado, gelatina), is_suitable es false.
- Si el usuario es keto y el producto tiene alto contenido en carbohidratos o azúcares, is_suitable es false.
- Si el producto contiene CUALQUIER alergia del usuario, is_suitable es false y custom_health_score debe ser 0.
- El health_score debe reflejar la calidad nutricional general (nutri-score, ingredientes procesados, aditivos).
- Sé estricto con las alergias: la seguridad es prioritaria.

Responde ÚNICAMENTE con el JSON. Sin markdown, sin explicaciones, sin bloques de código.`;

/**
 * Analyze product health based on user profile
 * @param {Object} productData - Product information
 * @param {Object} userProfile - User allergies and dietary preferences
 * @returns {Promise<Object>} AI analysis result
 */
const analyzeHealth = async (productData, userProfile) => {
  // eslint-disable-next-line no-console
  console.log('🤖 Consultando a Groq (LLaMA 3) con:', productData.name);

  try {
    const userPrompt = `
Producto:
- Nombre: ${productData.name}
- Marca: ${productData.brand || 'Desconocida'}
- Ingredientes: ${productData.ingredients_text || 'No disponibles'}
- NutriScore: ${productData.nutri_score || 'No disponible'}

Perfil del Usuario:
- Preferencia dietética: ${userProfile.dietary_preference || 'none'}
- Alergias: ${userProfile.allergies?.length > 0 ? userProfile.allergies.join(', ') : 'Ninguna'}

Analiza si este producto es adecuado para este usuario. Responde SOLO con JSON.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    // Clean markdown code blocks if present
    const jsonString = responseContent.replace(/```json|```/g, '').trim();

    // Parse JSON response
    const analysis = JSON.parse(jsonString);

    // Validate response structure
    if (
      typeof analysis.is_suitable !== 'boolean' ||
      typeof analysis.analysis_reason !== 'string' ||
      typeof analysis.custom_health_score !== 'number'
    ) {
      throw new Error(`Invalid AI response structure: ${jsonString}`);
    }

    return {
      is_suitable: analysis.is_suitable,
      analysis_reason: analysis.analysis_reason,
      custom_health_score: Math.min(100, Math.max(0, analysis.custom_health_score)),
      ai_model: 'llama-3.3-70b-versatile',
      analyzed_at: new Date().toISOString(),
    };
  } catch (error) {
    // CRITICAL: Show the real error for debugging
    console.error('❌ ERROR REAL GROQ:', error);

    // Return fallback analysis when AI is unavailable
    return {
      is_suitable: true,
      analysis_reason: 'Análisis automático no disponible. Revisa los ingredientes manualmente.',
      custom_health_score: 50,
      ai_model: 'fallback',
      analyzed_at: new Date().toISOString(),
      error: 'AI analysis unavailable',
    };
  }
};

/**
 * Generate a 1-day meal plan based on user profile
 * @param {Object} profile - User allergies and dietary preferences
 * @returns {Promise<Array>} Meal plan
 */
const generateMealPlan = async profile => {
  // eslint-disable-next-line no-console
  console.log('🤖 Generando plan de comidas para dieta:', profile.diet);

  try {
    const userPrompt = `Eres un chef nutricionista experto. Crea un plan de comidas de 1 día (Desayuno, Comida, Cena) estrictamente basado en este perfil:

Dieta: ${profile.diet || 'Equilibrada'}
Alergias: ${profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'Ninguna'}

Salida OBLIGATORIA en formato JSON Array:
[
  { "type": "Desayuno", "name": "Nombre del plato", "calories": 400, "ingredients": ["ing1", "ing2"], "reason": "Por qué encaja con la dieta" },
  { "type": "Comida", ... },
  { "type": "Cena", ... }
]
No uses Markdown, solo JSON puro.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
      // Note: We don't use response_format: { type: 'json_object' } because we want an Array, not an Object
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    // Clean markdown code blocks if present
    const jsonString = responseContent.replace(/```json|```/g, '').trim();

    // Parse JSON
    const mealPlan = JSON.parse(jsonString);

    if (!Array.isArray(mealPlan)) {
      throw new Error('AI response is not an array');
    }

    return mealPlan;
  } catch (error) {
    console.error('❌ ERROR REAL GROQ (Meal Plan):', error);
    // Fallback data
    return [
      {
        type: 'Desayuno',
        name: 'Avena con frutas (Fallback)',
        calories: 350,
        ingredients: ['Avena', 'Plátano', 'Leche semidesnatada'],
        reason: 'Opción equilibrada por defecto',
      },
      {
        type: 'Comida',
        name: 'Pollo a la plancha con ensalada (Fallback)',
        calories: 500,
        ingredients: ['Pechuga de pollo', 'Lechuga', 'Tomate', 'Aceite de oliva'],
        reason: 'Alto en proteínas y vegetales',
      },
      {
        type: 'Cena',
        name: 'Pescado al horno con verduras (Fallback)',
        calories: 400,
        ingredients: ['Merluza', 'Calabacín', 'Zanahoria'],
        reason: 'Ligero y nutritivo',
      },
    ];
  }
};

module.exports = {
  analyzeHealth,
  generateMealPlan,
};
