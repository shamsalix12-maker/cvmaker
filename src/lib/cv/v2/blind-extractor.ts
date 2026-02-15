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
                rawResponse: response,
            };

        } catch (error: any) {
            console.error('[BlindExtractor] Extraction error:', error);
            return {
                success: false,
                cv: null,
                error: error.message,
                rawResponse: '', // Or previous value if available, but here it's caught from outer scope
            };
        }
    }

    private normalizeExtractedData(data: any, rawText: string): any {
        // Deep recursive search helper
        const findKey = (obj: any, target: string): any => {
            if (!obj || typeof obj !== 'object') return undefined;

            // 1. Direct or fuzzy match at current level
            const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-0]/g, '');
            const targetSlug = slug(target);

            const keys = Object.keys(obj);
            const foundKey = keys.find(k => slug(k) === targetSlug);
            if (foundKey !== undefined) return obj[foundKey];

            // 2. Search children
            for (const key of keys) {
                const result = findKey(obj[key], target);
                if (result !== undefined) return result;
            }
            return undefined;
        };

        // Helpers to normalize specific types
        const asString = (val: any) => {
            if (Array.isArray(val)) return val.join('\n');
            if (val === null || val === undefined) return null;
            return String(val);
        };

        const asArray = (val: any) => {
            if (Array.isArray(val)) return val;
            if (val && typeof val === 'object' && val.items) return val.items;
            return val ? [val] : [];
        };

        const asBoolean = (val: any) => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') {
                const s = val.toLowerCase();
                return s.includes('now') || s.includes('present') || s.includes('current') || s === 'true';
            }
            return !!val;
        };

        const now = new Date().toISOString();

        // 1. Identity section
        const identityRaw = findKey(data, 'identity') || findKey(data, 'personal_info') || findKey(data, 'personal_details') || data;
        const identity = {
            full_name: asString(findKey(identityRaw, 'full_name') || findKey(identityRaw, 'name') || findKey(data, 'full_name')),
            email: asString(findKey(identityRaw, 'email')),
            phone: asString(findKey(identityRaw, 'phone') || findKey(identityRaw, 'phone_number')),
            location: asString(findKey(identityRaw, 'location') || findKey(identityRaw, 'address') || findKey(identityRaw, 'place_of_birth')),
            linkedin_url: asString(findKey(identityRaw, 'linkedin_url') || findKey(identityRaw, 'linkedin')),
            website_url: asString(findKey(identityRaw, 'website_url') || findKey(identityRaw, 'website')),
            summary: asString(findKey(identityRaw, 'summary') || findKey(identityRaw, 'objective') || findKey(identityRaw, 'research_summary')),
        };

        // 2. Array sections
        const normalizeItems = (raw: any, prefix: string, schema: Record<string, 'string' | 'array' | 'boolean'>) => {
            return asArray(raw).map((item: any, idx: number) => {
                if (typeof item !== 'object') return { id: `${prefix}-${idx}`, description: String(item) };

                const normalized: any = { id: item.id || `${prefix}-${idx + 1}` };
                Object.entries(schema).forEach(([key, type]) => {
                    const rawVal = findKey(item, key);
                    if (type === 'string') normalized[key] = asString(rawVal);
                    else if (type === 'array') normalized[key] = asArray(rawVal).map((v: any) => asString(v));
                    else if (type === 'boolean') normalized[key] = asBoolean(rawVal);
                });
                return normalized;
            });
        };

        const experience = normalizeItems(findKey(data, 'experience') || findKey(data, 'work_experience'), 'work', {
            job_title: 'string',
            company: 'string',
            location: 'string',
            start_date: 'string',
            end_date: 'string',
            is_current: 'boolean',
            description: 'string',
            achievements: 'array'
        });

        const education = normalizeItems(findKey(data, 'education'), 'edu', {
            degree: 'string',
            field_of_study: 'string',
            institution: 'string',
            location: 'string',
            start_date: 'string',
            end_date: 'string',
            gpa: 'string',
            description: 'string'
        });

        const skills = asArray(findKey(data, 'skills')).map((s: any) => {
            if (typeof s === 'string') return s;
            if (s && typeof s === 'object') return asString(findKey(s, 'name') || findKey(s, 'title') || JSON.stringify(s));
            return String(s);
        });

        const projects = normalizeItems(findKey(data, 'projects'), 'proj', {
            name: 'string',
            description: 'string',
            technologies: 'array',
            url: 'string',
            start_date: 'string',
            end_date: 'string'
        });

        // 3. Generic sections
        const normalizeGeneric = (key: string, prefix: string) => {
            return normalizeItems(findKey(data, key), prefix, { title: 'string', content: 'string' });
        };

        return {
            id: uuidv4(),
            user_id: String(findKey(data, 'user_id') || 'unassigned'),
            version: 1,
            identity,
            experience,
            education,
            skills,
            projects,
            certifications: normalizeItems(findKey(data, 'certifications'), 'cert', {
                name: 'string',
                issuer: 'string',
                date_obtained: 'string',
                expiry_date: 'string',
                credential_id: 'string',
                credential_url: 'string'
            }),
            publications: normalizeGeneric('publications', 'pub'),
            awards: normalizeGeneric('awards', 'award'),
            teaching: normalizeGeneric('teaching', 'teach'),
            clinical: normalizeGeneric('clinical', 'clin'),
            volunteering: normalizeGeneric('volunteering', 'vol'),
            other: normalizeGeneric('other', 'other'),
            raw_text: rawText,
            created_at: now,
            updated_at: now,
            metadata: findKey(data, 'metadata') || {},
        };
    }
}
