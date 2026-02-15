// ============================================
// Phase 5: Quantitative & Qualitative Assessment
// Check coverage and quality of each field
// ============================================

import { AssessmentResult, FieldAudit } from '../types/pipeline.types';
import { CVDomainId } from '../../types/cv-domain.types';
import { assessFieldQuality, validateForDomains } from '../../cv/cv-validator';

export function assessCV(
  cv: any,
  selectedDomains: CVDomainId[]
): AssessmentResult {
  const fieldAudits: FieldAudit[] = [];

  const baseFields = [
    'personal_info.full_name',
    'personal_info.email',
    'personal_info.phone',
    'personal_info.summary',
    'work_experience',
    'education',
    'skills',
    'certifications',
    'languages',
    'projects',
  ];

  for (const fieldPath of baseFields) {
    const value = getNestedValue(cv, fieldPath);
    const quality = assessFieldQuality(fieldPath, value);

    fieldAudits.push({
      fieldPath,
      exists: quality.quality !== 'empty',
      completenessScore: quality.score,
      qualityScore: quality.score,
      issues: quality.issues,
      recommendations: quality.suggestions_en,
    });
  }

  const domainResults = validateForDomains(cv, selectedDomains);
  
  for (const domainResult of domainResults) {
    for (const assessment of domainResult.quality_assessments) {
      const existingAudit = fieldAudits.find(a => a.fieldPath === assessment.field_path);
      if (!existingAudit) {
        fieldAudits.push({
          fieldPath: assessment.field_path,
          exists: assessment.quality !== 'empty',
          completenessScore: assessment.score,
          qualityScore: assessment.score,
          issues: assessment.issues,
          recommendations: assessment.suggestions_en,
        });
      }
    }
  }

  const coverageScore = calculateCoverageScore(fieldAudits);
  const overallQuality = calculateOverallQuality(fieldAudits);

  return {
    fieldAudits,
    coverageScore,
    overallQuality,
  };
}

function getNestedValue(obj: any, path: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function calculateCoverageScore(audits: FieldAudit[]): number {
  if (audits.length === 0) return 0;
  
  const totalScore = audits.reduce((sum, audit) => sum + audit.completenessScore, 0);
  return Math.round(totalScore / audits.length);
}

function calculateOverallQuality(audits: FieldAudit[]): 'empty' | 'weak' | 'fair' | 'good' | 'excellent' {
  const avgScore = calculateCoverageScore(audits);
  
  if (avgScore >= 80) return 'excellent';
  if (avgScore >= 60) return 'good';
  if (avgScore >= 30) return 'fair';
  if (avgScore >= 1) return 'weak';
  return 'empty';
}

export const PHASE_5_ASSESSMENT_PROMPT = `Evaluate each field of the provided canonical CV for completeness and quality.

Output JSON:
{
  "fieldAudits": [
    {
      "fieldPath": string,
      "exists": boolean,
      "completenessScore": number (0-100),
      "qualityScore": number (0-100),
      "issues": string[],
      "recommendations": string[]
    }
  ],
  "coverageScore": number,
  "overallQuality": "empty" | "weak" | "fair" | "good" | "excellent"
}

Rules:
- Only assessment, no rewriting
- Do not invent or add any data
- Focus on identifying gaps and quality issues`;
