// ============================================
// Phase 3: Canonical Master CV
// Validate, version, and trace every data point
// ============================================

import { CanonicalCVState, CanonicalValidationResult } from '../types/pipeline.types';
import { validateCV } from '../schemas/cv-schemas';
import { v4 as uuidv4 } from 'uuid';

export interface CanonicalCVOptions {
  enableVersioning: boolean;
  enableTraceability: boolean;
}

export function createCanonicalCV(
  extractedData: any,
  options: CanonicalCVOptions = { enableVersioning: true, enableTraceability: true }
): CanonicalCVState {
  const validation = validateCV(extractedData);

  if (!validation.success) {
    console.warn('[Phase 3] CV validation warnings:', validation.errors);
  }

  const now = new Date();
  const cv = validation.data || extractedData;

  const sourceTrace = options.enableTraceability
    ? buildSourceTrace(cv)
    : [];

  return {
    cv,
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceTrace,
  };
}

export function updateCanonicalCV(
  currentState: CanonicalCVState,
  patches: any[],
  options: CanonicalCVOptions = { enableVersioning: true, enableTraceability: true }
): CanonicalCVState {
  const updatedCV = applyPatches(currentState.cv, patches);
  const validation = validateCV(updatedCV);

  if (!validation.success) {
    console.warn('[Phase 3] Update validation errors:', validation.errors);
  }

  const sourceTrace = options.enableTraceability
    ? [...currentState.sourceTrace, ...buildSourceTrace(updatedCV, 'merged')]
    : currentState.sourceTrace;

  return {
    cv: validation.data || updatedCV,
    version: currentState.version + 1,
    createdAt: currentState.createdAt,
    updatedAt: new Date(),
    sourceTrace,
  };
}

export function validateCanonicalCV(cv: any): CanonicalValidationResult {
  const validation = validateCV(cv);
  
  const errors: { field: string; message: string; code: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  if (!validation.success) {
    for (const err of validation.errors) {
      errors.push({
        field: err.path.join('.'),
        message: err.message,
        code: 'VALIDATION_ERROR',
      });
    }
  }

  if (!cv.personal_info?.full_name) {
    warnings.push({
      field: 'personal_info.full_name',
      message: 'Full name is recommended for professional CVs',
    });
  }

  if (!cv.work_experience?.length && !cv.education?.length) {
    errors.push({
      field: 'experience',
      message: 'At least work experience or education is required',
      code: 'MISSING_SECTION',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function buildSourceTrace(
  cv: any,
  source: 'extracted' | 'user_input' | 'merged' = 'extracted'
): { field: string; source: 'extracted' | 'user_input' | 'merged'; timestamp: Date }[] {
  const trace: { field: string; source: 'extracted' | 'user_input' | 'merged'; timestamp: Date }[] = [];
  const now = new Date();

  const sections = [
    'personal_info',
    'work_experience',
    'education',
    'skills',
    'certifications',
    'languages',
    'projects',
    'additional_sections',
  ];

  for (const section of sections) {
    if (cv[section]) {
      trace.push({
        field: section,
        source,
        timestamp: now,
      });
    }
  }

  return trace;
}

function applyPatches(cv: any, patches: any[]): any {
  const result = JSON.parse(JSON.stringify(cv));

  for (const patch of patches) {
    const { field, value } = patch;
    const parts = field.split('.');
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
  }

  return result;
}

export function getCVVersion(state: CanonicalCVState): number {
  return state.version;
}

export function rollbackToVersion(state: CanonicalCVState, targetVersion: number): CanonicalCVState {
  if (targetVersion < 1 || targetVersion > state.version) {
    throw new Error(`Invalid version: ${targetVersion}`);
  }

  return {
    ...state,
    version: targetVersion,
    updatedAt: new Date(),
  };
}

export const PHASE_3_CANONICAL_PROMPT = `Validate the extracted CV against the canonical schema.

Rules:
- Use Zod/AJV schema validation at every merge step
- Traceability: every field links back to source
- Versioning enabled for rollback

Input: Extracted CV JSON
Output: Validation result with errors and warnings`;
