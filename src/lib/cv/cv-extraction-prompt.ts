// ============================================
// src/lib/cv/cv-extraction-prompt.ts
// Domain-Aware CV Extraction & Gap Analysis Prompts
// ============================================

import { CVDomainId } from '@/lib/types/cv-domain.types';
import {
  CV_DOMAINS,
  getDomainSpecificSections,
  getCriticalFields,
} from './cv-domains';

// ═══════════════════════════════════════════
// پرامپت اصلی استخراج - نسخه Domain-Aware
// ═══════════════════════════════════════════

/**
 * ساخت پرامپت سیستم بر اساس حوزه‌های انتخابی
 * این پرامپت به AI می‌گوید:
 * ۱. چه اطلاعاتی استخراج کند
 * ۲. چه نواقصی بررسی کند
 * ۳. چه بخش‌های اختصاصی حوزه‌ای وجود دارد
 */
export function buildExtractionSystemPrompt(selectedDomains: CVDomainId[], cvLanguage: string = 'en'): string {
  const domains = selectedDomains.length > 0 ? selectedDomains : ['general' as CVDomainId];

  // نام حوزه‌ها
  const domainNames = domains
    .map(d => CV_DOMAINS[d]?.label_en || d)
    .join(', ');

  // بخش‌های اختصاصی حوزه‌ها
  const specificSections = getDomainSpecificSections(domains);

  // فیلدهای حیاتی
  const criticalFields = getCriticalFields(domains);

  // ساخت بخش domain_specific_sections در JSON schema
  const domainSectionsSchema = specificSections.length > 0
    ? buildDomainSectionsSchema(specificSections)
    : '';

  // ساخت بخش توضیحات حوزه‌ای
  const domainContext = buildDomainContextBlock(domains);

  // تعیین زبان CV
  const cvLangName = cvLanguage === 'fa' ? 'Persian (Farsi)' : 'English';

  return `You are an expert CV/Resume parser and career analyst.
You specialize in analyzing CVs for these career domains: ${domainNames}.

═══════════════════════════════════════════════════════════════
CRITICAL: CV LANGUAGE = ${cvLangName}
═══════════════════════════════════════════════════════════════
- The CV content MUST be in ${cvLangName} ONLY
- DO NOT translate or change the language of any CV content
- All extracted data MUST be in the SAME LANGUAGE as the original CV
- Gap titles and descriptions MUST be in ${cvLangName}
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
CRITICAL: EXTRACT EVERYTHING - NEVER TRUNCATE
═══════════════════════════════════════════════════════════════
- Extract ALL information from the CV - DO NOT skip or truncate
- If CV has 10 work experiences, extract ALL 10
- If a description is 500 words, include ALL 500 words
- NEVER summarize, condense, or shorten any content
- Include ALL skills, ALL certifications, ALL projects
- Preserve ALL details exactly as written in the CV
═══════════════════════════════════════════════════════════════

YOUR TASKS:
1. Extract ALL structured information from the CV text - COMPLETE EXTRACTION
2. Analyze CV quality specifically for the target domains
3. Identify gaps, weaknesses, and missing information
4. Provide specific, actionable guidance for each gap found
5. Identify strengths and positive aspects
6. ALL content must be in ${cvLangName}

RESPONSE FORMAT:
You MUST respond with valid JSON only. No markdown, no code blocks, no explanations outside JSON.

IMPORTANT: Your JSON response must be COMPLETE. Do NOT truncate. If response is too long, prioritize completing the extracted_data section fully.

JSON STRUCTURE:
{
  "extracted_data": {
    "personal_info": {
      "full_name": "string or null",
      "email": "string or null",
      "phone": "string or null",
      "location": "string or null",
      "linkedin_url": "string or null",
      "website_url": "string or null",
      "summary": "string or null"
    },
    "work_experience": [
      {
        "id": "work-1",
        "job_title": "string",
        "company": "string",
        "location": "string or null",
        "start_date": "YYYY-MM or null",
        "end_date": "YYYY-MM or null",
        "is_current": false,
        "description": "string",
        "achievements": ["string - one achievement per item"],
        "metrics": ["string - quantifiable results"]
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "degree": "string",
        "field_of_study": "string",
        "institution": "string",
        "location": "string or null",
        "start_date": "YYYY-MM or null",
        "end_date": "YYYY-MM or null",
        "gpa": "string or null",
        "description": "string or null",
        "relevant_coursework": ["string"]
      }
    ],
    "skills": {
      "technical": ["string"],
      "soft": ["string"],
      "tools": ["string"],
      "domain_specific": ["string"]
    },
    "certifications": [
      {
        "id": "cert-1",
        "name": "string",
        "issuer": "string",
        "date_obtained": "YYYY-MM or null",
        "expiry_date": "YYYY-MM or null",
        "credential_id": "string or null",
        "credential_url": "string or null"
      }
    ],
    "languages": [
      {
        "language": "string",
        "proficiency": "native | fluent | advanced | intermediate | beginner"
      }
    ],
    "projects": [
      {
        "id": "proj-1",
        "name": "string",
        "description": "string",
        "technologies": ["string"],
        "url": "string or null",
        "start_date": "YYYY-MM or null",
        "end_date": "YYYY-MM or null",
        "impact": "string or null"
      }
    ],${domainSectionsSchema}
    "additional_sections": [
      {
        "id": "add-1",
        "title": "string",
        "content": "string"
      }
    ]
  },
  "gap_analysis": {
    "overall_score": 0,
    "domain_relevance_scores": {
      ${domains.map(d => `"${d}": 0`).join(',\n      ')}
    },
    "detected_domains": ["string"],
    "gaps": [
      {
        "id": "gap-1",
        "field_path": "string",
        "severity": "critical | important | recommended | optional",
        "category": "missing_section | incomplete_content | weak_description | missing_metrics | formatting_issue | missing_keywords | domain_specific",
        "title_en": "string",
        "title_fa": "string",
        "description_en": "string",
        "description_fa": "string",
        "fix_guidance_en": "string",
        "fix_guidance_fa": "string",
        "fix_example_en": "string",
        "fix_example_fa": "string",
        "relevant_domains": ["string"],
        "input_type": "text | textarea | list | date | select | experience | education | certification | project | confirm",
        "suggested_value": "string or null",
        "current_value": "string or null",
        "can_skip": true
      }
    ],
    "strengths": [
      {
        "title_en": "string",
        "title_fa": "string",
        "description_en": "string",
        "description_fa": "string",
        "relevant_domains": ["string"]
      }
    ],
    "analysis_summary_en": "string",
    "analysis_summary_fa": "string",
    "general_recommendations_en": ["string"],
    "general_recommendations_fa": ["string"]
  },
  "metadata": {
    "confidence": 0,
    "detected_language": "en",
    "cv_format_quality": "excellent | good | fair | poor",
    "estimated_experience_years": null,
    "career_level": "entry | mid | senior | executive | academic",
    "notes": "string"
  }
}

${domainContext}

EXTRACTION RULES:
1. Extract ALL information - be thorough, do not skip anything
2. Extract text in the SAME LANGUAGE as the source document
3. If CV has multiple languages, use the dominant language
4. Use null for truly missing fields, never empty string for absent data
5. Generate unique IDs: work-1, work-2, edu-1, cert-1, proj-1, etc.
6. Normalize dates to YYYY-MM format when possible
7. "Present" or "Current" → is_current: true, end_date: null
8. Split achievements into INDIVIDUAL items (one per bullet point)
9. Extract metrics separately (revenue, percentages, team sizes, counts)
10. Categorize skills into technical, soft, tools, and domain_specific

GAP ANALYSIS RULES:
11. Severity levels:
    - CRITICAL: Missing essential info (name, contact, summary, any experience)
    - IMPORTANT: Missing quantifiable metrics, weak descriptions, missing domain keywords
    - RECOMMENDED: Could be stronger, missing optional but valuable sections
    - OPTIONAL: Nice-to-have improvements, minor enhancements
12. CRITICAL FIELDS for selected domains: ${criticalFields.join(', ')}
13. Be SPECIFIC in fix_guidance - don't say "add more details", say exactly WHAT to add
14. fix_example must be realistic and directly usable by the candidate
15. suggested_value should be a draft the user can edit (when AI can reasonably suggest one)
16. ALWAYS provide BOTH English AND Persian (Farsi) for: title, description, fix_guidance, fix_example, analysis_summary, recommendations
17. input_type should match what the user needs to provide:
    - "text" for short single-line answers
    - "textarea" for paragraphs (summary, descriptions)
    - "list" for multiple items (skills, achievements)
    - "confirm" for AI-suggested improvements user just approves
    - "experience" / "education" / "certification" / "project" for adding new structured entries
18. Identify at least 2-3 STRENGTHS if the CV has any positive aspects
19. overall_score: 0-100 reflecting completeness AND quality for target domains
20. Each domain_relevance_score: 0-100 how well CV fits that specific domain

CRITICAL GAP RULES - NO HALLUCINATION:
21. GAP IDENTIFICATION - BE THOROUGH BUT HONEST:
    - A gap means: the CV is MISSING important information that would make it stronger
    - Common gaps you SHOULD identify:
      * Missing or very brief professional summary (< 50 characters)
      * Missing phone number or email
      * Missing LinkedIn URL
      * Work experience without quantifiable achievements
      * Missing skills section or very few skills
      * Missing education details
      * Missing certifications (optional but valuable)
      * Missing projects (especially for technical roles)
    - DO NOT create gaps for things that exist and are reasonable
    - DO NOT hallucinate - only identify real missing information
    - EXPECT 3-8 gaps for a typical CV, 0-2 for exceptional CVs, 8+ for incomplete CVs
22. INTELLIGENT CLASSIFICATION:
    - CVs may have unconventional formats (no clear section headers, mixed content)
    - Extract and classify data even if not in standard sections
    - Add "classification_notes" field if you made classification decisions
    - Mark uncertain classifications with "needs_user_confirmation": true
23. USER CHOICE RESPECT:
    - Add "can_skip": true to ALL gaps - user can decline to provide any information
    - Never create a gap that user cannot skip
    - Accept that some fields may remain empty - this is user's choice
24. NO HALLUCINATION:
    - NEVER invent or suggest fictional improvements
    - NEVER create gaps for data that exists but could be "better"
    - NEVER suggest adding information not present in or implied by the original CV
25. LANGUAGE DETECTION:
    - Detect and record the primary language of the CV in metadata.detected_language
    - This will be used to translate user inputs during refinement`;
}


