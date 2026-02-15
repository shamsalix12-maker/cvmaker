
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
    const apiKey = 'AIzaSyBbJi-yvZ0wUR1_Td9DGZPXUSIhTOya96U';
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('Listing available models for key: AIzaSy...96U');
        // We can't use genAI.listModels directly if it's not exposed nicely in the v1beta SDK 
        // usually it's genAI.getGenerativeModel({model: '...'}) 
        // But we can try to use the REST API if needed.
        // Actually, let's try a different approach: check gemini-1.5-pro or other variants.

        const variants = [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-002',
            'gemini-1.5-flash-8b',
            'gemini-1.0-pro'
        ];

        for (const m of variants) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent('Hi');
                console.log(`✅ ${m} is working!`);
            } catch (e: any) {
                console.log(`❌ ${m}: ${e.message.substring(0, 100)}`);
            }
        }
    } catch (err: any) {
        console.error('Error listing models:', err.message);
    }
}

listModels();
