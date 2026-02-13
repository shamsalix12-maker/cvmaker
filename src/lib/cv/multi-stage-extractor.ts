/**
 * Multi-Stage CV Extraction System
 * 
 * Problems solved:
 * 1. JSON Truncation - Split into small stages
 * 2. Data Loss - Validation + Retry
 * 3. Language Change - Language validation
 * 4. Refinement Data Loss - safeRefineCV
 */

import { AIProviderConfig, AICompletionOptions, BaseAIProvider } from '../ai/ai-provider';
import { CVDomainId } from '@/lib/types/cv-domain.types';
import { ComprehensiveCV } from '@/lib/types';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface ExtractionStage {
  name: string;
  maxTokens: number;
  buildPrompt: (rawText: string, domains: CVDomainId[], lang: string) => string;
  validate: (result: any) => boolean;
}

export interface StageResult {
  success: boolean;
  retries: number;
  data: any;
}

export interface MultiStageResult {
  extractedData: Partial<ComprehensiveCV>;
  gapAnalysis: any;
  stageResults: Record<string, StageResult>;
  validation: ValidationResult;
}

export interface ValidationResult {
  isComplete: boolean;
  warnings: string[];
  completeness: number;
  languageViolations: string[];
}

// ═══════════════════════════════════════════════════════════
// Stage Definitions
// ═══════════════════════════════════════════════════════════

const STAGES: ExtractionStage[] = [
  {
    name: 'personal_info',
    maxTokens: 4096,
    buildPrompt: buildPersonalInfoPrompt,
    validate: (r) => r && (r.full_name || r.email || r.phone),
  },
  {
    name: 'work_experience',
    maxTokens: 8192,
    buildPrompt: buildWorkExperiencePrompt,
    validate: (r) => Array.isArray(r),
  },
  {
    name: 'education_skills',
    maxTokens: 8192,
    buildPrompt: buildEducationSkillsPrompt,
    validate: (r) => r !== null && typeof r === 'object',
  },
  {
    name: 'gap_analysis',
    maxTokens: 4096,
    buildPrompt: buildGapAnalysisPrompt,
    validate: (r) => r && (r.gaps !== undefined || r.overall_score !== undefined),
  },
];

// ═══════════════════════════════════════════════════════════
// Main Multi-Stage Extraction Function
// ═══════════════════════════════════════════════════════════

export async function extractCVMultiStage(
  rawText: string,
  provider: any,
  config: AIProviderConfig,
  aiModel: string,
  selectedDomains: CVDomainId[],
  cvLanguage: string = 'en',
): Promise<MultiStageResult> {
  const stageResults: Record<string, StageResult> = {};
  const extractedData: any = {};
  let gapAnalysis: any = null;

  console.log('[Multi-Stage] Starting extraction for language:', cvLanguage);

  for (const stage of STAGES) {
    console.log(`[Multi-Stage] Starting stage: ${stage.name}`);
    
    let result: any = null;
    let retries = 0;
    const MAX_RETRIES = 2;

    while (retries < MAX_RETRIES && !result) {
      try {
        const stageConfig: AIProviderConfig = {
          ...config,
          maxTokens: stage.maxTokens,
        };

        const prompt = stage.buildPrompt(rawText, selectedDomains, cvLanguage);

        const options: AICompletionOptions = {
          model: aiModel,
          messages: [
            {
              id: `sys-${stage.name}`,
              role: 'system',
              content: getStageSystemPrompt(stage.name, cvLanguage),
              timestamp: new Date().toISOString(),
            },
            {
              id: `usr-${stage.name}`,
              role: 'user',
              content: prompt,
              timestamp: new Date().toISOString(),
            },
          ],
          jsonMode: true,
        };

        const response = await provider.complete(stageConfig, options);
        
        console.log(`[Multi-Stage] ${stage.name} response length: ${response?.length || 0}`);

        // JSON Repair
        const parsed = safeParseJSON(response);

        if (parsed && stage.validate(parsed)) {
          result = parsed;
          console.log(`[Multi-Stage] ${stage.name} ✅ SUCCESS`);
        } else {
          console.warn(`[Multi-Stage] ${stage.name} ⚠️ Validation failed, retry ${retries + 1}`);
          retries++;
        }
      } catch (error) {
        console.error(`[Multi-Stage] ${stage.name} ❌ Error:`, error);
        retries++;
      }
    }

    stageResults[stage.name] = { 
      success: !!result, 
      retries,
      data: result 
    };

    // ذخیره نتایج
    if (stage.name === 'personal_info') {
      extractedData.personal_info = result || {};
    } else if (stage.name === 'work_experience') {
      extractedData.work_experience = result || [];
    } else if (stage.name === 'education_skills') {
      if (result) {
        extractedData.education = result.education || [];
        extractedData.skills = result.skills || [];
        extractedData.languages = result.languages || [];
        extractedData.certifications = result.certifications || [];
        extractedData.projects = result.projects || [];
      }
    } else if (stage.name === 'gap_analysis') {
      gapAnalysis = result;
    }
  }

  // Validation
  const validation = validateExtraction(extractedData, rawText, cvLanguage);

  return { 
    extractedData, 
    gapAnalysis, 
    stageResults, 
    validation 
  };
}