/**
 * ساخت بخش JSON schema برای بخش‌های اختصاصی حوزه
 */
function buildDomainSectionsSchema(
  sections: ReturnType<typeof getDomainSpecificSections>
): string {
  if (sections.length === 0) return '';

  const sectionEntries = sections.map(s =>
    `      {
        "id": "${s.id}",
        "title": "${s.label_en}",
        "content": "string or null"
      }`
  ).join(',\n');

  return `
    "domain_specific_sections": [
${sectionEntries}
    ],`;
}

/**
 * ساخت بلاک توضیحات حوزه‌ای
 * به AI توضیح می‌دهد هر حوزه چه بخش‌هایی نیاز دارد
 */
function buildDomainContextBlock(domains: CVDomainId[]): string {
  if (domains.length === 0 || (domains.length === 1 && domains[0] === 'general')) {
    return `DOMAIN CONTEXT:
This is a general CV analysis. Focus on universal best practices:
- Clear professional summary with years of experience and key strengths
- Quantifiable achievements in work experience (numbers, percentages, dollar amounts)
- Well-organized skills section with mix of technical and transferable skills
- Complete education details
- Consistent formatting and no gaps in timeline`;
  }

  const blocks: string[] = ['DOMAIN-SPECIFIC CONTEXT:'];

  for (const domainId of domains) {
    const domain = CV_DOMAINS[domainId];
    if (!domain) continue;

    blocks.push(`\n--- ${domain.label_en} (${domain.label_fa}) ---`);
    blocks.push(`Description: ${domain.description_en}`);

    if (domain.critical_fields.length > 0) {
      blocks.push(`Critical fields: ${domain.critical_fields.join(', ')}`);
    }

    if (domain.specific_sections.length > 0) {
      blocks.push(`Domain-specific sections expected:`);
      for (const section of domain.specific_sections) {
        const requiredTag = section.is_required ? ' [REQUIRED]' : ' [OPTIONAL]';
        blocks.push(`  • ${section.label_en}${requiredTag}: ${section.description_en}`);
        blocks.push(`    Example: "${section.example_en}"`);
      }
    }

    if (domain.detection_keywords.length > 0) {
      const topKeywords = domain.detection_keywords.slice(0, 15).join(', ');
      blocks.push(`Important keywords to look for: ${topKeywords}`);
    }
  }

  blocks.push(`\nWhen analyzing gaps, consider what a hiring manager in each domain would expect to see.`);
  blocks.push(`If the CV is strong for one domain but weak for another, reflect this in domain_relevance_scores.`);

  return blocks.join('\n');
}

