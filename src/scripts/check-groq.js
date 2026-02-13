require('dotenv').config();
const Groq = require('groq-sdk');

console.log('Initializing Groq...');
try {
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY || 'dummy_key', // Avoid crash if missing, just test init
    });
    console.log('Groq initialized successfully.');
} catch (error) {
    console.error('Groq initialization failed:', error);
}
