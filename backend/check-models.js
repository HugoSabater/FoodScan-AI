/**
 * Check Gemini Models
 * Tests connectivity with various Gemini models using the current API Key
 */
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ ERROR: GEMINI_API_KEY no encontrada en .env');
        return;
    }

    console.log(`🔑 Probando API Key: ${apiKey.substring(0, 8)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-pro',
        'gemini-1.0-pro',
    ];

    console.log('\n🚀 Iniciando pruebas de conectividad...\n');

    for (const modelName of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hola');
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`✅ [${modelName}] FUNCIONANDO`);
            } else {
                console.log(`⚠️ [${modelName}] Respuesta vacía`);
            }
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('404')) {
                errorMessage = '404 Not Found (Modelo no disponible o nombre incorrecto)';
            } else if (errorMessage.includes('403')) {
                errorMessage = '403 Forbidden (API Key sin permisos)';
            }
            console.log(`❌ [${modelName}] FALLÓ: ${errorMessage}`);
        }
    }

    console.log('\n🏁 Pruebas finalizadas.');
}

checkModels();
