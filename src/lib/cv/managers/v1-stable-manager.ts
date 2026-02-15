import {
    CVExtractionRequest,
    ComprehensiveCV,
    AIProviderName
} from '@/lib/types';
import {
    CVDomainId,
    CVGapAnalysis,
    SuggestedImprovement,
    TranslationApplied,
    GapSeverity,
    GapCategory,
    GapInputType
} from '@/lib/types/cv-domain.types';
import { getAIProvider } from '@/lib/ai';
import { AIProviderConfig, AICompletionOptions } from '@/lib/ai/ai-provider';
import {
    buildExtractionSystemPrompt,
    buildExtractionUserPrompt,
    buildRefinementSystemPrompt,
    buildRefinementUserPrompt,
} from '../cv-extraction-prompt';
import { validateExtractedCV, getCompletionPercentage } from '../cv-validator';
import { detectDomains, CV_DOMAINS } from '../cv-domains';
import {
    extractCVMultiStage,
    safeRefineCV,
    validateExtraction,
    validateLanguage,
    safeParseJSON,
} from '../multi-stage-extractor';

import {
    CVManager,
    CVRefinementRequest,
    EnhancedCVExtractionResult
} from './types';

export class V1StableManager implements CVManager {
    readonly id: string = 'v1-stable';
    readonly name: string = 'Stable Manager';
    readonly version: string = '1.0.0';

