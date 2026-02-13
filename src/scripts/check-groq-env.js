require('dotenv').config();
const Groq = require('groq-sdk');

console.log('Initializing Groq with env key...');
try {
    // Use env var directly. If missing, it will use whatever default behavior Groq has.
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });
    console.log('Groq initialized successfully.');
} catch (error) {
    console.error('Groq initialization failed:', error.message);
}