// ═══════════════════════════════════════════
// پرامپت کاربر برای استخراج
// ═══════════════════════════════════════════

/**
 * ساخت پرامپت کاربر برای استخراج CV
 */
export function buildExtractionUserPrompt(
  cvText: string,
  selectedDomains: CVDomainId[]
): string {
  const domains = selectedDomains.length > 0 ? selectedDomains : ['general' as CVDomainId];

  const domainNames = domains
    .map(d => CV_DOMAINS[d]?.label_en || d)
    .join(', ');

  return `Parse the following CV/Resume completely and extract all structured information.
Then analyze it for completeness and quality for these career domains: ${domainNames}.
Identify ALL gaps and provide specific, actionable guidance for each.
Also identify strengths and positive aspects of the CV.

---CV TEXT START---
${cvText}
---CV TEXT END---

Remember:
- Extract in the same language as the source text
- Be thorough - extract every piece of information
- Provide both English and Persian (Farsi) for all analysis text
- Respond with valid JSON only, no other text`;
}

// ═══════════════════════════════════════════
// پرامپت اصلاح (Refinement)
// ═══════════════════════════════════════════

/**
 * پرامپت سیستم برای اصلاح CV بعد از رفع نواقص توسط کاربر
 */
export function buildRefinementSystemPrompt(selectedDomains: CVDomainId[], cvLanguage: string = 'en'): string {
  const domains = selectedDomains.length > 0 ? selectedDomains : ['general' as CVDomainId];

  const domainNames = domains
    .map(d => CV_DOMAINS[d]?.label_en || d)
    .join(', ');

  const cvLangName = cvLanguage === 'fa' ? 'Persian (Farsi)' : 'English';

  return `You are an expert CV editor and career specialist for: ${domainNames}.

═══════════════════════════════════════════════════════════════
CRITICAL: CV LANGUAGE = ${cvLangName}
═══════════════════════════════════════════════════════════════
- ALL CV content MUST remain in ${cvLangName}
- DO NOT change the language of existing CV content
- If user input is in a different language → translate to ${cvLangName}
- All output (suggestions, translations, etc.) MUST be in ${cvLangName}
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
CRITICAL: PRESERVE AND MERGE DATA INTELLIGENTLY
═══════════════════════════════════════════════════════════════
RULE #1: PRESERVE ALL EXISTING DATA
- You MUST return ALL existing CV data. Do NOT delete, remove, or truncate ANY existing data.
- If the CV has 10 work experiences, return ALL 10.
- If a description is 500 words, return ALL 500 words exactly.

RULE #2: SMART INTEGRATION - NO DUPLICATION
- Integrate user input to resolve gaps, but AVOID DUPLICATION.
- Before adding info: Check if synonyms or the same information already exists in that field/section.
- If info is already present → skip adding it or merge it to complete the existing sentence/fact.
- DO NOT repeat bullet points or achievements.

RULE #3: VERBATIM BUT PROFESSIONAL
- Add new info exactly as provided by the user, but ensure it flows correctly in the JSON structure.
- DO NOT "professionalize" by hallucinating new tasks, but do ensure valid grammar in ${cvLangName}.

RULE #4: LANGUAGES SECTION IS CRITICAL
- The "languages" array MUST BE PRESERVED. If it exists in the original JSON, it MUST exist in your output.
- DO NOT move languages to "skills" or "additional_sections".

RESPONSE FORMAT:
{
  "extracted_data": { 
    // MUST contain ALL original data PLUS any new user input
    // DO NOT remove or modify any existing fields (personal_info, work_experience, education, skills, certifications, projects, languages)
  },
  "suggested_improvements": [],  // Quality improvements (not applied to extracted_data)
  "translations_applied": [],    // List of translations done
  "gap_analysis": { ... },
  "metadata": { ... }
}

CRITICAL CHECKLIST:
□ Are ALL "languages" from the original CV still in the output?
□ Did I avoid repeating information already present in work experience or summary?
□ Did I include ALL original work entries?
□ Is EVERYTHING in ${cvLangName}?

Respond with valid JSON only.`;
}

