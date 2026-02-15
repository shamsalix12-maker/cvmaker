// ============================================
// [F069] src/lib/ai/google-ai-provider.ts
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider, AIProviderConfig, AICompletionOptions, AIValidationResult } from './ai-provider';
import { AIProviderName, AIModel } from '@/lib/types';

export class GoogleAIProvider extends BaseAIProvider {
    readonly providerName: AIProviderName = 'google';

    private readonly KNOWN_MODELS: AIModel[] = [
        { model_id: 'gemini-3-flash', model_name: 'Gemini 3 Flash', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-2.5-flash', model_name: 'Gemini 2.5 Flash', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-2.0-flash', model_name: 'Gemini 2.0 Flash', provider: 'google', supports_streaming: true },
        { model_id: 'gemini-1.5-flash', model_name: 'Gemini 1.5 Flash', provider: 'google', supports_streaming: true },
    ];

    private createClient(apiKey: string): GoogleGenerativeAI {
        return new GoogleGenerativeAI(apiKey);
    }

    async validateKey(apiKey: string): Promise<AIValidationResult> {
        // MOCK CHECK
        if (apiKey === 'TEST_KEY_MOCK') {
            return {
                valid: true,
                models: this.KNOWN_MODELS
            };
        }

        try {
            const client = this.createClient(apiKey);
            // Use gemini-2.5-flash for validation
            const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
        console.log('[GoogleAI] complete() called', {
            model: options.model,
            hasApiKey: !!config.apiKey,
            apiKeyPrefix: config.apiKey?.substring(0, 10) + '...',
            jsonMode: options.jsonMode,
            messageCount: options.messages?.length
        });

        if (config.apiKey === 'TEST_KEY_MOCK') {
            console.log('[GoogleAI] Using MOCK response for testing');
            await new Promise(resolve => setTimeout(resolve, 1000));

            return JSON.stringify({
                personal_info: {
                    full_name: "Karim Shamsasenjan",
                    email: "k.sh.asenajn@gmail.com",
                    phone: "+636506660575",
                    location: "6/2 Machstarsse 8-10 1020 Vienna",
                    linkedin_url: "https://www.linkedin.com/in/karim-shamsasenjan-5256406/",
                    summary: "Associated Professor in Biochemistry and Clinical Laboratory with extensive experience in blood transfusion, stem cell biology, and quality management."
                },
                work_experience: [
                    {
                        job_title: "Head of Biochemistry and clinical laboratory Dep.",
                        company: "Tabriz University of Medical Science",
                        start_date: "2022",
                        is_current: true,
                        description: "Leading the department and overseeing clinical laboratory operations."
                    }
                ],
                education: [
                    {
                        degree: "Ph.D. Bio-Signal Analysis",
                        institution: "Yamaguchi University, Japan",
                        end_date: "2009-03",
                        field_of_study: "Bio-Signal Analysis"
                    }
                ],
                skills: ["Transfusion Medicine", "Stem Cell Biology", "GMP", "Clinical Laboratory", "Quality Assurance"],
                confidence: 95,
                notes: "Mock extraction successful."
            });
        }

        try {
            const client = this.createClient(config.apiKey);
            const systemInstruction = options.messages.find(m => m.role === 'system')?.content;
            const model = client.getGenerativeModel({
                model: options.model,
                systemInstruction,
            });

            console.log('[GoogleAI] Model created, system instruction length:', systemInstruction?.length || 0);

            const userMessages = options.messages.filter(m => m.role !== 'system');
            console.log('[GoogleAI] User messages count:', userMessages.length);

            // Honor passed maxTokens, default to reasonable value for Gemini if not provided
            const maxTokens = options.maxTokens ?? config.maxTokens ?? 32768;
            console.log('[GoogleAI] maxTokens set to:', maxTokens);

            const safetySettings = [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            ];

            const result = await model.generateContent({
                contents: userMessages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                })),
                generationConfig: {
                    temperature: options.temperature ?? config.temperature ?? 0.1,
                    maxOutputTokens: maxTokens,
                    responseMimeType: options.jsonMode ? "application/json" : "text/plain",
                },
                safetySettings: safetySettings as any,
            });

            const responseText = result.response.text();
            const finishReason = result.response.candidates?.[0]?.finishReason;

            console.log('[GoogleAI] Response received:', {
                length: responseText.length,
                finishReason,
                promptTokens: result.response.usageMetadata?.promptTokenCount,
                completionTokens: result.response.usageMetadata?.candidatesTokenCount
            });

            if (finishReason && finishReason !== 'STOP') {
                console.warn('[GoogleAI] Non-STOP finish reason:', finishReason);
                console.warn('[GoogleAI] Response may be incomplete!');
            }

            console.log('[GoogleAI] Response preview:', responseText.substring(0, 300));

            return responseText;
        } catch (error: any) {
            console.error('[GoogleAI] Error in complete():', error);
            throw error;
        }
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
