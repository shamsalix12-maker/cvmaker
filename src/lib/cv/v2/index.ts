export * from './types';
export * from './prompts';
export * from './blind-extractor';
export * from './auditor';
export * from './gap-generator';
export * from './merger';
export * from './renderer';

import { AIProviderName } from '@/lib/types';
import { BlindExtractor } from './blind-extractor';
import { Auditor } from './auditor';
import { GapGenerator } from './gap-generator';
import { Merger } from './merger';
import { Renderer } from './renderer';
import { CanonicalCV } from './types';

export class CVProcessorV2 {
    public extractor: BlindExtractor;
    public auditor: Auditor;
    public gapGenerator: GapGenerator;
    public merger: Merger;
    public renderer: Renderer;

    constructor(
        providerName: AIProviderName,
        model: string,
        apiKey: string
    ) {
        this.extractor = new BlindExtractor(providerName, model, apiKey);
        this.auditor = new Auditor(providerName, model, apiKey);
        this.gapGenerator = new GapGenerator(providerName, model, apiKey);
        this.merger = new Merger();
        this.renderer = new Renderer(providerName, model, apiKey);
    }

    /**
     * Complete pipeline from raw text to canonical CV with assessment.
     */
    async fullProcess(rawText: string, domainRules: string = '') {
        console.log('[CVProcessorV2] starting full process');
        // 1. Extract
        let extraction;
        let extractionRaw = '';
        try {
            extraction = await this.extractor.extract(rawText);
            extractionRaw = (extraction as any).rawResponse || '';
        } catch (e: any) {
            console.error('[CVProcessorV2] Extraction CRITICAL failure:', e);
            return { success: false, step: 'extraction', error: e.message };
        }

        if (!extraction.success || !extraction.cv) {
            console.error('[CVProcessorV2] Extraction failed:', extraction.error);
            return { success: false, step: 'extraction', error: extraction.error };
        }

        console.log('[CVProcessorV2] Extraction success');

        // 2. Audit
        let auditResult = null;
        let auditRaw = '';
        try {
            const audit = await this.auditor.audit(extraction.cv);
            auditRaw = (audit as any).rawResponse || '';
            if (audit.success && audit.audit) {
                auditResult = audit.audit;
                console.log('[CVProcessorV2] Audit success');
            } else {
                console.warn('[CVProcessorV2] Audit failed, continuing:', audit.error);
            }
        } catch (e: any) {
            console.error('[CVProcessorV2] Audit error (non-blocking):', e);
        }

        // 3. Gaps
        let gapsResult = null;
        let gapsRaw = '';
        if (auditResult) {
            try {
                const gaps = await this.gapGenerator.generate(auditResult, extraction.cv, domainRules);
                gapsRaw = (gaps as any).rawResponse || '';
                if (gaps.success && gaps.guidance) {
                    gapsResult = gaps.guidance;
                    console.log('[CVProcessorV2] Gaps success');
                } else {
                    console.warn('[CVProcessorV2] Gaps failed, continuing:', gaps.error);
                }
            } catch (e: any) {
                console.error('[CVProcessorV2] Gaps error (non-blocking):', e);
            }
        }

        return {
            success: true,
            cv: extraction.cv,
            audit: auditResult,
            gaps: gapsResult,
            extractionRaw,
            auditRaw,
            gapsRaw
        };
    }

    /**
     * Refines the CV by merging a patch.
     */
    async refine(currentCV: CanonicalCV, patch: Partial<CanonicalCV>) {
        const merged = this.merger.merge(currentCV, patch);

        // Re-audit after merge
        const audit = await this.auditor.audit(merged);
        const gaps = await this.gapGenerator.generate(audit.audit || {} as any, '');

        return {
            success: true,
            cv: merged,
            audit: audit.audit,
            gaps: gaps.success ? gaps.guidance : null,
        };
    }

