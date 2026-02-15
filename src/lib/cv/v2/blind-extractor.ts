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
        console.log('[BlindExtractor] Normalizing data. Root keys:', Object.keys(data));

        // Deep recursive search helper that supports multiple aliases
        // Returns { value, foundKey }
        const findKeyWithMeta = (obj: any, targetKeys: string | string[]): { value: any, key: string | null } => {
            if (!obj || typeof obj !== 'object') return { value: undefined, key: null };
            const targets = Array.isArray(targetKeys) ? targetKeys : [targetKeys];

            const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetSlugs = targets.map(slug);

            const keys = Object.keys(obj);

            // 1. Direct or fuzzy match at current level for any target
            for (const tSlug of targetSlugs) {
                const foundKey = keys.find(k => slug(k) === tSlug);
                if (foundKey !== undefined) return { value: obj[foundKey], key: foundKey };
            }

            // 2. Search children (limited to 3 levels)
            for (const key of keys) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const result = findKeyWithMeta(obj[key], targets);
                    if (result.value !== undefined) return result;
                }
            }
            return { value: undefined, key: null };
        };

        const findKey = (obj: any, targets: string | string[]) => findKeyWithMeta(obj, targets).value;

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

        // 1. Identity
        const idRaw = findKey(data, ['identity', 'personal_info', 'personal_details']) || data;
        const identity = {
            full_name: asString(findKey(idRaw, ['full_name', 'name', 'fullName']) || findKey(data, ['full_name', 'name'])),
            email: asString(findKey(idRaw, 'email')),
            phone: asString(findKey(idRaw, ['phone', 'phone_number', 'mobile'])),
            location: asString(findKey(idRaw, ['location', 'address', 'city', 'place_of_birth'])),
            linkedin_url: asString(findKey(idRaw, ['linkedin_url', 'linkedin'])),
            website_url: asString(findKey(idRaw, ['website_url', 'website', 'portfolio'])),
            summary: asString(findKey(idRaw, ['summary', 'objective', 'about', 'technical_summary'])),
        };

        // 2. Arrays
        const normalizeItems = (raw: any, prefix: string, fieldMap: Record<string, string[] | string>) => {
            return asArray(raw).map((item: any, idx: number) => {
                if (typeof item !== 'object') return { id: `${prefix}-${idx}`, description: String(item), metadata: {} };

                const normalized: any = { id: item.id || `${prefix}-${idx + 1}`, metadata: {} };
                const usedKeys = new Set<string>();

                Object.entries(fieldMap).forEach(([targetKey, aliases]) => {
                    const { value, key } = findKeyWithMeta(item, aliases);
                    if (key) usedKeys.add(key);

                    if (targetKey === 'achievements' || targetKey === 'technologies') {
                        normalized[targetKey] = asArray(value).map((v: any) => asString(v));
                    } else if (targetKey === 'is_current') {
                        normalized[targetKey] = asBoolean(value);
                    } else {
                        normalized[targetKey] = asString(value);
                    }
                });

                // Capture all other keys into metadata (Lossless Extraction)
                Object.keys(item).forEach(k => {
                    if (!usedKeys.has(k) && k !== 'id') {
                        normalized.metadata[k] = item[k];
                    }
                });

                return normalized;
            });
        };

        const experience = normalizeItems(findKey(data, ['experience', 'work_experience', 'work_history']), 'work', {
            job_title: ['job_title', 'title', 'position', 'role'],
            company: ['company', 'employer', 'organization'],
            location: ['location', 'address', 'city'],
            start_date: ['start_date', 'start', 'from'],
            end_date: ['end_date', 'end', 'to'],
            is_current: ['is_current', 'current', 'present'],
            description: ['description', 'duties', 'responsibilities', 'summary'],
            achievements: ['achievements', 'key_achievements', 'highlights']
        });

        const education = normalizeItems(findKey(data, ['education', 'academic_background']), 'edu', {
            degree: ['degree', 'qualification', 'level'],
            field_of_study: ['field_of_study', 'major', 'subject', 'specialization'],
            institution: ['institution', 'university', 'school', 'college'],
            location: ['location', 'address', 'city'],
            start_date: ['start_date', 'start', 'from'],
            end_date: ['end_date', 'end', 'to'],
            gpa: ['gpa', 'grade', 'score'],
            description: ['description', 'summary', 'thesis']
        });

        const skills = asArray(findKey(data, ['skills', 'competencies', 'technical_skills'])).map((s: any) => {
            if (typeof s === 'string') return s;
            if (s && typeof s === 'object') return asString(findKey(s, ['name', 'title', 'skill']) || JSON.stringify(s));
            return String(s);
        });

        const projects = normalizeItems(findKey(data, ['projects', 'personal_projects']), 'proj', {
            name: ['name', 'title'],
            description: ['description', 'summary'],
            technologies: ['technologies', 'tools', 'stack'],
            url: ['url', 'link'],
            start_date: ['start_date', 'start'],
            end_date: ['end_date', 'end']
        });

        // 3. Generic sections
        const normalizeGeneric = (targets: string | string[], prefix: string) => {
            return normalizeItems(findKey(data, targets), prefix, { title: ['title', 'name'], content: ['content', 'description', 'details'] });
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
            certifications: normalizeItems(findKey(data, ['certifications', 'licenses']), 'cert', {
                name: ['name', 'title'],
                issuer: ['issuer', 'organization', 'authority'],
                date_obtained: ['date_obtained', 'date', 'issued_at'],
                expiry_date: ['expiry_date', 'expires_at'],
                credential_id: ['credential_id', 'id'],
                credential_url: ['credential_url', 'url']
            }),
            publications: normalizeGeneric(['publications', 'research', 'articles'], 'pub'),
            awards: normalizeGeneric(['awards', 'honors', 'achievements'], 'award'),
            teaching: normalizeGeneric(['teaching', 'academic_experience', 'courses'], 'teach'),
            clinical: normalizeGeneric(['clinical', 'medical_experience'], 'clin'),
            volunteering: normalizeGeneric(['volunteering', 'community_service'], 'vol'),
            other: normalizeGeneric(['other', 'additional_information', 'misc'], 'other'),
            raw_text: rawText,
            created_at: now,
            updated_at: now,
            metadata: findKey(data, 'metadata') || {},
        };
    }
}
