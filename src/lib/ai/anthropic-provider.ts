// ============================================
// [F068] src/lib/ai/anthropic-provider.ts
// ============================================

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, AIProviderConfig, AICompletionOptions, AIValidationResult } from './ai-provider';
import { AIProviderName, AIModel } from '@/lib/types';

export class AnthropicProvider extends BaseAIProvider {
    readonly providerName: AIProviderName = 'anthropic';

    // Known Claude models (Anthropic doesn't have a models list API)
    private readonly KNOWN_MODELS: AIModel[] = [
        { model_id: 'claude-3-5-sonnet-20241022', model_name: 'Claude 3.5 Sonnet', provider: 'anthropic', supports_streaming: true },
        { model_id: 'claude-3-5-haiku-20241022', model_name: 'Claude 3.5 Haiku', provider: 'anthropic', supports_streaming: true },
        { model_id: 'claude-3-opus-20240229', model_name: 'Claude 3 Opus', provider: 'anthropic', supports_streaming: true },
        { model_id: 'claude-3-sonnet-20240229', model_name: 'Claude 3 Sonnet', provider: 'anthropic', supports_streaming: true },
        { model_id: 'claude-3-haiku-20240307', model_name: 'Claude 3 Haiku', provider: 'anthropic', supports_streaming: true },
    ];

    private createClient(apiKey: string): Anthropic {
        return new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true,
        });
    }

    async validateKey(apiKey: string): Promise<AIValidationResult> {
        try {
            const client = this.createClient(apiKey);

            // Make a minimal API call to verify the key
            await client.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            });

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

        // Extract system message if present
        const systemMsg = options.messages.find(m => m.role === 'system');
        const otherMsgs = options.messages.filter(m => m.role !== 'system');

        const response = await client.messages.create({
            model: options.model,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            system: systemMsg?.content,
            messages: otherMsgs.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            temperature: options.temperature ?? config.temperature ?? 0.7,
        });

        // Extract text from response
        const textBlock = response.content.find(c => c.type === 'text');
        return textBlock?.text || '';
    }

    async streamComplete(
        config: AIProviderConfig,
        options: AICompletionOptions,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const client = this.createClient(config.apiKey);

        const systemMsg = options.messages.find(m => m.role === 'system');
        const otherMsgs = options.messages.filter(m => m.role !== 'system');

        const stream = await client.messages.stream({
            model: options.model,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            system: systemMsg?.content,
            messages: otherMsgs.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            temperature: options.temperature ?? config.temperature ?? 0.7,
        });

        let fullResponse = '';
        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const text = event.delta.text;
                fullResponse += text;
                onChunk(text);
            }
        }

        return fullResponse;
    }
}