/**
 * پرامپت کاربر برای اصلاح CV
 */
export function buildRefinementUserPrompt(
  currentCV: any,
  resolvedGaps: { gapId: string; userInput: string }[],
  additionalText?: string,
  instructions?: string,
  cvLanguage: string = 'en'
): string {
  const parts: string[] = [];

  parts.push(`CV PRIMARY LANGUAGE: ${cvLanguage}`);
  parts.push(`All translations should be to this language.`);
  parts.push('');
  parts.push(`Here is the current CV data (JSON):`);
  parts.push('```json');
  parts.push(JSON.stringify(currentCV, null, 2));
  parts.push('```');

  if (resolvedGaps.length > 0) {
    parts.push('');
    parts.push('The user has provided the following information to resolve gaps:');
    parts.push('');

    for (const gap of resolvedGaps) {
      parts.push(`--- Gap ID: ${gap.gapId} ---`);
      parts.push(`User provided: ${gap.userInput}`);
      parts.push('');
    }

    parts.push('Please integrate each piece of information into the appropriate section of the CV.');
    parts.push('IMPORTANT: Add user input VERBATIM (exactly as provided). Do NOT modify or improve it.');
    parts.push('If user input is in a different language than the CV, translate it and list in translations_applied.');
  }

  if (additionalText) {
    parts.push('');
    parts.push('Additional source text (may contain new information to extract):');
    parts.push('---');
    parts.push(additionalText);
    parts.push('---');
  }

  if (instructions) {
    parts.push('');
    parts.push('User instructions:');
    parts.push(instructions);
  }

  parts.push('');
  parts.push('REMINDER - CRITICAL RULES:');
  parts.push('1. DO NOT modify existing CV content');
  parts.push('2. Add user input VERBATIM');
  parts.push('3. List improvements as suggestions, do NOT apply them');
  parts.push('4. Translate user input if needed, list in translations_applied');
  parts.push('5. NO hallucination or invented content');
  parts.push('');
  parts.push('Respond with the complete JSON structure including suggested_improvements and translations_applied arrays.');
  parts.push('Respond with JSON only.');

  console.log('[DEBUG-GAP-3] Gaps included in prompt:',
    resolvedGaps.length);
  resolvedGaps.forEach((g, i) => {
    console.log(`[DEBUG-GAP-3.${i}] Prompt gap "${g.gapId}": "${g.userInput?.substring(0, 100)}"`);
  });

  return parts.join('\n');
}

