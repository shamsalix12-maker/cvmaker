// ============================================
// Pipeline Types - Comprehensive CV Processor v2.0
// ============================================

import { CVDomainId, CVGapAnalysis } from '../../types/cv-domain.types';
import { ComprehensiveCV } from '../../types';

// ─── Phase 0: Project Analysis ───

export interface ProjectAnalysisResult {
  modules: ModuleInfo[];
  dependencies: DependencyInfo[];
  reusableComponents: ReusableComponent[];
  conflictRisks: ConflictRisk[];
  recommendations: string[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  exports: string[];
  dependencies: string[];
}

export interface DependencyInfo {
  from: string;
  to: string;
  type: 'import' | 'export' | 'api';
}

export interface ReusableComponent {
  name: string;
  path: string;
  description: string;
  canReuse: boolean;
}

export interface ConflictRisk {
  area: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// ─── Phase 1: Ingestion ───

export interface IngestionResult {
  rawText: string;
  sourceFormat: 'pdf' | 'docx' | 'txt' | 'markdown' | 'raw';
  metadata: IngestionMetadata;
}

export interface IngestionMetadata {
  filename?: string;
  fileSize?: number;
  encoding: string;
  language?: string;
  pageCount?: number;
}

// ─── Phase 2: Blind Structured Extraction ───

export interface ExtractionResult {
  extractedData: Partial<ComprehensiveCV>;
  confidence: number;
  detectedLanguage: string;
  extractionNotes: string;
  rawSource: string;
}

// ─── Phase 3: Canonical Master CV ───

export interface CanonicalCVState {
  cv: ComprehensiveCV;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  sourceTrace: SourceTrace[];
}

export interface SourceTrace {
  field: string;
  source: 'extracted' | 'user_input' | 'merged';
  sourceFile?: string;
  timestamp: Date;
}

export interface CanonicalValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

// ─── Phase 4: Domain Mapping ───

export interface DomainMappingResult {
  domainMappedCV: ComprehensiveCV;
  domainRules: DomainRule[];
  multiDomainCompatibility: boolean;
}

export interface DomainRule {
  domainId: CVDomainId;
  requiredFields: string[];
  optionalFields: string[];
  weights: Record<string, number>;
}

// ─── Phase 5: Assessment ───

export interface AssessmentResult {
  fieldAudits: FieldAudit[];
  coverageScore: number;
  overallQuality: 'empty' | 'weak' | 'fair' | 'good' | 'excellent';
}

export interface FieldAudit {
  fieldPath: string;
  exists: boolean;
  completenessScore: number;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
}

// ─── Phase 6: Gap Intelligence ───

export interface GapGuidance {
  field: string;
  guidanceText: string;
  guidanceTextFa?: string;
  example: string;
  exampleFa?: string;
  skipAllowed: boolean;
}

export interface GapIntelligenceResult {
  gapGuidance: GapGuidance[];
  prioritizedGaps: string[];
  domainSpecificGuidance: Record<CVDomainId, GapGuidance[]>;
}

// ─── Phase 7: Gap Filling ───

export interface GapPatch {
  field: string;
  value: any;
  source: 'user_input';
  timestamp: Date;
}

export interface GapFillingResult {
  updatedCV: ComprehensiveCV;
  patches: GapPatch[];
  versionBump: number;
}

// ─── Phase 8: Final Rendering ───

export interface RenderRequest {
  cv: ComprehensiveCV;
  domains: CVDomainId[];
  format: 'markdown' | 'docx' | 'pdf';
  language: 'en' | 'fa';
  templateId?: string;
}

export interface RenderResult {
  output: string;
  format: 'markdown' | 'docx' | 'pdf';
  metadata: {
    wordCount: number;
    sectionCount: number;
    domainCoverage: Record<CVDomainId, number>;
  };
}

// ─── Pipeline Orchestrator Types ───

export interface PipelineContext {
  userId: string;
  sessionId: string;
  currentPhase: number;
  results: Partial<PipelineResults>;
  config: PipelineConfig;
}

export interface PipelineResults {
  projectAnalysis?: ProjectAnalysisResult;
  ingestion?: IngestionResult;
  extraction?: ExtractionResult;
  canonicalCV?: CanonicalCVState;
  domainMapping?: DomainMappingResult;
  assessment?: AssessmentResult;
  gapIntelligence?: GapIntelligenceResult;
  gapFilling?: GapFillingResult;
  rendering?: RenderResult;
}

export interface PipelineConfig {
  selectedDomains: CVDomainId[];
  cvLanguage: 'en' | 'fa';
  aiProvider?: string;
  aiModel?: string;
  enableVersioning: boolean;
  enableTraceability: boolean;
}

export type PipelinePhase = 
  | 'analysis'
  | 'ingestion'
  | 'extraction'
  | 'canonical'
  | 'domain_mapping'
  | 'assessment'
  | 'gap_intelligence'
  | 'gap_filling'
  | 'rendering';

export interface PipelinePhaseResult {
  phase: PipelinePhase;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}
