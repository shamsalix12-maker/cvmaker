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

OUTPUT FORMAT:
Return a JSON object with: { "overall_score": 0-100, "items": [...] }
Each item in "items" must have: { "field_path", "exists", "completeness_score", "quality_score", "issues", "recommendations" }.

CRITICAL RULES:
1. CONTEXT AWARENESS: Before marking a section as "exists: false", check if that information is already detailed in ANOTHER section. 
   - Example: If "projects" is empty but "experience" describes significant projects, mark "projects" as "exists: true" (possibly with lower completeness) rather than totally missing.
2. Use snake_case keys.
3. ONLY assessment, NO rewriting.
4. Return ONLY valid JSON. No markdown.`;
}

export function buildAssessmentUserPrompt(cvJson: string): string {
    return `Evaluate each field of the provided canonical CV for completeness and quality.
Return JSON: { field_path, exists, completeness_score, quality_score, issues, recommendations }.
Do not rewrite or invent any data.

---CANONICAL CV JSON---
${cvJson}
---`;
}

// ─────────────────────────────────────────────────────────────────
// PHASE 6: GAP INTELLIGENCE GENERATION
// ─────────────────────────────────────────────────────────────────

export function buildGapIntelligenceSystemPrompt(): string {
    return `You are a career guidance expert.
Based on domain rules and field audits, create actionable guidance for the user to fill incomplete or weak CV fields.

OUTPUT FORMAT:
Return a JSON object with: { "items": [...] }
Each item in "items" must have: { "field", "guidance_text", "example", "skip_allowed" }.

RULES:
1. Use snake_case keys.
2. NO REDUNDANCY: Do NOT ask for information that is already present in other parts of the CV. 
3. Provide clear, direct guidance.
4. Include realistic examples.
5. Respect the "skip_allowed" rule (default true).
6. Return ONLY valid JSON. No markdown.`;
}

export function buildGapIntelligenceUserPrompt(fieldAuditJson: string, domainRules: string): string {
    return `Based on the following domain rules and field audits, create actionable guidance for the user to fill incomplete fields.
Include examples and skip instructions. Output structured JSON { field, guidance_text, example, skip_allowed }.

---DOMAIN RULES---
${domainRules}

---FIELD AUDIT JSON---
${fieldAuditJson}
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
