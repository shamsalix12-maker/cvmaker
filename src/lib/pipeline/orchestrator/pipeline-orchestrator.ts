// ============================================
// Pipeline Orchestrator
// Executes all 9 phases in sequence
// ============================================

import { PipelineContext, PipelineResults, PipelineConfig } from '../types/pipeline.types';
import { CVDomainId } from '../../types/cv-domain.types';
import { ComprehensiveCV } from '../../types';

import { analyzeProject } from '../phases/phase-0-analysis';
import { ingestFile, ingestText } from '../phases/phase-1-ingestion';
import { extractBlindStructured } from '../phases/phase-2-extraction';
import { createCanonicalCV, updateCanonicalCV, validateCanonicalCV } from '../phases/phase-3-canonical';
import { mapToDomains } from '../phases/phase-4-domain-mapping';
import { assessCV } from '../phases/phase-5-assessment';
import { generateGapIntelligence } from '../phases/phase-6-gap-intelligence';
import { fillGaps } from '../phases/phase-7-gap-filling';
import { renderCV } from '../phases/phase-8-rendering';

export class CVPipelineOrchestrator {
  private context: PipelineContext;
  private startTime: number;
  private input: { file?: Buffer; text?: string; filename?: string };

  constructor(
    userId: string,
    input: { file?: Buffer; text?: string; filename?: string },
    config: PipelineConfig
  ) {
    this.input = input;
    this.context = {
      userId,
      sessionId: crypto.randomUUID(),
      currentPhase: 0,
      results: {},
      config,
    };
    this.startTime = Date.now();
  }

  async execute(): Promise<PipelineResults> {
    console.log(`[Pipeline] Starting execution for user ${this.context.userId}`);

    try {
      await this.executePhase0();
      await this.executePhase1();
      await this.executePhase2();
      await this.executePhase3();
      await this.executePhase4();
      await this.executePhase5();
      await this.executePhase6();
      
      console.log('[Pipeline] Pipeline execution completed successfully');
      return this.context.results;
    } catch (error) {
      console.error('[Pipeline] Pipeline execution failed:', error);
      throw error;
    }
  }

  private async executePhase0(): Promise<void> {
    console.log('[Pipeline] Phase 0: Project Analysis');
    
    const result = await analyzeProject(process.cwd());
    this.context.results.projectAnalysis = result;
    this.context.currentPhase = 0;
    
    console.log(`[Pipeline] Phase 0 complete: Found ${result.modules.length} modules`);
  }

  private async executePhase1(): Promise<void> {
    console.log('[Pipeline] Phase 1: Ingestion');
    
    let result;
    
    if (this.input.file) {
      result = await ingestFile(this.input.file, this.input.filename || 'upload');
    } else if (this.input.text) {
      result = await ingestText(this.input.text, 'raw');
    } else {
      throw new Error('No input provided');
    }
    
    this.context.results.ingestion = result;
    this.context.currentPhase = 1;
    
    console.log(`[Pipeline] Phase 1 complete: Extracted ${result.rawText.length} characters`);
  }

  private async executePhase2(): Promise<void> {
    console.log('[Pipeline] Phase 2: Blind Structured Extraction');
    
    const ingestion = this.context.results.ingestion;
    if (!ingestion) throw new Error('Phase 1 not complete');
    
    const config = this.context.config;
    if (!config.aiProvider || !config.aiModel) {
      throw new Error('AI provider and model required');
    }
    
    const extraction = await extractBlindStructured(ingestion.rawText, {
      aiProvider: config.aiProvider as 'openai' | 'anthropic' | 'google',
      aiModel: config.aiModel,
      apiKey: (config as any).apiKey,
    });
    
    this.context.results.extraction = extraction;
    this.context.currentPhase = 2;
    
    console.log(`[Pipeline] Phase 2 complete: Confidence ${extraction.confidence}%`);
  }

  private async executePhase3(): Promise<void> {
    console.log('[Pipeline] Phase 3: Canonical Master CV');
    
    const extraction = this.context.results.extraction;
    if (!extraction) throw new Error('Phase 2 not complete');
    
    const canonical = createCanonicalCV(extraction.extractedData, {
      enableVersioning: this.context.config.enableVersioning,
      enableTraceability: this.context.config.enableTraceability,
    });
    
    const validation = validateCanonicalCV(canonical.cv);
    
    this.context.results.canonicalCV = canonical;
    this.context.currentPhase = 3;
    
    console.log(`[Pipeline] Phase 3 complete: Version ${canonical.version}, Valid: ${validation.isValid}`);
  }

