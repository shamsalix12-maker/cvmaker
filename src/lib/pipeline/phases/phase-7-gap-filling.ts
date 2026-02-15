// ============================================
// Phase 7: Gap Filling by User
// Collect additional data from user and merge into canonical CV
// ============================================

import { GapFillingResult, GapPatch } from '../types/pipeline.types';
import { validateCV } from '../schemas/cv-schemas';

export interface GapResolution {
  field: string;
  value: any;
}

export function fillGaps(
  currentCV: any,
  resolutions: GapResolution[]
): GapFillingResult {
  const patches: GapPatch[] = [];
  const now = new Date();

  let updatedCV = JSON.parse(JSON.stringify(currentCV));

  for (const resolution of resolutions) {
    const patch = applyResolution(updatedCV, resolution);
    if (patch) {
      patches.push({
        ...patch,
        timestamp: now,
      });
    }
  }

  const validation = validateCV(updatedCV);

  if (!validation.success) {
    console.warn('[Phase 7] Validation errors after gap filling:', validation.errors);
  }

  return {
    updatedCV: validation.data || updatedCV,
    patches,
    versionBump: 1,
  };
}

function applyResolution(cv: any, resolution: GapResolution): { field: string; value: any; source: 'user_input' } | null {
  const { field, value } = resolution;
  const parts = field.split('.');
  
  let current = cv;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  const lastPart = parts[parts.length - 1];

  if (parts.length === 1) {
    if (Array.isArray(cv)) {
      const index = parseInt(lastPart, 10);
      if (!isNaN(index)) {
        cv[index] = value;
      }
    } else {
      current[lastPart] = value;
    }
  } else {
    if (lastPart === 'push' && Array.isArray(current[parts[parts.length - 2]])) {
      current[parts[parts.length - 2]].push(value);
    } else {
      current[lastPart] = value;
    }
  }

  return {
    field,
    value,
    source: 'user_input',
  };
}

export function mergeUserInput(
  canonicalCV: any,
  userInputs: Record<string, any>
): any {
  const updatedCV = JSON.parse(JSON.stringify(canonicalCV));

  for (const [fieldPath, value] of Object.entries(userInputs)) {
    if (value !== undefined && value !== null && value !== '') {
      setNestedValue(updatedCV, fieldPath, value);
    }
  }

  return updatedCV;
}

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }

  current[parts[parts.length - 1]] = value;
}

export const PHASE_7_GAP_FILLING_PROMPT = `Collect additional data from user and merge into canonical CV.

Tasks:
- Validate user inputs using schema
- Merge patches into canonical CV
- Update version and maintain traceability

Input: Canonical CV + User Resolutions
Output: Updated Canonical CV with version bump`;