// ═══════════════════════════════════════════════════════════
// Stage Prompts
// ═══════════════════════════════════════════════════════════

function getStageSystemPrompt(stageName: string, cvLanguage: string): string {
  const lang = cvLanguage === 'fa' ? 'Persian (Farsi)' : 'English';
  
  return `You are a CV parser. Extract ONLY the requested section.

CRITICAL RULES:
1. Return valid JSON only - no markdown, no code blocks, no explanations
2. Keep ALL content in ${lang} - DO NOT translate or change language
3. Extract EVERYTHING from the CV - do NOT skip any detail
4. If a field is missing, use null
5. NEVER summarize or shorten any content`;
}

function buildPersonalInfoPrompt(
  rawText: string, 
  _domains: CVDomainId[], 
  lang: string
): string {
  const langNote = lang === 'en' 
    ? 'IMPORTANT: This is an English CV. Keep ALL text in English. DO NOT translate to Persian or any other language.'
    : 'IMPORTANT: This is a Persian CV. Keep ALL text in Persian. DO NOT translate to English or any other language.';

  return `${langNote}

Extract ONLY personal information from this CV.

Return JSON in this EXACT format:
{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin_url": "string or null",
  "website_url": "string or null",
  "summary": "string or null - include the COMPLETE summary/objective, do not shorten"
}

CV TEXT:
---
${rawText}
---`;
}

function buildWorkExperiencePrompt(
  rawText: string, 
  _domains: CVDomainId[], 
  lang: string
): string {
  const langNote = lang === 'en'
    ? 'This is an English CV - keep ALL text in English.'
    : 'This is a Persian CV - keep ALL text in Persian.';

  return `${langNote}

Extract ALL work experience entries from this CV.

Return a JSON ARRAY. Each entry format:
[
  {
    "id": "work-1",
    "job_title": "string",
    "company": "string",
    "location": "string or null",
    "start_date": "string or null",
    "end_date": "string or null",
    "is_current": true/false,
    "description": "string - include ALL details, do NOT summarize",
    "achievements": ["string array"]
  }
]

CRITICAL: 
- Include EVERY work entry
- The "description" must contain ALL details from the CV
- Do NOT summarize or shorten anything
- Number entries: work-1, work-2, work-3...

CV TEXT:
---
${rawText}
---`;
}

function buildEducationSkillsPrompt(
  rawText: string, 
  _domains: CVDomainId[], 
  lang: string
): string {
  const langNote = lang === 'en'
    ? 'This is an English CV - keep ALL text in English.'
    : 'This is a Persian CV - keep ALL text in Persian.';

  return `${langNote}

Extract education, skills, languages, certifications, and projects from this CV.

Return JSON:
{
  "education": [
    {
      "id": "edu-1",
      "degree": "string",
      "field_of_study": "string",
      "institution": "string",
      "start_date": "string or null",
      "end_date": "string or null",
      "description": "string or null"
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "languages": [
    {"language": "string", "proficiency": "string"}
  ],
  "certifications": [
    {"name": "string", "issuer": "string or null", "date": "string or null"}
  ],
  "projects": [
    {"name": "string", "description": "string", "technologies": ["string"]}
  ]
}

Extract ALL skills, even if many. Do NOT skip any.

CV TEXT:
---
${rawText}
---`;
}

