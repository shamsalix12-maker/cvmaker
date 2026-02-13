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
            // First try direct JSON.parse for clean responses
            try {
                return JSON.parse(response) as T;
            } catch {
                // Ignore and continue to extraction logic
            }

            // Extract JSON string
            let jsonStr = response;

            // 1. Try to find markdown code blocks first (standard AI behavior)
            const markdownMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownMatch) {
                jsonStr = markdownMatch[1];
            } else {
                // 2. No code blocks - try to find the outermost object or array
                const startObject = response.indexOf('{');
                const endObject = response.lastIndexOf('}');
                const startArray = response.indexOf('[');
                const endArray = response.lastIndexOf(']');

                // Heuristic: pick the outermost structure
                let start = -1;
                let end = -1;

                if (startObject !== -1 && endObject !== -1) {
                    if (startArray === -1 || startObject < startArray) {
                        start = startObject;
                        end = endObject;
                    } else {
                        start = startArray;
                        end = endArray;
                    }
                } else if (startArray !== -1 && endArray !== -1) {
                    start = startArray;
                    end = endArray;
                }

                if (start !== -1 && end !== -1 && end > start) {
                    jsonStr = response.substring(start, end + 1);
                }
            }

            // 3. Try to repair common JSON issues
            jsonStr = this.repairJson(jsonStr);

            return JSON.parse(jsonStr) as T;
        } catch (e) {
            console.error('[BaseAIProvider] Failed to parse JSON response:', e);
            console.error('[BaseAIProvider] Raw response head:', response.substring(0, 500));
            return null;
        }
    }

    /**
     * Attempt to repair common JSON issues from AI responses
     */
    private repairJson(jsonStr: string): string {
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unescaped quotes in string values (basic attempt)
        // This is a simple heuristic - look for patterns like "text with "quotes" inside"
        
        // Fix missing quotes around property names (rare but happens)
        // jsonStr = jsonStr.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        // Remove control characters except newline and tab
        jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        
        // Fix multiple consecutive commas
        jsonStr = jsonStr.replace(/,+/g, ',');
        
        // Fix missing closing brackets - count open vs close
        const openBraces = (jsonStr.match(/{/g) || []).length;
        const closeBraces = (jsonStr.match(/}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/]/g) || []).length;
        
        // Add missing closing brackets
        for (let i = 0; i < openBraces - closeBraces; i++) {
            jsonStr += '}';
        }
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
            jsonStr += ']';
        }
        
        return jsonStr;
    }
}
