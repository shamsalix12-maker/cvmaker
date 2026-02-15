
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testNewKey() {
    const apiKey = 'AIzaSyBbJi-yvZ0wUR1_Td9DGZPXUSIhTOya96U';
    const genAI = new GoogleGenerativeAI(apiKey);

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash'];

    for (const modelId of models) {
        console.log(`\nTesting model: ${modelId}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent('Say "OK"');
            const text = result.response.text();
            console.log(`✅ ${modelId} Response: ${text.trim()}`);
        } catch (error: any) {
            console.error(`❌ ${modelId} Failed:`, error.message);
        }
    }
}

testNewKey();
