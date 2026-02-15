import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import { AIProviderName } from '@/lib/types';
import {
    FieldAudit,
    GapGuidance,
    GapGuidanceSchema
} from './types';
import {
    buildGapIntelligenceSystemPrompt,
    buildGapIntelligenceUserPrompt
} from './prompts';

export interface GapResult {
    success: boolean;
    guidance: GapGuidance | null;
    error?: string;
    rawResponse?: string;
}

export class GapGenerator {
    constructor(
        private providerName: AIProviderName,
        private model: string,
        private apiKey: string
    ) { }

    async generate(audit: FieldAudit, domainRules: string): Promise<GapResult> {
        console.log(`[GapGenerator] Starting gap generation for CV ${audit.cv_id}`);

        try {
            const provider = getAIProvider(this.providerName);

            const config: AIProviderConfig = {
                apiKey: this.apiKey,
                temperature: 0,
                maxTokens: 8192,
            };

            const options: AICompletionOptions = {
                model: this.model,
                messages: [
                    {
                        id: 'sys-gap',
                        role: 'system',
                        content: buildGapIntelligenceSystemPrompt(),
                        timestamp: new Date().toISOString(),
                    },
                    {
                        id: 'usr-gap',
                        role: 'user',
                        content: buildGapIntelligenceUserPrompt(JSON.stringify(audit, null, 2), domainRules),
                        timestamp: new Date().toISOString(),
                    },
                ],
                jsonMode: true,
            };

            const response = await provider.complete(config, options);
            if (!response) {
                throw new Error('AI provider returned empty response');
            }

            // Try to parse and validate
            let parsedData: any;
            try {
                parsedData = provider.parseJsonResponse(response);
            } catch (e) {
                console.error('[GapGenerator] JSON Parse failed:', e);
                console.log('[GapGenerator] Faulty raw response:', response);
                return {
                    success: false,
                    guidance: null,
                    error: 'Failed to parse AI response as JSON',
                    rawResponse: response,
                };
            }

            console.log('[GapGenerator] JSON Parsed successfully. Item count:', parsedData.items?.length);

            // Ensure basic structure for Zod
            let items = [];
            if (Array.isArray(parsedData)) {
                items = parsedData;
            } else if (parsedData && Array.isArray(parsedData.items)) {
                items = parsedData.items;
            } else if (parsedData && parsedData.field && parsedData.guidance_text) {
                // It returned a single object instead of a list
                items = [parsedData];
            }

            const normalizedData = {
                cv_id: audit.cv_id,
                items: items
                    .filter((item: any) => {
                        const field = String(item.field || '').toLowerCase();
                        return !field.includes('user_id') && !field.includes('cv_id') && !field.includes('metadata');
                    })
                    .map((item: any) => ({
                        ...item,
                        example: typeof item.example === 'string' ? item.example : JSON.stringify(item.example || ''),
                        skip_allowed: item.skip_allowed ?? true,
                    })),
            };

            // Validate with Zod
            const validation = GapGuidanceSchema.safeParse(normalizedData);

            if (!validation.success) {
                console.error('[GapGenerator] Zod Validation failed:', validation.error.format());
                return {
                    success: false,
                    guidance: null,
                    error: `Schema validation failed: ${JSON.stringify(validation.error.format())}`,
                    rawResponse: response,
                };
            }

            return {
                success: true,
                guidance: validation.data,
                rawResponse: response,
            };

        } catch (error: any) {
            console.error('[GapGenerator] Gap generation error:', error);
            return {
                success: false,
                guidance: null,
                error: error.message,
                rawResponse: '',
            };
        }
    }
}