  private async executePhase4(): Promise<void> {
    console.log('[Pipeline] Phase 4: Domain Mapping');
    
    const canonical = this.context.results.canonicalCV;
    if (!canonical) throw new Error('Phase 3 not complete');
    
    const domainMapping = mapToDomains(canonical.cv, this.context.config.selectedDomains);
    
    this.context.results.domainMapping = domainMapping;
    this.context.currentPhase = 4;
    
    console.log(`[Pipeline] Phase 4 complete: ${this.context.config.selectedDomains.length} domains`);
  }

  private async executePhase5(): Promise<void> {
    console.log('[Pipeline] Phase 5: Assessment');
    
    const canonical = this.context.results.canonicalCV;
    const domainMapping = this.context.results.domainMapping;
    if (!canonical || !domainMapping) throw new Error('Phase 3-4 not complete');
    
    const assessment = assessCV(canonical.cv, this.context.config.selectedDomains);
    
    this.context.results.assessment = assessment;
    this.context.currentPhase = 5;
    
    console.log(`[Pipeline] Phase 5 complete: Coverage ${assessment.coverageScore}%`);
  }

  private async executePhase6(): Promise<void> {
    console.log('[Pipeline] Phase 6: Gap Intelligence');
    
    const canonical = this.context.results.canonicalCV;
    const assessment = this.context.results.assessment;
    if (!canonical || !assessment) throw new Error('Phase 3-5 not complete');
    
    const gapIntelligence = generateGapIntelligence(
      canonical.cv,
      assessment,
      this.context.config.selectedDomains,
      this.context.config.cvLanguage
    );
    
    this.context.results.gapIntelligence = gapIntelligence;
    this.context.currentPhase = 6;
    
    console.log(`[Pipeline] Phase 6 complete: ${gapIntelligence.gapGuidance.length} gaps identified`);
  }

  async continueAfterGapFilling(resolutions: { field: string; value: any }[]): Promise<PipelineResults> {
    console.log('[Pipeline] Phase 7: Gap Filling');
    
    const canonical = this.context.results.canonicalCV;
    if (!canonical) throw new Error('Phase 3 not complete');
    
    const gapFilling = fillGaps(canonical.cv, resolutions);
    
    this.context.results.gapFilling = gapFilling;
    this.context.currentPhase = 7;
    
    await this.executePhase8();
    
    return this.context.results;
  }

  private async executePhase8(): Promise<void> {
    console.log('[Pipeline] Phase 8: Final Rendering');
    
    const canonical = this.context.results.canonicalCV;
    if (!canonical) throw new Error('Phase 3 not complete');
    
    const cvToRender = this.context.results.gapFilling?.updatedCV || canonical.cv;
    
    const rendering = await renderCV({
      cv: cvToRender,
      domains: this.context.config.selectedDomains,
      format: 'markdown',
      language: this.context.config.cvLanguage,
    });
    
    this.context.results.rendering = rendering;
    this.context.currentPhase = 8;
    
    console.log(`[Pipeline] Phase 8 complete: ${rendering.metadata.wordCount} words`);
  }

  getContext(): PipelineContext {
    return this.context;
  }

  getCurrentPhase(): number {
    return this.context.currentPhase;
  }

  getResults(): PipelineResults {
    return this.context.results;
  }
}

export async function runFullPipeline(
  userId: string,
  input: { file?: Buffer; text?: string; filename?: string },
  config: PipelineConfig & { apiKey: string }
): Promise<PipelineResults> {
  const orchestrator = new CVPipelineOrchestrator(userId, input, config);
  return orchestrator.execute();
}

export async function runPipelineWithGapFilling(
  userId: string,
  input: { file?: Buffer; text?: string; filename?: string },
  config: PipelineConfig & { apiKey: string },
  gapResolutions: { field: string; value: any }[]
): Promise<PipelineResults> {
  const orchestrator = new CVPipelineOrchestrator(userId, input, config);
  await orchestrator.execute();
  return orchestrator.continueAfterGapFilling(gapResolutions);
}