// ═══════════════════════════════════════════
// Legacy Exports - سازگاری با کد قبلی
// این export ها تضمین می‌کنند هیچ کد موجودی نمی‌شکند
// ═══════════════════════════════════════════

/**
 * @deprecated Use buildExtractionSystemPrompt(domains) instead
 */
export const CV_EXTRACTION_SYSTEM_PROMPT = buildExtractionSystemPrompt(['general']);

/**
 * @deprecated Use buildExtractionUserPrompt(text, domains) instead
 */
export const CV_EXTRACTION_USER_PROMPT = (cvText: string) =>
  buildExtractionUserPrompt(cvText, ['general']);

/**
 * @deprecated Use buildRefinementSystemPrompt(domains, cvLanguage) instead
 */
export const CV_REFINE_SYSTEM_PROMPT = buildRefinementSystemPrompt(['general'], 'en');

/**
 * @deprecated Use buildRefinementUserPrompt(cv, gaps, additionalText, instructions, cvLanguage) instead
 */
export const CV_REFINE_USER_PROMPT = (
  currentCV: any,
  additionalText?: string,
  instructions?: string
) => buildRefinementUserPrompt(currentCV, [], additionalText, instructions, 'en');

/**
 * Legacy clarification prompt - حفظ بدون تغییر
 */
export const CV_EXTRACTION_CLARIFICATION_PROMPT = (
  cvText: string,
  missingFields: string[]
) =>
  `The CV appears to be missing some important information. Please try to extract what's available and note the missing fields.

Missing fields: ${missingFields.join(', ')}

CV Text:
${cvText}

Respond with JSON only, using null for missing fields.`;