function buildGapAnalysisPrompt(
  rawText: string, 
  domains: CVDomainId[], 
  lang: string
): string {
  const langNote = lang === 'en'
    ? 'Respond in English.'
    : 'Respond in Persian (Farsi).';

  return `${langNote}

Analyze this CV for gaps and improvement areas.

Return JSON:
{
  "gaps": [
    {
      "id": "gap-1",
      "field": "field_name",
      "severity": "low|medium|high|critical",
      "message": "description",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "overall_score": 0-100
}

Check for:
- Missing sections (summary, skills, etc.)
- Incomplete entries
- Weak descriptions
- Missing achievements/metrics

CV TEXT:
---
${rawText}
---`;
}

// ═══════════════════════════════════════════════════════════
// JSON Repair (Enhanced)
// ═══════════════════════════════════════════════════════════

export function safeParseJSON(response: string): any {
  if (!response) return null;

  let jsonStr = response.trim();

  // Step 1: Remove markdown code blocks
  const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    jsonStr = markdownMatch[1].trim();
  } else {
    // Remove any leading/trailing ```
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '');
  }

  // Step 2: Try direct parse
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Continue to repair
  }

  // Step 3: Find JSON boundaries
  const firstBrace = jsonStr.indexOf('{');
  const firstBracket = jsonStr.indexOf('[');
  
  let start: number;
  let isArray = false;
  
  if (firstBrace === -1 && firstBracket === -1) {
    console.error('[JSON Repair] No JSON structure found');
    return null;
  }
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    start = firstBracket;
    isArray = true;
  } else {
    start = firstBrace;
  }
  
  jsonStr = jsonStr.substring(start);

  // Step 4: Repair
  jsonStr = repairTruncatedJSON(jsonStr, isArray);

  // Step 5: Final parse
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('[JSON Repair] Final parse failed:', (e as Error).message);
    console.error('[JSON Repair] Attempted (first 200 chars):', jsonStr.substring(0, 200));
    
    // Last resort: try to extract partial data
    return extractPartialJsonData(jsonStr);
  }
}

function repairTruncatedJSON(json: string, isArray: boolean): string {
  let str = json;

  // 1. Check for unclosed strings
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < str.length; i++) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (str[i] === '\\') {
      escapeNext = true;
      continue;
    }
    if (str[i] === '"') {
      inString = !inString;
    }
  }
  
  // Close unclosed string
  if (inString) {
    str += '"';
  }

  // 2. Count brackets
  let braces = 0;
  let brackets = 0;
  inString = false;
  
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\' && inString) { i++; continue; }
    if (str[i] === '"') { inString = !inString; continue; }
    if (inString) continue;
    
    if (str[i] === '{') braces++;
    else if (str[i] === '}') braces--;
    else if (str[i] === '[') brackets++;
    else if (str[i] === ']') brackets--;
  }

  // 3. Remove trailing comma
  str = str.replace(/,\s*$/, '');

  // 4. Remove incomplete key-value pairs at end (e.g., "field": )
  str = str.replace(/,?\s*"[^"]*"\s*:\s*$/g, '');

  // 5. Close brackets
  // Close arrays first
  while (brackets > 0) {
    str += ']';
    brackets--;
  }
  // Then objects
  while (braces > 0) {
    str += '}';
    braces--;
  }

  return str;
}

