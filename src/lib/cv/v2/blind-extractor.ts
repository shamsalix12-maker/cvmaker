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
        // Robust key lookup helper
        const get = (obj: any, ...keys: string[]) => {
            if (!obj) return null;
            for (const key of keys) {
                if (obj[key] !== undefined) return obj[key];
                // Case-insensitive search
                const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
                if (foundKey) return obj[foundKey];
            }
            return null;
        };

        const identityRaw = get(data, 'identity', 'personal_info', 'Identity', 'PersonalInfo') || {};

        // Ensure IDs exist for all array items
        const ensureIds = (input: any, prefix: string) => {
            const arr = Array.isArray(input) ? input : (input && typeof input === 'object' && input.items ? input.items : []);
            if (!Array.isArray(arr)) return [];
            return arr.map((item, idx) => ({
                ...item,
                id: item.id || get(item, 'id') || `${prefix}-${idx + 1}`,
                // Map sub-keys loosely if needed
                job_title: get(item, 'job_title', 'JobTitle', 'title', 'Title'),
                company: get(item, 'company', 'Company', 'employer', 'Employer'),
                degree: get(item, 'degree', 'Degree'),
                field_of_study: get(item, 'field_of_study', 'FieldOfStudy', 'major', 'Major'),
                institution: get(item, 'institution', 'Institution', 'university', 'University', 'school', 'School'),
            }));
        };

        const now = new Date().toISOString();

        return {
            id: uuidv4(),
            user_id: get(data, 'user_id') || 'unassigned',
            version: 1,
            identity: {
                full_name: get(identityRaw, 'full_name', 'fullName', 'name', 'Name', 'FullName') || get(data, 'full_name', 'name'),
                email: get(identityRaw, 'email', 'Email'),
                phone: get(identityRaw, 'phone', 'PhoneNumber', 'Phone'),
                location: get(identityRaw, 'location', 'Location', 'Address'),
                linkedin_url: get(identityRaw, 'linkedin_url', 'linkedin', 'LinkedIn'),
                website_url: get(identityRaw, 'website_url', 'website', 'Website'),
                summary: get(identityRaw, 'summary', 'Summary', 'Objective'),
            },
            experience: ensureIds(get(data, 'experience', 'work_experience', 'Experience', 'WorkExperience'), 'work'),
            education: ensureIds(get(data, 'education', 'Education'), 'edu'),
            skills: Array.isArray(get(data, 'skills', 'Skills'))
                ? get(data, 'skills', 'Skills').map((s: any) => {
                    if (typeof s === 'string') return s;
                    if (typeof s === 'object' && s !== null) {
                        const name = get(s, 'name', 'Name', 'title', 'Title');
                        const desc = get(s, 'description', 'Description', 'details', 'Details');
                        return name && desc ? `${name}: ${desc}` : (name || desc || JSON.stringify(s));
                    }
                    return String(s);
                })
                : [],
            projects: ensureIds(get(data, 'projects', 'Projects'), 'proj'),
            certifications: ensureIds(get(data, 'certifications', 'Certifications'), 'cert'),
            publications: ensureIds(get(data, 'publications', 'Publications'), 'pub'),
            awards: ensureIds(get(data, 'awards', 'Awards'), 'award'),
            teaching: ensureIds(get(data, 'teaching', 'Teaching'), 'teaching'),
            clinical: ensureIds(get(data, 'clinical', 'Clinical'), 'clinical'),
            volunteering: ensureIds(get(data, 'volunteering', 'Volunteering'), 'volunteer'),
            other: ensureIds(get(data, 'other', 'Other'), 'other'),
            raw_text: rawText,
            created_at: now,
            updated_at: now,
            metadata: get(data, 'metadata', 'Metadata') || {},
        };
    }
}
