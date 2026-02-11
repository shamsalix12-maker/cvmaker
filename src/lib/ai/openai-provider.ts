// ============================================
// [F067] src/lib/ai/openai-provider.ts
// ============================================

import OpenAI from 'openai';
import { BaseAIProvider, AIProviderConfig, AICompletionOptions, AIValidationResult } from './ai-provider';
import { AIProviderName, AIModel } from '@/lib/types';

export class OpenAIProvider extends BaseAIProvider {
    readonly providerName: AIProviderName = 'openai';

    private createClient(apiKey: string): OpenAI {
        return new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true, // Allow client-side usage if needed, though server-side is preferred
        });
    }

    async validateKey(apiKey: string): Promise<AIValidationResult> {
        try {
            const client = this.createClient(apiKey);
            const models = await client.models.list();

            const availableModels: AIModel[] = models.data
                .filter(m => m.id.includes('gpt'))
                .map(m => ({
                    model_id: m.id,
                    model_name: m.id,
                    provider: 'openai' as AIProviderName,
                    supports_streaming: true,
                }));

            return {
                valid: true,
                models: availableModels
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
        return result.models || [];
    }

    async complete(config: AIProviderConfig, options: AICompletionOptions): Promise<string> {
        const client = this.createClient(config.apiKey);

        const response = await client.chat.completions.create({
            model: options.model,
            messages: options.messages.map(m => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content
            })),
            temperature: options.temperature ?? config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            response_format: options.jsonMode ? { type: 'json_object' } : undefined
        });

        return response.choices[0]?.message?.content || '';
    }

    async streamComplete(
        config: AIProviderConfig,
        options: AICompletionOptions,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const client = this.createClient(config.apiKey);

        const stream = await client.chat.completions.create({
            model: options.model,
            messages: options.messages.map(m => ({
                role: m.role as 'system' | 'user' | 'assistant',
                content: m.content
            })),
            temperature: options.temperature ?? config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            stream: true,
            response_format: options.jsonMode ? { type: 'json_object' } : undefined
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            onChunk(content);
        }

        return fullResponse;
    }
}
