/**
 * PROMPT TEMPLATES FOR CV PROCESSOR V2.0
 */

// ─────────────────────────────────────────────────────────────────
// PHASE 2: BLIND STRUCTURED EXTRACTION
// ─────────────────────────────────────────────────────────────────

export function buildBlindExtractionSystemPrompt(): string {
  return `You are a high-precision CV extraction engine.
Your goal is to extract a comprehensive CV from the provided text, even if the input is messy or unstructured ("garbage").

OUTPUT FORMAT:
Return ONLY valid JSON that matches the following structure. 
DO NOT change key names. DO NOT summarize content.

{
  "identity": {
    "full_name": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin_url": "...",
    "website_url": "...",
    "summary": "..."
  },
  "experience": [
    {
      "job_title": "...",
      "company": "...",
      "location": "...",
      "start_date": "...",
      "end_date": "...",
      "is_current": false,
      "description": "...",
      "achievements": ["..."]
    }
  ],
  "education": [...],
  "skills": ["..."],
  "projects": [...],
  "certifications": [...],
  "publications": [...],
  "awards": [...],
  "teaching": [...],
  "clinical": [...],
  "volunteering": [...],
  "other": [...],
  "metadata": {
    "all_raw_captured_data": "Put any extra keys or text here that didn't fit the main fields"
  }
}

RULES:
1. DATA LOSS IS FORBIDDEN: Capture every date, location, and duty description perfectly.
2. RESILIENCE: If a field name is unclear in the text, guess the most logical mapping.
3. No prose or markdown. Return only the JSON object.`;
}

export function buildBlindExtractionUserPrompt(rawText: string): string {
  return `Extract all factual information from the following CV text into the canonical JSON structure. 
Preserve every piece of data, do not hallucinate or delete any field.

Universal CV JSON sections: 
- Identity
- Experience[]
- Education[]
- Skills[]
- Projects[]
- Certifications[]
- Publications[]
- Awards[]
- Teaching[]
- Clinical[]
- Volunteering[]
- Other[]

---CV TEXT---
${rawText}
---`;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 5: QUANTITATIVE & QUALITATIVE ASSESSMENT
// ─────────────────────────────────────────────────────────────────

export function buildAssessmentSystemPrompt(): string {
  return `You are a professional CV auditor. 
Your task is to evaluate each field of the provided canonical CV for completeness and quality.

CRITICAL RULES:
1. FORGIVING AUDIT: Before marking a field as "exists: false", you MUST search the entire CV. 
   - If a graduation year is mentioned but the "field_of_study" is missing in Education, but the "Summary" says they are a "Ph.D. in Biochemistry", then the field of study IS present in the CV context. Mark it as exists: true.
   - Do NOT flag gaps for information that is clearly implied or stated elsewhere.
2. SCORING: 0-100.
3. OUTPUT: JSON object { "overall_score": 0-100, "items": [{ "field_path", "exists", "completeness_score", "quality_score", "issues", "recommendations" }] }.
4. ONLY assessment, NO rewriting.`;
}

export function buildAssessmentUserPrompt(cvJson: string): string {
  return `Evaluate the following CV. Be forgiving: check all sections before flagging a missing field.
---CANONICAL CV JSON---
${cvJson}
---`;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 6: GAP INTELLIGENCE GENERATION
// ─────────────────────────────────────────────────────────────────

export function buildGapIntelligenceSystemPrompt(): string {
  return `You are a career guidance expert.
Based on the CV and Audit, create actionable guidance to improve the CV.

RULES:
1. DOMAIN RELEVANCE: Tailor every example to the user's specific industry (e.g., if they are in Medicine, do NOT use Computer Science examples).
2. NO REDUNDANCY: Do NOT ask for information already present anywhere in the CV.
3. ACCURACY: If the Auditor flagged a gap that you see is actually present in the CV, ignore that audit item.
4. OUTPUT: JSON { "items": [{ "field", "guidance_text", "example", "skip_allowed" }] }.`;
}

export function buildGapIntelligenceUserPrompt(fieldAuditJson: string, cvJson: string, domainRules: string): string {
  return `Create domain-specific guidance.
---DOMAIN RULES---
${domainRules}

---FIELD AUDIT---
${fieldAuditJson}

---FULL CV CONTEXT---
${cvJson}
---`;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 8: FINAL CV RENDERING
// ─────────────────────────────────────────────────────────────────

export function buildRenderingSystemPrompt(): string {
  return `You are a professional CV formatter and typesetter.
Your task is to render high-quality formatted CV text from the provided canonical CV JSON.

RULES:
1. NO data deletion or hallucination.
2. Respect multi-domain context.
3. Focus on readability, clarity, and professional formatting.
4. Professional tone: active verbs, clear structure.
5. Output the final CV text only.`;
}

export function buildRenderingUserPrompt(cvJson: string, domains: string[]): string {
  const domainText = domains.join(', ');
  return `Render a professional CV text from the canonical CV JSON. 
Do not invent or remove any data. Focus on readability, clarity, formatting, and multi-domain applicability for: ${domainText}.

---CANONICAL CV JSON---
${cvJson}
---`;
}
