import { GoogleGenerativeAI } from '@google/generative-ai';

async function list() {
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    if (!apiKey) {
        console.error('No API key');
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There is no direct listModels in the main SDK class usually, 
        // it's often done via the v1 endpoint directly or not exposed in this simplified SDK.
        // But let's try a simple generate with a known name.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-flash!");
    } catch (e: any) {
        console.error("Failed with gemini-1.5-flash:", e.message);
        // Try gemini-pro
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("test");
            console.log("Success with gemini-pro!");
        } catch (e2: any) {
            console.error("Failed with gemini-pro:", e2.message);
        }
    }
}
list();
