import {
    CVDomainId,
    CVGapAnalysis,
    SuggestedImprovement,
    TranslationApplied
} from '@/lib/types/cv-domain.types';
import {
    ComprehensiveCV,
    CVExtractionRequest,
    AIProviderName,
    CVFieldStatus
} from '@/lib/types';

export enum CVExtractionStage {
    PERSONAL_INFO = 'personal_info',
    WORK_EXPERIENCE = 'work_experience',
    EDUCATION = 'education',
    SKILLS = 'skills',
    OTHERS = 'others',
    FULL = 'full'
}

export interface EnhancedCVExtractionResult {
    success: boolean;
    cv: Partial<ComprehensiveCV> | null;
    fieldStatuses: CVFieldStatus[];
    confidence: number;
    rawText: string;
    aiProvider: AIProviderName;
    aiModel: string;
    extractionNotes: string;
    gapAnalysis: CVGapAnalysis | null;
    detectedDomains: { domain: CVDomainId; score: number }[];
    metadata: any;
    suggestedImprovements: SuggestedImprovement[];
    translationsApplied: TranslationApplied[];
    cvLanguage?: string;
    managerVersion?: string;
    extractionStage?: CVExtractionStage;
    error?: string;
}

export interface CVRefinementRequest {
    currentCV: Partial<ComprehensiveCV>;
    resolvedGaps: { gapId: string; userInput: string }[];
    additionalText?: string;
    instructions?: string;
    selectedDomains: CVDomainId[];
    cvLanguage?: string;
    provider?: string;
    model?: string;
}

export interface CVManager {
    readonly id: string;
    readonly name: string;
    readonly version: string;

    extract(request: CVExtractionRequest): Promise<EnhancedCVExtractionResult>;
    refine(request: CVRefinementRequest): Promise<EnhancedCVExtractionResult>;
}
