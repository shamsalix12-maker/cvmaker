
const { GroqProvider } = require('./src/lib/ai/groq-provider');
const dotenv = require('dotenv');
const path = require('path');

// Mock a few things to make it run in node without full TS setup if needed
// Actually npx tsx should handle it, but let's fix the import.

async function testGroq() {
    dotenv.config({ path: '.env.local' });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('GROQ_API_KEY not found in .env.local');
        return;
    }

    // We need to handle the fact that GroqProvider might depend on other TS files
    // tsx handles this, but the previous error was MODULE_NOT_FOUND.
    // It's likely because I used ./src/... and the compiler had issues.

    try {
        const { GroqProvider } = await import('./src/lib/ai/groq-provider');
        const provider = new GroqProvider();
        console.log('Testing Groq with Llama-3.3-70b...');

        const response = await provider.complete(
            { apiKey },
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that returns JSON.' },
                    { role: 'user', content: 'Return a JSON object with a key "message" and value "hello groq".' },
                ],
                jsonMode: true,
            }
        );

        console.log('Raw Response:', response);
        const parsed = provider.parseJsonResponse(response);
        console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.error('Test Error:', e);
    }
}

testGroq();
