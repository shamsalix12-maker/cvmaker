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
        // slugify helper for fuzzy matching
        const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-0]/g, '');

        // Robust key lookup helper
        const get = (obj: any, ...keys: string[]) => {
            if (!obj) return null;
            const targetSlugs = keys.map(slug);

            // 1. Direct match
            for (const key of keys) {
                if (obj[key] !== undefined) return obj[key];
            }

            // 2. Fuzzy match
            const objKeys = Object.keys(obj);
            for (const s of targetSlugs) {
                const foundKey = objKeys.find(k => slug(k) === s);
                if (foundKey) return obj[foundKey];
            }
            return null;
        };

        const identityRaw = get(data, 'identity', 'personal_info', 'personal_details', 'Identity', 'PersonalInfo') || {};

        // Items normalization
        const ensureIds = (input: any, prefix: string, fieldMap: Record<string, string[]>) => {
            const arr = Array.isArray(input) ? input : (input && typeof input === 'object' && input.items ? input.items : []);
            if (!Array.isArray(arr)) return [];

            return arr.map((item, idx) => {
                const normalizedItem: any = {
                    id: item.id || get(item, 'id') || `${prefix}-${idx + 1}`,
                };

                // Map all fields according to fieldMap
                Object.entries(fieldMap).forEach(([targetKey, sourceKeys]) => {
                    let val = get(item, targetKey, ...sourceKeys);

                    // Array to String conversion (Llama often returns lists for descriptions)
                    if (Array.isArray(val) && ['description', 'content', 'summary', 'job_title', 'company', 'degree', 'institution', 'location'].includes(targetKey)) {
                        val = val.join('\n');
                    }

                    normalizedItem[targetKey] = val;

                    // Special handling for nested arrays (achievements, technologies)
                    if (targetKey === 'achievements' && !Array.isArray(normalizedItem.achievements)) {
                        normalizedItem.achievements = normalizedItem.achievements ? [normalizedItem.achievements] : [];
                    }
                    if (targetKey === 'technologies' && !Array.isArray(normalizedItem.technologies)) {
                        normalizedItem.technologies = normalizedItem.technologies ? [normalizedItem.technologies] : [];
                    }
                });

                // Special handling for boolean (is_current)
                const currentVal = normalizedItem.is_current;
                if (currentVal === undefined || currentVal === null) {
                    normalizedItem.is_current = false;
                } else if (typeof currentVal === 'string') {
                    const s = currentVal.toLowerCase();
                    normalizedItem.is_current = s.includes('now') || s.includes('present') || s.includes('current');
                } else {
                    normalizedItem.is_current = !!currentVal;
                }

                return normalizedItem;
            });
        };

        const now = new Date().toISOString();

        return {
            id: uuidv4(),
            user_id: get(data, 'user_id') || 'unassigned',
            version: 1,
            identity: {
                full_name: get(identityRaw, 'full_name', 'name', 'fullName', 'Name', 'FullName') || get(data, 'full_name', 'name'),
                email: get(identityRaw, 'email', 'Email'),
                phone: get(identityRaw, 'phone', 'phone_number', 'PhoneNumber', 'Phone'),
                location: get(identityRaw, 'location', 'address', 'Address', 'Location', 'PlaceOfBirth'),
                linkedin_url: get(identityRaw, 'linkedin_url', 'linkedin', 'LinkedIn'),
                website_url: get(identityRaw, 'website_url', 'website', 'Website'),
                summary: get(identityRaw, 'summary', 'Summary', 'Objective', 'TechnicalSummary'),
            },
            experience: ensureIds(get(data, 'experience', 'work_experience', 'Experience', 'WorkExperience'), 'work', {
                job_title: ['job_title', 'title', 'Title', 'JobTitle', 'Position'],
                company: ['company', 'employer', 'Employer', 'Company', 'Institution'],
                location: ['location', 'Location', 'Address'],
                start_date: ['start_date', 'StartDate', 'From', 'start'],
                end_date: ['end_date', 'EndDate', 'To', 'end'],
                is_current: ['is_current', 'isCurrent', 'current'],
                description: ['description', 'Description', 'Duties', 'Responsibilities', 'Content'],
                achievements: ['achievements', 'Achievements', 'KeyAchievements'],
            }),
            education: ensureIds(get(data, 'education', 'Education'), 'edu', {
                degree: ['degree', 'Degree', 'Qualification'],
                field_of_study: ['field_of_study', 'fieldOfStudy', 'major', 'Major', 'Subject'],
                institution: ['institution', 'university', 'University', 'school', 'School', 'Institution'],
                location: ['location', 'Location'],
                start_date: ['start_date', 'StartDate', 'From'],
                end_date: ['end_date', 'EndDate', 'To'],
                gpa: ['gpa', 'GPA', 'Grade'],
                description: ['description', 'Description', 'ThesisTitle', 'Thesis'],
            }),
            skills: Array.isArray(get(data, 'skills', 'Skills'))
                ? get(data, 'skills', 'Skills').map((s: any) => {
                    if (typeof s === 'string') return s;
                    if (typeof s === 'object' && s !== null) {
                        const name = get(s, 'name', 'Name', 'title', 'Title', 'skill', 'Skill');
                        const desc = get(s, 'description', 'Description', 'details', 'Details', 'Level');
                        return name && desc ? `${name}: ${desc}` : (name || desc || JSON.stringify(s));
                    }
                    return String(s);
                })
                : [],
            projects: ensureIds(get(data, 'projects', 'Projects'), 'proj', {
                name: ['name', 'title', 'Title', 'Name'],
                description: ['description', 'Description'],
                technologies: ['technologies', 'Technologies', 'Tools'],
                url: ['url', 'URL', 'Link'],
                start_date: ['start_date', 'StartDate'],
                end_date: ['end_date', 'EndDate'],
            }),
            certifications: ensureIds(get(data, 'certifications', 'Certifications'), 'cert', {
                name: ['name', 'title', 'Name'],
                issuer: ['issuer', 'organization', 'Issuer'],
                date_obtained: ['date_obtained', 'date', 'Date'],
                expiry_date: ['expiry_date', 'expiry'],
                credential_id: ['credential_id', 'id'],
                credential_url: ['credential_url', 'url'],
            }),
            publications: ensureIds(get(data, 'publications', 'Publications'), 'pub', {
                title: ['title', 'name', 'Title'],
                content: ['content', 'description', 'Description', 'Details'],
            }),
            awards: ensureIds(get(data, 'awards', 'Awards'), 'award', {
                title: ['title', 'name', 'Title'],
                content: ['content', 'description', 'Description', 'Details'],
            }),
            teaching: ensureIds(get(data, 'teaching', 'Teaching'), 'teaching', {
                title: ['title', 'name', 'course', 'Title'],
                content: ['content', 'description', 'Description', 'Details'],
            }),
            clinical: ensureIds(get(data, 'clinical', 'Clinical'), 'clinical', {
                title: ['title', 'name', 'Title'],
                content: ['content', 'description', 'Description'],
            }),
            volunteering: ensureIds(get(data, 'volunteering', 'Volunteering'), 'volunteer', {
                title: ['title', 'name', 'Title'],
                content: ['content', 'description', 'Description'],
            }),
            other: ensureIds(get(data, 'other', 'Other'), 'other', {
                title: ['title', 'name', 'Section'],
                content: ['content', 'description', 'Description', 'Details'],
            }),
            raw_text: rawText,
            created_at: now,
            updated_at: now,
            metadata: get(data, 'metadata', 'Metadata') || {},
        };
    }
}
