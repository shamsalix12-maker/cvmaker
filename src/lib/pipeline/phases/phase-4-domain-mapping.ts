// ============================================
// Phase 4: Domain Mapping Engine
// Map canonical CV to user-selected domains
// ============================================

import { DomainMappingResult, DomainRule } from '../types/pipeline.types';
import { CVDomainId, CVDomain } from '../../types/cv-domain.types';
import { CV_DOMAINS } from '../../cv/cv-domains';

export function mapToDomains(
  cv: any,
  selectedDomains: CVDomainId[]
): DomainMappingResult {
  const domainRules: DomainRule[] = [];
  let multiDomainCompatibility = true;

  for (const domainId of selectedDomains) {
    const domain = CV_DOMAINS[domainId];
    if (domain) {
      const rule = createDomainRule(domain);
      domainRules.push(rule);
    }
  }

  if (selectedDomains.length > 1) {
    multiDomainCompatibility = checkMultiDomainCompatibility(cv, selectedDomains);
  }

  return {
    domainMappedCV: cv,
    domainRules,
    multiDomainCompatibility,
  };
}

function createDomainRule(domain: CVDomain): DomainRule {
  const requiredFields = [...domain.critical_fields];
  
  const optionalFields: string[] = [];
  for (const section of domain.specific_sections) {
    if (!section.is_required) {
      optionalFields.push(`additional_sections.${section.id}`);
    }
  }

  const weights: Record<string, number> = {};
  for (const field of domain.critical_fields) {
    weights[field] = 2.0;
  }
  for (const section of domain.specific_sections) {
    weights[`additional_sections.${section.id}`] = section.is_required ? 1.5 : 0.5;
  }

  return {
    domainId: domain.id as CVDomainId,
    requiredFields,
    optionalFields,
    weights,
  };
}

function checkMultiDomainCompatibility(cv: any, domains: CVDomainId[]): boolean {
  let commonFields: Set<string> | null = null;
  
  for (const domainId of domains) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;
    
    const domainFields = new Set(domain.critical_fields);
    
    if (commonFields === null) {
      commonFields = domainFields;
    } else {
      const newCommon = new Set<string>();
      for (const field of commonFields) {
        if (domainFields.has(field)) {
          newCommon.add(field);
        }
      }
      commonFields = newCommon;
    }
  }

  return commonFields !== null && commonFields.size > 0;
}

export function getRequiredFieldsForDomain(domainId: CVDomainId): string[] {
  const domain = CV_DOMAINS[domainId];
  return domain?.critical_fields || [];
}

export function getOptionalFieldsForDomain(domainId: CVDomainId): string[] {
  const domain = CV_DOMAINS[domainId];
  if (!domain) return [];
  
  return domain.specific_sections
    .filter(s => !s.is_required)
    .map(s => `additional_sections.${s.id}`);
}

export function calculateDomainRelevance(cv: any, domainId: CVDomainId): number {
  const domain = CV_DOMAINS[domainId];
  if (!domain) return 0;

  let score = 0;
  let maxScore = 0;

  for (const field of domain.critical_fields) {
    maxScore += 2;
    const value = getNestedValue(cv, field);
    if (isFieldPopulated(value)) {
      score += 2;
    }
  }

  for (const section of domain.specific_sections) {
    maxScore += section.is_required ? 1.5 : 0.5;
    const sectionValue = findSectionInCV(cv, section.id);
    if (sectionValue) {
      score += section.is_required ? 1.5 : 0.5;
    }
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
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

function isFieldPopulated(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function findSectionInCV(cv: any, sectionId: string): unknown {
  if (cv.additional_sections) {
    const found = cv.additional_sections.find(
      (s: any) => s.id === sectionId || s.title?.toLowerCase().includes(sectionId.replace(/_/g, ' '))
    );
    if (found && found.content?.trim()) {
      return found.content;
    }
  }
  return null;
}

export const PHASE_4_DOMAIN_MAPPING_PROMPT = `Map the canonical CV to user-selected domains.

Tasks:
- Identify required and optional fields per domain
- Overlay domain-specific rules
- Ensure multi-domain compatibility

Input: Canonical CV + Selected Domains
Output: Domain-mapped CV with relevance scores`;
