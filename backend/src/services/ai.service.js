/**
 * AI Service
 * Integrates with Groq (LLaMA 3 70B) for health analysis.
 *
 * Key design decisions (TFG):
 *   - temperature: 0  → deterministic output; same product + same profile = same score every time.
 *   - top_p: 1        → no nucleus sampling restriction (standard with temp=0).
 *   - Hard scoring rule in system prompt: is_not_safe → score MUST be 0.
 */

const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Eres un nutricionista digital experto que analiza la idoneidad de productos alimentarios.

Devuelve SOLO un JSON válido con este formato exacto, sin bloques de código ni texto adicional:
{
  "is_suitable": boolean,
  "analysis_reason": "Explicación breve de 1 frase",
  "custom_health_score": number (0-100)
}

REGLAS DE ANÁLISIS:
- Si el usuario es vegano y el producto contiene ingredientes de origen animal (leche, huevos, miel, carne, pescado, gelatina), is_suitable es false.
- Si el usuario es keto y el producto tiene alto contenido en carbohidratos o azúcares, is_suitable es false.
- Si el producto contiene CUALQUIER alérgeno del usuario, is_suitable DEBE ser false.
- Sé estricto con las alergias: la seguridad del usuario es la máxima prioridad.

REGLAS DE PUNTUACIÓN (custom_health_score) — OBLIGATORIAS:
- Si el producto contiene un alérgeno del usuario O incumple su dieta declarada,
  el score DEBE ser estrictamente 0 y is_suitable DEBE ser false.
  No hay excepciones a esta regla.
- Solo puedes asignar un score mayor a 0 si el producto es 100% apto para el perfil del usuario.
- Para productos aptos, basa el score en: NutriScore (A=alta, E=baja calidad), grado de procesado,
  aditivos y equilibrio nutricional general.

Responde ÚNICAMENTE con el JSON. Sin markdown, sin explicaciones, sin bloques de código.`;

/**
 * Analyze product health based on user profile.
 *
 * Called ONLY when no cached analysis exists for this (barcode, profile_hash).
 * The caller (scan.controller) is responsible for the cache lookup / write.
 *
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
- Preferencia dietética: ${userProfile.dietary_preference || userProfile.diet || 'none'}
- Alergias: ${userProfile.allergies?.length > 0 ? userProfile.allergies.join(', ') : 'Ninguna'}

Analiza si este producto es adecuado para este usuario. Responde SOLO con JSON.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0, // Fully deterministic — no randomness
      top_p: 1, // Standard with temperature=0
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    // Clean markdown code blocks if present (belt-and-suspenders)
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

    // Enforce hard scoring rule in case the model still violates it
    let score = Math.min(100, Math.max(0, analysis.custom_health_score));
    if (!analysis.is_suitable && score > 0) {
      console.warn('[AI] Model returned score > 0 for unsuitable product — forcing to 0.');
      score = 0;
    }

    return {
      is_suitable: analysis.is_suitable,
      analysis_reason: analysis.analysis_reason,
      custom_health_score: score,
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
 * Generate a 1-day meal plan based on user profile.
 * (temperature kept at 0.7 for creative variety — inconsistency here is acceptable)
 *
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
      top_p: 1,
      max_tokens: 1000,
      // Note: We don't use response_format: { type: 'json_object' } because we want an Array
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from Groq');
    }

    const jsonString = responseContent.replace(/```json|```/g, '').trim();
    const mealPlan = JSON.parse(jsonString);

    if (!Array.isArray(mealPlan)) {
      throw new Error('AI response is not an array');
    }

    return mealPlan;
  } catch (error) {
    console.error('❌ ERROR REAL GROQ (Meal Plan):', error);
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