function extractPartialJsonData(json: string): any {
  const result: any = {};
  
  try {
    // Try to extract personal_info fields
    const nameMatch = json.match(/"full_name"\s*:\s*"([^"]*)"/);
    const emailMatch = json.match(/"email"\s*:\s*"([^"]*)"/);
    const phoneMatch = json.match(/"phone"\s*:\s*"([^"]*)"/);
    
    if (nameMatch || emailMatch || phoneMatch) {
      result.personal_info = {
        full_name: nameMatch?.[1] || null,
        email: emailMatch?.[1] || null,
        phone: phoneMatch?.[1] || null,
      };
    }

    // Try to extract work experience titles
    const jobMatches = [...json.matchAll(/"job_title"\s*:\s*"([^"]*)"/g)];
    if (jobMatches.length > 0) {
      result.work_experience = jobMatches.map((m, i) => ({
        id: `work-${i + 1}`,
        job_title: m[1],
        company: null,
        description: null,
      }));
    }

    // Try to extract skills
    const skillsMatch = json.match(/"skills"\s*:\s*\[((?:[^[\]]|\[(?:[^[\]]|\[[^[\]]*\])*\])*)\]/);
    if (skillsMatch) {
      const skillsStr = skillsMatch[1];
      const skillValues = skillsStr.match(/"([^"]*)"/g);
      if (skillValues) {
        result.skills = skillValues.map(s => s.replace(/"/g, ''));
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════

export function validateExtraction(
  extracted: any, 
  rawText: string,
  expectedLanguage: string
): ValidationResult {
  const warnings: string[] = [];
  const languageViolations: string[] = [];
  let score = 0;
  const maxScore = 100;

  // Personal Info (20 points)
  if (extracted.personal_info?.full_name) score += 5;
  else warnings.push('Missing full_name');
  
  if (extracted.personal_info?.email) score += 5;
  else warnings.push('Missing email');
  
  if (extracted.personal_info?.phone) score += 5;
  
  if (extracted.personal_info?.summary && extracted.personal_info.summary.length > 20) score += 5;
  else warnings.push('Missing or short summary');

  // Work Experience (30 points)
  const workCount = extracted.work_experience?.length || 0;
  const hasWorkKeywords = /experience|work|position|role|job|employ|manager|director|engineer|developer|professor|lecturer/i.test(rawText);
  
  if (workCount > 0) {
    score += 20;
    // Check quality
    const avgDescLength = extracted.work_experience.reduce(
      (sum: number, w: any) => sum + (w.description?.length || 0), 0
    ) / workCount;
    
    if (avgDescLength > 50) score += 10;
    else warnings.push('Work experiences have short descriptions');
  } else if (hasWorkKeywords) {
    warnings.push('CV mentions work experience but none extracted');
  }

  // Education (20 points)
  const eduCount = extracted.education?.length || 0;
  const hasEduKeywords = /education|university|degree|bachelor|master|phd|diploma|school|college/i.test(rawText);
  
  if (eduCount > 0) {
    score += 20;
  } else if (hasEduKeywords) {
    warnings.push('CV mentions education but none extracted');
  }

  // Skills (20 points)
  const skillCount = extracted.skills?.length || (extracted.skills?.technical?.length || 0);
  if (skillCount > 0) {
    score += 20;
  } else {
    warnings.push('No skills extracted');
  }

  // Language validation (10 points)
  const langResult = validateLanguage(extracted, expectedLanguage);
  languageViolations.push(...langResult.violations);
  if (langResult.isValid) {
    score += 10;
  } else {
    warnings.push('Language mismatch detected');
  }

  const completeness = Math.round((score / maxScore) * 100);

  return {
    isComplete: completeness >= 70 && workCount > 0,
    warnings,
    completeness,
    languageViolations,
  };
}

export function validateLanguage(
  data: any, 
  expectedLanguage: string
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Persian/Arabic Unicode ranges
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  // For English CV, check for Persian characters
  // For Persian CV, allow both Persian and English (technical terms)
  
  function checkValue(value: any, path: string): void {
    if (typeof value === 'string') {
      if (expectedLanguage === 'en' && persianRegex.test(value)) {
        // Allow Persian in specific fields for Persian names/locations
        const allowedPersianPaths = ['full_name', 'location', 'name'];
        const isAllowed = allowedPersianPaths.some(p => path.includes(p));
        if (!isAllowed && value.length > 10) {
          violations.push(`Persian text in ${path}: "${value.substring(0, 30)}..."`);
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => checkValue(item, `${path}[${i}]`));
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([k, v]) => checkValue(v, `${path}.${k}`));
    }
  }
  
  checkValue(data, 'root');
  
  return {
    isValid: violations.length === 0,
    violations,
  };
}

// ═══════════════════════════════════════════════════════════
// Safe Refinement - Prevents Data Loss
// ═══════════════════════════════════════════════════════════

export function safeRefineCV(
  originalCV: Partial<ComprehensiveCV>,
  refinedCV: Partial<ComprehensiveCV>
): Partial<ComprehensiveCV> {
  // Start with original data
  const result = JSON.parse(JSON.stringify(originalCV));

  // Personal Info: only fill empty fields
  if (refinedCV.personal_info) {
    if (!result.personal_info) result.personal_info = {};
    
    for (const [key, value] of Object.entries(refinedCV.personal_info)) {
      const currentValue = (result.personal_info as any)[key];
      // Only replace if current is empty/null and new has value
      if (value && (!currentValue || currentValue === '')) {
        (result.personal_info as any)[key] = value;
      }
    }
  }

  // Work Experience: NEVER delete, only add or enhance
  if (refinedCV.work_experience && refinedCV.work_experience.length > 0) {
    if (!result.work_experience) result.work_experience = [];
    
    for (const refinedWork of refinedCV.work_experience) {
      const existingIdx = result.work_experience.findIndex(
        (w: any) => w.id === refinedWork.id || 
                     (w.company === refinedWork.company && w.job_title === refinedWork.job_title)
      );
      
      if (existingIdx >= 0) {
        const existing = result.work_experience[existingIdx];
        // Only fill empty fields
        for (const [key, value] of Object.entries(refinedWork)) {
          if (value && (!existing[key] || existing[key] === '')) {
            existing[key] = value;
          }
        }
        // For description: only replace if new is longer
        if (refinedWork.description && 
            (!existing.description || refinedWork.description.length > existing.description.length)) {
          existing.description = refinedWork.description;
        }
      } else {
        // New entry - add it
        result.work_experience.push(refinedWork);
      }
    }
  }

  // Education: same logic
  if (refinedCV.education && refinedCV.education.length > 0) {
    if (!result.education) result.education = [];
    
    for (const refinedEdu of refinedCV.education) {
      const existingIdx = result.education.findIndex(
        (e: any) => e.id === refinedEdu.id || e.institution === refinedEdu.institution
      );
      
      if (existingIdx >= 0) {
        const existing = result.education[existingIdx];
        for (const [key, value] of Object.entries(refinedEdu)) {
          if (value && (!existing[key] || existing[key] === '')) {
            existing[key] = value;
          }
        }
      } else {
        result.education.push(refinedEdu);
      }
    }
  }

  // Skills: merge, never delete
  if (refinedCV.skills) {
    if (!result.skills) {
      result.skills = Array.isArray(refinedCV.skills) 
        ? refinedCV.skills 
        : [];
    } else {
      const existingSkills = new Set(
        (Array.isArray(result.skills) ? result.skills : []).map((s: any) => {
          if (typeof s === 'string') return s.toLowerCase();
          if (typeof s === 'object' && s !== null) return (s.name || '').toLowerCase();
          return '';
        })
      );
      
      const refinedSkills: any[] = Array.isArray(refinedCV.skills) ? refinedCV.skills : [];
      for (const skill of refinedSkills) {
        const skillName = typeof skill === 'string' 
          ? skill 
          : (typeof skill === 'object' && skill !== null ? (skill as any).name || '' : '');
        if (skillName && !existingSkills.has(skillName.toLowerCase())) {
          (result.skills as any[]).push(skill);
        }
      }
    }
  }

  // Languages: merge
  if (refinedCV.languages && refinedCV.languages.length > 0) {
    if (!result.languages) result.languages = [];
    const existingLangs = new Set(result.languages.map((l: any) => l.language?.toLowerCase()));
    
    for (const lang of refinedCV.languages) {
      if (!existingLangs.has(lang.language?.toLowerCase())) {
        result.languages.push(lang);
      }
    }
  }

  // Certifications: merge
  if (refinedCV.certifications && refinedCV.certifications.length > 0) {
    if (!result.certifications) result.certifications = [];
    result.certifications.push(...refinedCV.certifications);
  }

  // Projects: merge
  if (refinedCV.projects && refinedCV.projects.length > 0) {
    if (!result.projects) result.projects = [];
    result.projects.push(...refinedCV.projects);
  }

  // VALIDATION: Check for data loss
  const originalCounts = {
    work: originalCV.work_experience?.length || 0,
    edu: originalCV.education?.length || 0,
    skills: Array.isArray(originalCV.skills) ? originalCV.skills.length : 0,
    langs: originalCV.languages?.length || 0,
  };

  const resultCounts = {
    work: result.work_experience?.length || 0,
    edu: result.education?.length || 0,
    skills: Array.isArray(result.skills) ? result.skills.length : 0,
    langs: result.languages?.length || 0,
  };

  // If counts decreased, restore from original
  if (resultCounts.work < originalCounts.work) {
    console.error('[SafeRefine] Work count decreased, restoring original');
    result.work_experience = originalCV.work_experience;
  }
  if (resultCounts.edu < originalCounts.edu) {
    console.error('[SafeRefine] Education count decreased, restoring original');
    result.education = originalCV.education;
  }
  if (resultCounts.skills < originalCounts.skills) {
    console.error('[SafeRefine] Skills count decreased, restoring original');
    result.skills = originalCV.skills;
  }
  if (resultCounts.langs < originalCounts.langs) {
    console.error('[SafeRefine] Languages count decreased, restoring original');
    result.languages = originalCV.languages;
  }

  return result;
}