    async extract(request: CVExtractionRequest & { selectedDomains?: CVDomainId[], cvLanguage?: string }): Promise<EnhancedCVExtractionResult> {
        const { rawText, aiProvider, aiModel, apiKey } = request as any;

        const selectedDomains: CVDomainId[] =
            (request.selectedDomains && Array.isArray(request.selectedDomains) && request.selectedDomains.length > 0)
                ? request.selectedDomains
                : ['general' as CVDomainId];

        const cvLanguage: string = request.cvLanguage || 'en';

        console.log(`[${this.name}] Starting extraction`, { domains: selectedDomains, cvLanguage });

        const detectedDomains = detectDomains(rawText || '');

        try {
            const provider = getAIProvider(aiProvider);
            const config: AIProviderConfig = {
                apiKey,
                temperature: 0,
                maxTokens: 32768,
            };

            const systemPrompt = buildExtractionSystemPrompt(selectedDomains, cvLanguage);
            const userPrompt = buildExtractionUserPrompt(rawText, selectedDomains);

            const options: AICompletionOptions = {
                model: aiModel,
                messages: [
                    { id: 'sys-extract', role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
                    { id: 'usr-extract', role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
                ],
                jsonMode: true,
            };

            const response = await provider.complete(config, options);
            if (!response) throw new Error('AI provider returned an empty response');

            let parsed = safeParseJSON(response);
            if (!parsed) parsed = this.extractPartialData(response);
            if (!parsed) throw new Error('AI returned invalid JSON');

            const cv = this.transformExtractedData(parsed, rawText);
            const aiGapAnalysis = this.transformGapAnalysis(parsed, selectedDomains);
            const comprehensiveGaps = this.buildComprehensiveGaps(cv, selectedDomains, aiGapAnalysis?.gaps || []);

            const gapAnalysis: CVGapAnalysis = {
                selected_domains: selectedDomains,
                detected_domains: aiGapAnalysis?.detected_domains || [],
                overall_score: aiGapAnalysis?.overall_score || 0,
                domain_scores: aiGapAnalysis?.domain_scores || {},
                gaps: comprehensiveGaps,
                strengths: aiGapAnalysis?.strengths || [],
                analysis_summary: aiGapAnalysis?.analysis_summary || '',
                general_recommendations: aiGapAnalysis?.general_recommendations || [],
            };

            const metadata = this.transformMetadata(parsed);
            const validation = validateExtraction(cv, rawText, cvLanguage);
            const fieldStatuses = validateExtractedCV(cv);
            const completionPercentage = getCompletionPercentage(fieldStatuses);

            return {
                success: true,
                cv,
                fieldStatuses,
                confidence: metadata?.confidence || validation.completeness,
                rawText,
                aiProvider: aiProvider as AIProviderName,
                aiModel,
                extractionNotes: metadata?.notes || validation.warnings.join('; '),
                gapAnalysis,
                detectedDomains,
                metadata,
                suggestedImprovements: [],
                translationsApplied: [],
                cvLanguage,
            };
        } catch (error: any) {
            console.error(`[${this.name}] Error:`, error);
            return this.buildErrorResult(rawText, aiProvider, aiModel, detectedDomains, error.message);
        }
    }

    async refine(request: CVRefinementRequest & { apiKey?: string }): Promise<EnhancedCVExtractionResult> {
        const {
            currentCV,
            resolvedGaps,
            additionalText,
            instructions,
            selectedDomains,
            cvLanguage,
            provider: aiProvider,
            model: aiModel,
            apiKey
        } = request as any;

        const domains = selectedDomains && selectedDomains.length > 0 ? selectedDomains : ['general' as CVDomainId];
        const gaps = resolvedGaps || [];
        const lang = cvLanguage || 'en';

        console.log(`[${this.name}] Starting refinement`, { domains, resolvedGapCount: gaps.length });

        const detectedDomains = detectDomains(currentCV.raw_text || '');

        try {
            const provider = getAIProvider(aiProvider as AIProviderName);
            const config: AIProviderConfig = { apiKey, temperature: 0, maxTokens: 32768 };

            const systemPrompt = buildRefinementSystemPrompt(domains, lang);
            const userPrompt = buildRefinementUserPrompt(currentCV, gaps, additionalText, instructions, lang);

            const options: AICompletionOptions = {
                model: aiModel,
                messages: [
                    { id: 'sys-refine', role: 'system', content: systemPrompt, timestamp: new Date().toISOString() },
                    { id: 'usr-refine', role: 'user', content: userPrompt, timestamp: new Date().toISOString() },
                ],
                jsonMode: true,
            };

            const response = await provider.complete(config, options);
            const parsed = provider.parseJsonResponse<any>(response);
            if (!parsed) throw new Error('Failed to parse AI refinement response');

            const rawCV = this.transformExtractedData(parsed, additionalText || currentCV.raw_text);

            let cv: Partial<ComprehensiveCV>;
            if (resolvedGaps && resolvedGaps.length > 0) {
                cv = { ...rawCV };
                const checks = [
                    { key: 'work_experience', label: 'Work' },
                    { key: 'education', label: 'Education' },
                    { key: 'languages', label: 'Languages' },
                    { key: 'certifications', label: 'Certs' },
                    { key: 'projects', label: 'Projects' },
                ];
                for (const check of checks) {
                    const origCount = (currentCV as any)[check.key]?.length || 0;
                    const newCount = (cv as any)[check.key]?.length || 0;
                    if (newCount < origCount || (!(cv as any)[check.key] && (currentCV as any)[check.key])) {
                        (cv as any)[check.key] = (currentCV as any)[check.key];
                    }
                }
                if ((Array.isArray(cv.skills) ? cv.skills.length : 0) < (Array.isArray(currentCV.skills) ? currentCV.skills.length : 0)) {
                    cv.skills = currentCV.skills;
                }
                if (cv.personal_info && currentCV.personal_info) {
                    cv.personal_info.full_name = currentCV.personal_info.full_name || cv.personal_info.full_name;
                    cv.personal_info.email = currentCV.personal_info.email || cv.personal_info.email;
                    cv.personal_info.phone = currentCV.personal_info.phone || cv.personal_info.phone;
                }
                cv.raw_text = currentCV.raw_text || cv.raw_text;
            } else {
                cv = safeRefineCV(currentCV, rawCV);
            }

            const aiGapAnalysis = this.transformGapAnalysis(parsed, domains);
            const comprehensiveGaps = this.buildComprehensiveGaps(cv, domains, aiGapAnalysis?.gaps || []);

            const gapAnalysis: CVGapAnalysis = {
                selected_domains: domains,
                detected_domains: aiGapAnalysis?.detected_domains || [],
                overall_score: aiGapAnalysis?.overall_score || 0,
                domain_scores: aiGapAnalysis?.domain_scores || {},
                gaps: comprehensiveGaps,
                strengths: aiGapAnalysis?.strengths || [],
                analysis_summary: aiGapAnalysis?.analysis_summary || '',
                general_recommendations: aiGapAnalysis?.general_recommendations || [],
            };

            const metadata = this.transformMetadata(parsed);
            const fieldStatuses = validateExtractedCV(cv);
            const completionPercentage = getCompletionPercentage(fieldStatuses);
            const suggestedImprovements = this.transformSuggestedImprovements(parsed.suggested_improvements);
            const translationsApplied = this.transformTranslationsApplied(parsed.translations_applied);

            return {
                success: true,
                cv,
                fieldStatuses,
                confidence: metadata?.confidence || completionPercentage,
                rawText: additionalText || currentCV.raw_text || '',
                aiProvider: aiProvider as AIProviderName,
                aiModel,
                extractionNotes: metadata?.notes || '',
                gapAnalysis,
                detectedDomains,
                metadata,
                suggestedImprovements,
                translationsApplied,
                cvLanguage: lang,
            };
        } catch (error: any) {
            console.error(`[${this.name}] Refinement error:`, error);
            return this.buildErrorResult(additionalText || currentCV.raw_text || '', aiProvider as AIProviderName, aiModel, detectedDomains, error.message, currentCV);
        }
    }

    // Helper methods migrated from cv-extractor.ts
    private transformExtractedData(parsed: any, rawText?: string): Partial<ComprehensiveCV> {
        const data = parsed.extracted_data || parsed;
        const pi = data.personal_info || data.personal || data.profile || {};
        const personal_info = {
            full_name: this.firstNonEmpty(pi.full_name, pi.name, pi.fullName, pi.name_and_surname) || '',
            email: this.firstNonEmpty(pi.email, pi.email_address, pi.contact_email) || '',
            phone: this.firstNonEmpty(pi.phone, pi.phone_number, pi.mobile, pi.contact_number) || '',
            location: this.firstNonEmpty(pi.location, pi.address, pi.city, pi.permanent_address) || '',
            linkedin_url: this.firstNonEmpty(pi.linkedin_url, pi.linkedin) || '',
            website_url: this.firstNonEmpty(pi.website_url, pi.website, pi.portfolio) || '',
            summary: this.firstNonEmpty(pi.summary, pi.professional_summary, pi.about, pi.research_summary, pi.objective) || '',
        };

        const work_experience = this.ensureArray(data.work_experience || data.experience || data.work_history).map((item: any, idx: number) => ({
            id: item.id || `work-${idx + 1}`,
            job_title: item.job_title || item.title || item.position || '',
            company: item.company || item.organization || item.employer || '',
            location: item.location || '',
            start_date: item.start_date || '',
            end_date: item.end_date || null,
            is_current: Boolean(item.is_current),
            description: item.description || '',
            achievements: this.ensureStringArray(item.achievements),
        }));

        const education = this.ensureArray(data.education || data.academic_background).map((item: any, idx: number) => ({
            id: item.id || `edu-${idx + 1}`,
            degree: item.degree || item.qualification || '',
            field_of_study: item.field_of_study || item.major || item.subject || '',
            institution: item.institution || item.university || item.school || '',
            location: item.location || '',
            start_date: item.start_date || '',
            end_date: item.end_date || null,
            gpa: item.gpa || null,
            description: item.description || '',
        }));

        const skills = this.ensureStringArray(data.skills);
        const certifications = this.ensureArray(data.certifications).map((item: any, idx: number) => ({
            id: item.id || `cert-${idx + 1}`,
            name: item.name || item.title || '',
            issuer: item.issuer || item.organization || '',
            date_obtained: item.date_obtained || item.date || '',
            expiry_date: item.expiry_date || null,
            credential_id: item.credential_id || null,
            credential_url: item.credential_url || null,
        }));

        const languages = this.ensureArray(data.languages).map((item: any) => ({
            language: item.language || '',
            proficiency: (item.proficiency || 'intermediate') as any,
        }));

        const projects = this.ensureArray(data.projects).map((item: any, idx: number) => ({
            id: item.id || `proj-${idx + 1}`,
            name: item.name || item.title || '',
            description: item.description || '',
            technologies: this.ensureStringArray(item.technologies),
            url: item.url || null,
            start_date: item.start_date || null,
            end_date: item.end_date || null,
        }));

        return { personal_info, work_experience, education, skills, certifications, languages, projects, raw_text: rawText };
    }

    private transformGapAnalysis(parsed: any, selectedDomains: CVDomainId[]) {
        const ga = parsed.gap_analysis || {};
        return {
            overall_score: ga.overall_score || 0,
            domain_scores: ga.domain_relevance_scores || {},
            detected_domains: ga.detected_domains || [],
            gaps: this.ensureArray(ga.gaps).map((gap: any) => ({
                id: gap.id || `gap-${Math.random().toString(36).substr(2, 9)}`,
                field_path: gap.field_path || '',
                severity: gap.severity || 'recommended',
                category: gap.category || 'incomplete_content',
                title_en: gap.title_en || '',
                title_fa: gap.title_fa || '',
                description_en: gap.description_en || '',
                description_fa: gap.description_fa || '',
                fix_guidance_en: gap.fix_guidance_en || '',
                fix_guidance_fa: gap.fix_guidance_fa || '',
                fix_example_en: gap.fix_example_en || '',
                fix_example_fa: gap.fix_example_fa || '',
                relevant_domains: gap.relevant_domains || selectedDomains,
                input_type: gap.input_type || 'text',
                suggested_value: gap.suggested_value || null,
                current_value: gap.current_value || null,
                can_skip: gap.can_skip !== false,
            })),
            strengths: this.ensureArray(ga.strengths).map((s: any) => ({
                title_en: s.title_en || '',
                title_fa: s.title_fa || '',
                description_en: s.description_en || '',
                description_fa: s.description_fa || '',
                relevant_domains: s.relevant_domains || selectedDomains,
            })),
            analysis_summary: ga.analysis_summary_en || '',
            general_recommendations: ga.general_recommendations_en || [],
        };
    }

    private buildComprehensiveGaps(cv: Partial<ComprehensiveCV>, selectedDomains: CVDomainId[], aiGaps: any[]) {
        const gaps: any[] = [];
        const addGap = (section: string, field: string, label: string, priority: GapSeverity, suggestion: string, category: GapCategory) => {
            gaps.push({
                id: `struct-${section}-${field}`,
                field_path: `${section}.${field}`,
                severity: priority,
                category: category,
                title_en: `Missing ${label}`,
                title_fa: `فیلد ${label} خالی است`,
                description_en: `Your CV is missing ${label}. Adding this makes it more professional.`,
                description_fa: `${label} در رزومه شما وجود ندارد. افزودن آن رزومه را حرفه‌ای‌تر می‌کند.`,
                fix_guidance_en: suggestion,
                fix_guidance_fa: suggestion,
                relevant_domains: selectedDomains,
                input_type: 'text',
                can_skip: true,
            });
        };

        if (!cv.personal_info?.full_name) addGap('personal_info', 'full_name', 'Full Name', 'critical', 'Provide your full legal name', 'missing_section');
        if (!cv.personal_info?.email) addGap('personal_info', 'email', 'Email Address', 'critical', 'Provide a professional email address', 'missing_section');
        if (!cv.personal_info?.summary) addGap('personal_info', 'summary', 'Professional Summary', 'important', 'Write a short summary of your career', 'incomplete_content');
        if (!cv.work_experience?.length) addGap('work_experience', 'entries', 'Work Experience', 'critical', 'Add your work history', 'missing_section');

        for (const aiGap of aiGaps) {
            if (!gaps.some(g => g.field_path === aiGap.field_path)) gaps.push(aiGap);
        }
        return gaps.sort((a, b) => this.severityToScore(b.severity) - this.severityToScore(a.severity));
    }

    private severityToScore(s: string) {
        const scores: any = { critical: 4, important: 3, recommended: 2, optional: 1 };
        return scores[s] || 0;
    }

    private transformMetadata(parsed: any) {
        const m = parsed.metadata || {};
        return {
            confidence: m.confidence || 0,
            detected_language: m.detected_language || 'en',
            cv_format_quality: m.cv_format_quality || 'fair',
            estimated_experience_years: m.estimated_experience_years || null,
            career_level: m.career_level || 'entry',
            notes: m.notes || '',
        };
    }

    private transformSuggestedImprovements(improvements: any[]): SuggestedImprovement[] {
        return this.ensureArray(improvements).map((imp: any) => ({
            id: imp.id || `imp-${Math.random().toString(36).substr(2, 9)}`,
            field_path: imp.field_path || '',
            current_text: imp.current_text || imp.original_value || '',
            suggested_text: imp.suggested_text || imp.suggested_value || '',
            reason_en: imp.reason_en || '',
            reason_fa: imp.reason_fa || '',
            is_approved: Boolean(imp.is_approved),
            is_rejected: Boolean(imp.is_rejected),
        }));
    }

    private transformTranslationsApplied(translations: any[]): TranslationApplied[] {
        return this.ensureArray(translations).map((t: any) => ({
            id: t.id || `translation-${Math.random().toString(36).substr(2, 9)}`,
            field_path: t.field_path || '',
            original_input: t.original_input || t.original_value || '',
            original_language: t.original_language || t.from_lang || '',
            translated_text: t.translated_text || t.translated_value || '',
            target_language: t.target_language || t.to_lang || '',
            is_approved: Boolean(t.is_approved),
            is_rejected: Boolean(t.is_rejected),
        }));
    }

    private extractPartialData(response: string) {
        // Basic regex-based fallback if JSON is broken but contains key patterns
        const result: any = { extracted_data: {} };
        const nameMatch = response.match(/"full_name"\s*:\s*"([^"]+)"/);
        if (nameMatch) result.extracted_data.personal_info = { full_name: nameMatch[1] };
        return result;
    }

    private buildErrorResult(rawText: string, aiProvider: AIProviderName, aiModel: string, detectedDomains: any[], error: string, currentCV: any = null): EnhancedCVExtractionResult {
        return {
            success: false,
            cv: currentCV,
            fieldStatuses: [],
            confidence: 0,
            rawText,
            aiProvider,
            aiModel,
            extractionNotes: error,
            gapAnalysis: null,
            detectedDomains,
            metadata: null,
            suggestedImprovements: [],
            translationsApplied: [],
            error,
        };
    }

    private firstNonEmpty(...vals: any[]) { return vals.find(v => v !== null && v !== undefined && v !== ''); }
    private ensureArray(val: any) { return Array.isArray(val) ? val : []; }
    private ensureStringArray(val: any) {
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === 'string') return [val];
        return [];
    }
}
