
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testQuotaModels() {
    const apiKey = 'AIzaSyBbJi-yvZ0wUR1_Td9DGZPXUSIhTOya96U';
    const genAI = new GoogleGenerativeAI(apiKey);

    // Test models that might have better quotas
    const models = [
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash-8b'
    ];

    for (const modelId of models) {
        console.log(`\nTesting: ${modelId}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent('Say "Ready"');
            console.log(`✅ ${modelId}: ${result.response.text().trim()}`);
        } catch (error: any) {
            console.log(`❌ ${modelId}: ${error.message.substring(0, 150)}...`);
        }
    }
}

testQuotaModels();
