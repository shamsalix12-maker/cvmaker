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
        if (!response) return null;

        let jsonStr = response.trim();

        // Remove markdown code blocks if present
        const mdMatch = jsonStr.match(
            /```(?:json)?\s*([\s\S]*?)\s*```/
        );
        if (mdMatch) {
            jsonStr = mdMatch[1].trim();
        }

        // Try direct parse first
        try {
            return JSON.parse(jsonStr) as T;
        } catch (e) {
            // If failed, try to extract JSON object
            console.warn(
                '[BaseAIProvider] Direct parse failed, ' +
                'attempting extraction...'
            );
        }

        // Find the main JSON object boundaries
        const firstBrace = jsonStr.indexOf('{');
        if (firstBrace === -1) {
            console.error(
                '[BaseAIProvider] No JSON object found'
            );
            return null;
        }

        // Find matching closing brace by counting
        let depth = 0;
        let inString = false;
        let escaped = false;
        let endPos = -1;

        for (let i = firstBrace; i < jsonStr.length; i++) {
            const char = jsonStr[i];

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\' && inString) {
                escaped = true;
                continue;
            }

            if (char === '"') {
                inString = !inString;
                continue;
            }

            if (inString) continue;

            if (char === '{') depth++;
            if (char === '}') {
                depth--;
                if (depth === 0) {
                    endPos = i;
                    break;
                }
            }
        }

        if (endPos === -1) {
            console.error(
                '[BaseAIProvider] Could not find matching ' +
                'closing brace'
            );
            return null;
        }

        // Extract only the JSON portion
        const cleanJson = jsonStr.substring(
            firstBrace, endPos + 1
        );

        try {
            const result = JSON.parse(cleanJson) as T;
            console.log(
                '[BaseAIProvider] Successfully parsed after ' +
                'extraction. Removed',
                jsonStr.length - cleanJson.length,
                'extra characters'
            );
            return result;
        } catch (e2) {
            console.error(
                '[BaseAIProvider] Extraction parse also failed:',
                (e2 as Error).message
            );
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
