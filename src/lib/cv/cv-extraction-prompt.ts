// ============================================
// [F107] src/lib/cv/cv-extraction-prompt.ts
// CV Extraction AI Prompt
// ============================================

export const CV_EXTRACTION_SYSTEM_PROMPT = `You are an expert CV/Resume parser. Your job is to extract structured information from CV text.

You MUST respond with valid JSON only, no other text or markdown.

The JSON structure must be:
{
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
      "id": "unique string",
      "job_title": "string",
      "company": "string",
      "location": "string or null",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null (null if current)",
      "is_current": boolean,
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "id": "unique string",
      "degree": "string",
      "field_of_study": "string",
      "institution": "string",
      "location": "string or null",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "gpa": "string or null",
      "description": "string or null"
    }
  ],
  "skills": ["string"],
  "certifications": [
    {
      "id": "unique string",
      "name": "string",
      "issuer": "string",
      "date_obtained": "YYYY-MM or null",
      "expiry_date": "YYYY-MM or null",
      "credential_url": "string or null"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "Native | Fluent | Advanced | Intermediate | Basic"
    }
  ],
  "projects": [
    {
      "id": "unique string",
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null"
    }
  ],
  "confidence": 0-100,
  "notes": "Any observations about the CV quality or missing information"
}

Rules:
1. Extract ALL information you can find
2. Use null for fields that are not present
3. Generate unique IDs for list items (use simple strings like "work-1", "edu-1", etc.)
4. Normalize dates to YYYY-MM format when possible
5. If a date says "Present" or "Current", set is_current to true and end_date to null
6. Extract achievements as separate items in the achievements array
7. Extract information in the SAME LANGUAGE as the source text (e.g., if CV is in Persian, extract Persian text).
8. Be thorough - don't miss any information.
9. The confidence score should reflect how complete and clear the CV is.
10. Add any observations to the notes field.
11. If the input contains both English and Persian, prioritize the language that is most predominant.
12. Ensure all fields in the JSON structure are present, even if they are null or empty arrays.`;

export const CV_EXTRACTION_USER_PROMPT = (cvText: string) =>
  `Please parse the following CV/Resume and extract all structured information:

---CV TEXT START---
${cvText}
---CV TEXT END---

Respond with JSON only.`;

// Alternative prompt for unclear/short CVs
export const CV_EXTRACTION_CLARIFICATION_PROMPT = (cvText: string, missingFields: string[]) =>
  `The CV appears to be missing some important information. Please try to extract what's available and note the missing fields.

Missing fields: ${missingFields.join(', ')}

CV Text:
${cvText}

Respond with JSON only, using null for missing fields.`;
// Refinement prompt for iterative improvement
export const CV_REFINE_SYSTEM_PROMPT = `You are an expert CV/Resume editor. Your job is to take an existing structured CV (JSON) and refine it based on new information or user edits.

Rules:
1. Maintain the SAME JSON structure as the input.
2. If new text is provided, extract additional details and merge them into the existing structure.
3. If the user provides specific instructions, follow them strictly.
4. Improve the clarity, professional tone, and consistency of the descriptions.
5. Fix any formatting or structural issues.
6. Respond with valid JSON only.
7. Ensure all IDs are maintained unless items are deleted.
8. Update the confidence score and provide new notes if applicable.`;

export const CV_REFINE_USER_PROMPT = (currentCV: any, additionalText?: string, instructions?: string) => `
Current CV Data (JSON):
${JSON.stringify(currentCV, null, 2)}

${additionalText ? `Original/New Source Text:\n${additionalText}\n` : ''}
${instructions ? `User Refinement Instructions:\n${instructions}\n` : ''}

Please refine the CV data based on the above information. Respond with JSON only.`;
