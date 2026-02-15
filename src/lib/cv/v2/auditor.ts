import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import { AIProviderName } from '@/lib/types';
import {
    CanonicalCV,
    FieldAudit,
    FieldAuditSchema
} from './types';
import {
    buildAssessmentSystemPrompt,
    buildAssessmentUserPrompt
} from './prompts';

export interface AuditResult {
    success: boolean;
    audit: FieldAudit | null;
    error?: string;
    rawResponse?: string;
}

export class Auditor {
    constructor(
        private providerName: AIProviderName,
        private model: string,
        private apiKey: string
    ) { }

    async audit(cv: CanonicalCV): Promise<AuditResult> {
        console.log(`[Auditor] Starting audit for CV ${cv.id}`);

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
                        id: 'sys-audit',
                        role: 'system',
                        content: buildAssessmentSystemPrompt(),
                        timestamp: new Date().toISOString(),
                    },
                    {
                        id: 'usr-audit',
                        role: 'user',
                        content: buildAssessmentUserPrompt(JSON.stringify({
                            identity: cv.identity,
                            experience: cv.experience,
                            education: cv.education,
                            skills: cv.skills,
                            projects: cv.projects,
                            certifications: cv.certifications,
                            publications: cv.publications,
                            awards: cv.awards,
                            teaching: cv.teaching,
                            clinical: cv.clinical,
                            volunteering: cv.volunteering,
                            other: cv.other,
                        }, null, 2)),
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
                console.error('[Auditor] JSON Parse failed:', e);
                console.log('[Auditor] Faulty raw response:', response);
                return {
                    success: false,
                    audit: null,
                    error: 'Failed to parse AI response as JSON',
                    rawResponse: response,
                };
            }

            console.log('[Auditor] JSON Parsed successfully. Score:', parsedData.overall_score);

            // Ensure basic structure for Zod
            const rawItems = Array.isArray(parsedData) ? parsedData : (parsedData.items || []);

            const normalizedData = {
                cv_id: cv.id,
                audit_date: new Date().toISOString(),
                overall_score: typeof parsedData.overall_score === 'number' ? parsedData.overall_score : 50,
                items: rawItems.map((item: any) => ({
                    ...item,
                    exists: item.exists ?? true,
                    completeness_score: item.completeness_score ?? 50,
                    quality_score: item.quality_score ?? 50,
                    issues: item.issues || [],
                    recommendations: item.recommendations || [],
                })),
            };

            // Validate with Zod
            const validation = FieldAuditSchema.safeParse(normalizedData);

            if (!validation.success) {
                console.error('[Auditor] Zod Validation failed:', validation.error.format());
                console.log('[Auditor] Problematic Normalized Data:', JSON.stringify(normalizedData, null, 2));
                return {
                    success: false,
                    audit: null,
                    error: `Schema validation failed: ${JSON.stringify(validation.error.format())}`,
                    rawResponse: response,
                };
            }

            console.log('[Auditor] Audit validation success. Score:', validation.data.overall_score);

            return {
                success: true,
                audit: validation.data,
                rawResponse: response,
            };

        } catch (error: any) {
            console.error('[Auditor] Audit error:', error);
            return {
                success: false,
                audit: null,
                error: error.message,
                rawResponse: '',
            };
        }
    }
}
