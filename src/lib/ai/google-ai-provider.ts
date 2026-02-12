// ============================================
// [F069] src/lib/ai/google-ai-provider.ts
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider, AIProviderConfig, AICompletionOptions, AIValidationResult } from './ai-provider';
import { AIProviderName, AIModel } from '@/lib/types';

export class GoogleAIProvider extends BaseAIProvider {
    readonly providerName: AIProviderName = 'google';

    private readonly KNOWN_MODELS: AIModel[] = [
        { model_id: 'gemini-1.5-flash', model_name: 'Gemini 1.5 Flash (Stable)', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-1.5-pro', model_name: 'Gemini 1.5 Pro (Stable)', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-2.0-flash', model_name: 'Gemini 2.0 Flash (Next-Gen)', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-2.0-flash-lite', model_name: 'Gemini 2.0 Flash Lite', provider: 'google', supports_streaming: true },
    ];

    private createClient(apiKey: string): GoogleGenerativeAI {
        return new GoogleGenerativeAI(apiKey);
    }

    async validateKey(apiKey: string): Promise<AIValidationResult> {
        try {
            const client = this.createClient(apiKey);
            // Use gemini-1.5-flash for validation
            const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Make a minimal API call to verify
            await model.generateContent('Hi');

            return {
                valid: true,
                models: this.KNOWN_MODELS
            };
        } catch (error: any) {
            return {
                valid: false,
                error: error.message || 'Invalid API key'
            };
        }
    }

    async getModels(apiKey: string): Promise<AIModel[]> {
        const result = await this.validateKey(apiKey);
        return result.valid ? this.KNOWN_MODELS : [];
    }

    async complete(config: AIProviderConfig, options: AICompletionOptions): Promise<string> {
        const client = this.createClient(config.apiKey);
        const model = client.getGenerativeModel({
            model: options.model,
            systemInstruction: options.messages.find(m => m.role === 'system')?.content,
        });

        const userMessages = options.messages.filter(m => m.role !== 'system');

        const result = await model.generateContent({
            contents: userMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            generationConfig: {
                temperature: options.temperature ?? config.temperature ?? 0.1,
                maxOutputTokens: options.maxTokens ?? config.maxTokens ?? 4096,
                responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            }
        });

        return result.response.text();
    }

    async streamComplete(
        config: AIProviderConfig,
        options: AICompletionOptions,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const client = this.createClient(config.apiKey);
        const model = client.getGenerativeModel({
            model: options.model,
            systemInstruction: options.messages.find(m => m.role === 'system')?.content,
        });

        const userMessages = options.messages.filter(m => m.role !== 'system');

        const result = await model.generateContentStream({
            contents: userMessages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            generationConfig: {
                temperature: options.temperature ?? config.temperature ?? 0.1,
                maxOutputTokens: options.maxTokens ?? config.maxTokens ?? 4096,
                responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            }
        });

        let fullResponse = '';
        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            onChunk(text);
        }

        return fullResponse;
    }
}