    /**
     * Maps CanonicalCV (V2) to ComprehensiveCV (V1) for UI compatibility.
     */
    toComprehensiveCV(cv: CanonicalCV): any {
        return {
            ...cv,
            personal_info: {
                full_name: cv.identity?.full_name || '',
                email: cv.identity?.email || '',
                phone: cv.identity?.phone || '',
                location: cv.identity?.location || '',
                linkedin_url: cv.identity?.linkedin_url || '',
                website_url: cv.identity?.website_url || '',
                summary: cv.identity?.summary || '',
            },
            work_experience: (cv.experience || []).map(exp => ({
                ...exp,
                description: exp.description || '',
                achievements: exp.achievements || [],
            })),
            education: (cv.education || []).map(edu => ({
                ...edu,
                degree: edu.degree || '',
                field_of_study: edu.field_of_study || '',
                institution: edu.institution || '',
                description: edu.description || '',
            })),
            skills: cv.skills || [],
            projects: (cv.projects || []).map(p => ({
                ...p,
                name: p.name || '',
                description: p.description || '',
            })),
            certifications: (cv.certifications || []).map(c => ({
                ...c,
                name: c.name || '',
                issuer: (c as any).issuer || '',
            })),
            languages: [], // In V2/Llama extraction, these migrate to Skills often
            additional_sections: [
                ...(cv.publications || []).map(p => ({ id: p.id, title: p.title || 'Publication', content: p.content || '' })),
                ...(cv.awards || []).map(a => ({ id: a.id, title: a.title || 'Award', content: a.content || '' })),
                ...(cv.teaching || []).map(t => ({ id: t.id, title: t.title || 'Teaching', content: t.content || '' })),
                ...(cv.clinical || []).map(c => ({ id: c.id, title: c.title || 'Clinical', content: c.content || '' })),
                ...(cv.volunteering || []).map(v => ({ id: v.id, title: v.title || 'Volunteering', content: v.content || '' })),
                ...(cv.other || []).map(o => ({ id: o.id, title: o.title || 'Additional', content: o.content || '' })),
            ],
            metadata: cv.metadata || {},
        };
    }

    /**
     * Maps V2 Audit and Gaps to V1 CVGapAnalysis for UI compatibility.
     */
    toV1GapAnalysis(audit: any, gaps: any, selectedDomains: string[] = ['general']): any {
        const baseScore = audit?.overall_score || 0;

        const gapItems = (gaps?.items || []).map((item: any, idx: number) => ({
            id: `gap-v2-${idx}`,
            field_path: item.field,
            title_en: item.field?.replace(/_/g, ' ')?.toUpperCase() || 'Missing Field',
            title_fa: item.field || 'بخش نامشخص',
            description_en: item.guidance_text,
            description_fa: item.guidance_text,
            severity: 'important' as const,
            category: 'incomplete_content' as const,
            relevant_domains: selectedDomains,
            fix_guidance_en: item.guidance_text,
            fix_guidance_fa: item.guidance_text,
            fix_example_en: item.example,
            fix_example_fa: item.example,
            input_type: 'textarea' as const,
            is_skipped: false,
            is_resolved: false,
            can_skip: item.skip_allowed ?? true,
        }));

        const strengths = (audit?.items || [])
            .filter((item: any) => item && typeof item.quality_score === 'number' && item.quality_score >= 80)
            .map((item: any) => ({
                title_en: `${item.field_path.replace(/_/g, ' ')} Quality`,
                title_fa: item.field_path,
                description_en: `High quality content found in ${item.field_path}.`,
                description_fa: `محتوای با کیفیت در بخش ${item.field_path} شناسایی شد.`,
                relevant_domains: selectedDomains,
            }));

        return {
            selected_domains: selectedDomains,
            detected_domains: selectedDomains,
            overall_score: baseScore,
            domain_scores: Object.fromEntries(selectedDomains.map(d => [d, baseScore])),
            gaps: gapItems,
            strengths: strengths,
            analysis_summary: audit
                ? `Overall CV Score: ${baseScore}%. ${gapItems.length} gaps identified that need attention.`
                : 'CV extracted successfully. Deep analysis is currently unavailable.',
            general_recommendations: (audit?.items || []).flatMap((i: any) => i.recommendations || []).slice(0, 5),
        };
    }
}
