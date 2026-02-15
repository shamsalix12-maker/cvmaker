// ============================================
// Phase 2: Blind Structured Extraction
// Extract all factual data without domain consideration
// ============================================

import { ExtractionResult } from '../types/pipeline.types';
import { getAIProvider } from '../../ai/ai-factory';
import { AIProviderConfig, AICompletionOptions } from '../../ai/ai-provider';
import { ComprehensiveCV } from '../../types';

export interface ExtractionConfig {
  aiProvider: 'openai' | 'anthropic' | 'google';
  aiModel: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export async function extractBlindStructured(
  rawText: string,
  config: ExtractionConfig
): Promise<ExtractionResult> {
  const provider = getAIProvider(config.aiProvider);
  
  const aiConfig: AIProviderConfig = {
    apiKey: config.apiKey,
    temperature: config.temperature ?? 0.1,
    maxTokens: config.maxTokens ?? 8192,
  };

  const options: AICompletionOptions = {
    model: config.aiModel,
    messages: [
      {
        id: 'sys-extraction',
        role: 'system',
        content: getExtractionSystemPrompt(),
        timestamp: new Date().toISOString(),
      },
      {
        id: 'usr-extraction',
        role: 'user',
        content: getExtractionUserPrompt(rawText),
        timestamp: new Date().toISOString(),
      },
    ],
    jsonMode: true,
  };

  try {
    const response = await provider.complete(aiConfig, options);
    const parsed = parseJSONResponse(response);

    if (!parsed) {
      return {
        extractedData: {},
        confidence: 0,
        detectedLanguage: detectLanguage(rawText),
        extractionNotes: 'AI failed to return valid JSON',
        rawSource: rawText,
      };
    }

    const extractedData = transformToComprehensiveCV(parsed, rawText);
    const confidence = calculateConfidence(parsed, rawText);

    return {
      extractedData,
      confidence,
      detectedLanguage: detectLanguage(rawText),
      extractionNotes: 'Extraction completed successfully',
      rawSource: rawText,
    };
  } catch (error) {
    console.error('[Phase 2] Extraction failed:', error);
    return {
      extractedData: {},
      confidence: 0,
      detectedLanguage: detectLanguage(rawText),
      extractionNotes: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      rawSource: rawText,
    };
  }
}

function getExtractionSystemPrompt(): string {
  return `You are an expert CV parser. Your task is to extract ALL factual information from the provided CV text and map it into a structured JSON format.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Preserve EVERY piece of data - do NOT delete, invent, or summarize any information
3. Keep the original language of each field (English or Persian)
4. If a field is missing from the CV, use null or empty array
5. Extract all entries - do not limit the number of items

OUTPUT SCHEMA:
{
  "personal_info": {
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin_url": "string or null",
    "website_url": "string or null",
    "summary": "string or null - include COMPLETE summary"
  },
  "work_experience": [
    {
      "id": "work-1",
      "job_title": "string",
      "company": "string",
      "location": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "is_current": true or false,
      "description": "string - include ALL details",
      "achievements": ["array of achievement strings"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "string",
      "field_of_study": "string",
      "institution": "string",
      "location": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "gpa": "number or null",
      "description": "string or null"
    }
  ],
  "skills": ["skill1", "skill2", ...],
  "languages": [
    {"language": "string", "proficiency": "string"}
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "string",
      "issuer": "string or null",
      "date_obtained": "string or null",
      "expiry_date": "string or null",
      "credential_id": "string or null",
      "string or null "credential_url":"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null",
      "start_date": "string or null",
      "end_date": "string or null"
    }
  ],
  "additional_sections": [
    {
      "id": "add-1",
      "title": "string",
      "content": "string"
    }
  ]
}

IMPORTANT: The output must be valid JSON that can be parsed. Ensure all strings are properly escaped.`;
}

function getExtractionUserPrompt(rawText: string): string {
  return `Extract all factual information from the following CV and map it to the JSON structure:

${rawText}

Remember:
- Extract EVERYTHING - do not skip any information
- Include all work experiences, education entries, skills, certifications, projects
- Do NOT summarize or shorten any descriptions
- Keep the original language
- Return valid JSON only`;
}

function parseJSONResponse(response: string): any {
  let jsonStr = response.trim();

  const markdownMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch) {
    jsonStr = markdownMatch[1].trim();
  } else {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```$/i, '');
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return extractPartialData(jsonStr);
  }
}

function extractPartialData(response: string): any {
  const result: any = {
    personal_info: {},
    work_experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    additional_sections: [],
  };

  try {
    const nameMatch = response.match(/"full_name"\s*:\s*"([^"]*)"/);
    const emailMatch = response.match(/"email"\s*:\s*"([^"]*)"/);
    const phoneMatch = response.match(/"phone"\s*:\s*"([^"]*)"/);

    if (nameMatch || emailMatch || phoneMatch) {
      result.personal_info = {
        full_name: nameMatch?.[1] || null,
        email: emailMatch?.[1] || null,
        phone: phoneMatch?.[1] || null,
      };
    }

    const jobMatches = [...response.matchAll(/"job_title"\s*:\s*"([^"]+)"/g)];
    if (jobMatches.length > 0) {
      result.work_experience = jobMatches.map((m, i) => ({
        id: `work-${i + 1}`,
        job_title: m[1],
        company: null,
        description: null,
      }));
    }

    return result;
  } catch {
    return null;
  }
}

function transformToComprehensiveCV(parsed: any, rawText: string): Partial<ComprehensiveCV> {
  const data = parsed.extracted_data || parsed;

  const ensureArray = (arr: any[]) => (Array.isArray(arr) ? arr : []);
  const addIds = (arr: any[], prefix: string) =>
    ensureArray(arr).map((item: any, idx: number) => ({
      ...item,
      id: item.id || `${prefix}-${idx + 1}`,
    }));

  return {
    personal_info: data.personal_info || data.personal || {},
    work_experience: addIds(data.work_experience || [], 'work'),
    education: addIds(data.education || [], 'edu'),
    skills: ensureArray(data.skills || []).filter((s: any) => typeof s === 'string'),
    certifications: addIds(data.certifications || [], 'cert'),
    languages: ensureArray(data.languages || []),
    projects: addIds(data.projects || [], 'proj'),
    additional_sections: addIds(data.additional_sections || [], 'add'),
    raw_text: rawText,
  };
}

function calculateConfidence(parsed: any, rawText: string): number {
  let score = 50;

  const data = parsed.extracted_data || parsed;
  
  if (data.personal_info?.full_name) score += 10;
  if (data.personal_info?.email) score += 5;
  if (data.work_experience?.length > 0) score += 15;
  if (data.education?.length > 0) score += 10;
  if (data.skills?.length > 0) score += 10;

  return Math.min(100, score);
}

function detectLanguage(text: string): string {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const persianChars = (text.match(persianRegex) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  if (totalChars > 0 && persianChars / totalChars > 0.1) {
    return 'fa';
  }
  return 'en';
}

export const PHASE_2_EXTRACTION_PROMPT_TEMPLATE = `Extract all factual information from the text into the canonical JSON structure. Preserve every piece of data, do not hallucinate or delete any field.

Input: Raw CV text
Output: JSON matching ComprehensiveCV schema

Fields required:
- Identity (personal_info)
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
- Other[]`;
