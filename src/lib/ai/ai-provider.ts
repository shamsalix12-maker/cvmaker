// ============================================
// [F066] src/lib/ai/ai-provider.ts
// Abstract AI Provider Interface
// ============================================

import { AIProviderName, AIModel, AIChatMessage } from '@/lib/types';

export interface AIProviderConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface AIValidationResult {
    valid: boolean;
    error?: string;
    models?: AIModel[];
    balance?: string | null;
}

export interface AICompletionOptions {
    model: string;
    messages: AIChatMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;  // Request JSON output
}

export interface AIProvider {
    readonly providerName: AIProviderName;

    // Validate API key and get available models
    validateKey(apiKey: string): Promise<AIValidationResult>;

    // Get list of available models
    getModels(apiKey: string): Promise<AIModel[]>;

    // Simple completion (non-streaming)
    complete(config: AIProviderConfig, options: AICompletionOptions): Promise<string>;

    // Streaming completion
    streamComplete(
        config: AIProviderConfig,
        options: AICompletionOptions,
        onChunk: (chunk: string) => void
    ): Promise<string>;

    // Parse JSON response (with error handling)
    parseJsonResponse<T>(response: string): T | null;
}

// Base class with common functionality
export abstract class BaseAIProvider implements AIProvider {
    abstract readonly providerName: AIProviderName;

    abstract validateKey(apiKey: string): Promise<AIValidationResult>;
    abstract getModels(apiKey: string): Promise<AIModel[]>;
    abstract complete(config: AIProviderConfig, options: AICompletionOptions): Promise<string>;
    abstract streamComplete(
        config: AIProviderConfig,
        options: AICompletionOptions,
        onChunk: (chunk: string) => void
    ): Promise<string>;

    parseJsonResponse<T>(response: string): T | null {
        try {
            // Try to extract JSON from response
            // Handle cases where AI wraps JSON in markdown code blocks
            let jsonStr = response;

            // Remove markdown code blocks if present
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }

            return JSON.parse(jsonStr) as T;
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
            return null;
        }
    }
}
