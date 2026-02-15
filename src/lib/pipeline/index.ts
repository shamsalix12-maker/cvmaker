// ============================================
// Pipeline Index - Comprehensive CV Processor v2.0
// ============================================

export * from './schemas/cv-schemas';

export * from './phases/phase-0-analysis';
export * from './phases/phase-1-ingestion';
export * from './phases/phase-2-extraction';
export * from './phases/phase-3-canonical';
export * from './phases/phase-4-domain-mapping';
export * from './phases/phase-5-assessment';
export * from './phases/phase-6-gap-intelligence';
export * from './phases/phase-7-gap-filling';
export * from './phases/phase-8-rendering';

export * from './orchestrator/pipeline-orchestrator';

export type {
  PipelineContext,
  PipelineResults,
  PipelineConfig,
  PipelinePhase,
  PipelinePhaseResult,
  IngestionResult,
  IngestionMetadata,
  ExtractionResult,
  CanonicalCVState,
  SourceTrace,
  CanonicalValidationResult,
  ValidationError,
  ValidationWarning,
  DomainMappingResult,
  DomainRule,
  AssessmentResult,
  FieldAudit,
  GapGuidance,
  GapIntelligenceResult,
  GapPatch,
  GapFillingResult,
  RenderRequest,
  RenderResult,
} from './types/pipeline.types';
