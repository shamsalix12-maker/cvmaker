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
        // 1. Extract
        const extraction = await this.extractor.extract(rawText);
        if (!extraction.success || !extraction.cv) {
            return { success: false, step: 'extraction', error: extraction.error };
        }

        // 2. Audit
        const audit = await this.auditor.audit(extraction.cv);
        if (!audit.success || !audit.audit) {
            return { success: true, cv: extraction.cv, auditError: audit.error };
        }

        // 3. Gaps
        const gaps = await this.gapGenerator.generate(audit.audit, domainRules);

        return {
            success: true,
            cv: extraction.cv,
            audit: audit.audit,
            gaps: gaps.success ? gaps.guidance : null,
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
                full_name: cv.identity.full_name,
                email: cv.identity.email,
                phone: cv.identity.phone,
                location: cv.identity.location,
                linkedin_url: cv.identity.linkedin_url,
                summary: cv.identity.summary,
            },
            work_experience: cv.experience,
            // education, skills, projects, certifications are the same
        };
    }
}
