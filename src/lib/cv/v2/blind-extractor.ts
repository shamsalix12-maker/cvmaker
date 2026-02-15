import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import { AIProviderName } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
    CanonicalCV,
    CanonicalCVSchema
} from './types';
import {
    buildBlindExtractionSystemPrompt,
    buildBlindExtractionUserPrompt
} from './prompts';

export interface BlindExtractionResult {
    success: boolean;
    cv: CanonicalCV | null;
    error?: string;
    rawResponse?: string;
}

export class BlindExtractor {
    constructor(
        private providerName: AIProviderName,
        private model: string,
        private apiKey: string
    ) { }

    async extract(rawText: string): Promise<BlindExtractionResult> {
        console.log(`[BlindExtractor] Starting extraction with ${this.providerName}/${this.model}`);

        try {
            const provider = getAIProvider(this.providerName);

            const config: AIProviderConfig = {
                apiKey: this.apiKey,
                temperature: 0,
                maxTokens: 16384,
            };

            const options: AICompletionOptions = {
                model: this.model,
                messages: [
                    {
                        id: 'sys-blind-extract',
                        role: 'system',
                        content: buildBlindExtractionSystemPrompt(),
                        timestamp: new Date().toISOString(),
                    },
                    {
                        id: 'usr-blind-extract',
                        role: 'user',
                        content: buildBlindExtractionUserPrompt(rawText),
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
                console.error('[BlindExtractor] JSON Parse failed:', e);
                console.log('[BlindExtractor] Faulty raw response:', response);
                return {
                    success: false,
                    cv: null,
                    error: 'Failed to parse AI response as JSON',
                    rawResponse: response,
                };
            }

            console.log('[BlindExtractor] JSON Parsed successfully. Fields:', Object.keys(parsedData));

            // Normalize IDs and required fields before Zod validation
            const normalizedData = this.normalizeExtractedData(parsedData, rawText);

            // Validate with Zod
            const validation = CanonicalCVSchema.safeParse(normalizedData);

            if (!validation.success) {
                console.error('[BlindExtractor] Zod Validation failed:', validation.error.format());
                console.log('[BlindExtractor] Problematic Normalized Data:', JSON.stringify(normalizedData, null, 2));
                return {
                    success: false,
                    cv: null,
                    error: `Schema validation failed: ${JSON.stringify(validation.error.format())}`,
                    rawResponse: response,
                };
            }

            console.log('[BlindExtractor] Extraction validation success');

            return {
                success: true,
                cv: validation.data,
            };

        } catch (error: any) {
            console.error('[BlindExtractor] Extraction error:', error);
            return {
                success: false,
                cv: null,
                error: error.message,
            };
        }
    }

    private normalizeExtractedData(data: any, rawText: string): any {
        // Ensure IDs exist for all array items
        const ensureIds = (arr: any[], prefix: string) => {
            if (!Array.isArray(arr)) return [];
            return arr.map((item, idx) => ({
                ...item,
                id: item.id || `${prefix}-${idx + 1}`,
            }));
        };

        const now = new Date().toISOString();

        return {
            id: uuidv4(),
            user_id: data.user_id || 'unassigned',
            version: 1,
            identity: {
                full_name: data.identity?.full_name || data.personal_info?.full_name || null,
                email: data.identity?.email || data.personal_info?.email || null,
                phone: data.identity?.phone || data.personal_info?.phone || null,
                location: data.identity?.location || data.personal_info?.location || null,
                linkedin_url: data.identity?.linkedin_url || data.personal_info?.linkedin_url || null,
                website_url: data.identity?.website_url || data.personal_info?.website_url || null,
                summary: data.identity?.summary || data.personal_info?.summary || null,
            },
            experience: ensureIds(data.experience || data.work_experience || [], 'work'),
            education: ensureIds(data.education || [], 'edu'),
            skills: Array.isArray(data.skills) ? data.skills : [],
            projects: ensureIds(data.projects || [], 'proj'),
            certifications: ensureIds(data.certifications || [], 'cert'),
            publications: ensureIds(data.publications || [], 'pub'),
            awards: ensureIds(data.awards || [], 'award'),
            teaching: ensureIds(data.teaching || [], 'teaching'),
            clinical: ensureIds(data.clinical || [], 'clinical'),
            volunteering: ensureIds(data.volunteering || [], 'volunteer'),
            other: ensureIds(data.other || [], 'other'),
            raw_text: rawText,
            created_at: now,
            updated_at: now,
            metadata: data.metadata || {},
        };
    }
}
