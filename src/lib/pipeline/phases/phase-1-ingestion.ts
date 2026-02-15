// ============================================
// Phase 1: Ingestion Layer
// Extract raw text from any CV input format
// ============================================

import { IngestionResult, IngestionMetadata } from '../types/pipeline.types';

export type SupportedFormat = 'pdf' | 'docx' | 'txt' | 'markdown' | 'raw';

export interface IngestionOptions {
  normalizeEncoding?: boolean;
  removeFormattingNoise?: boolean;
  detectLanguage?: boolean;
}

const DEFAULT_OPTIONS: IngestionOptions = {
  normalizeEncoding: true,
  removeFormattingNoise: true,
  detectLanguage: true,
};

export async function ingestFile(
  file: Buffer | Blob,
  filename: string,
  options: IngestionOptions = DEFAULT_OPTIONS
): Promise<IngestionResult> {
  const format = detectFormat(filename, file);
  
  let rawText: string;
  const metadata: IngestionMetadata = {
    filename,
    encoding: 'utf-8',
    language: undefined,
  };

  switch (format) {
    case 'pdf':
      rawText = await parsePDF(file, metadata);
      break;
    case 'docx':
      rawText = await parseDOCX(file, metadata);
      break;
    case 'markdown':
      rawText = await parseMarkdown(file);
      break;
    case 'txt':
      rawText = await parseText(file);
      break;
    default:
      rawText = await parseText(file);
  }

  if (options.normalizeEncoding) {
    rawText = normalizeEncoding(rawText);
  }

  if (options.removeFormattingNoise) {
    rawText = removeFormattingNoise(rawText);
  }

  if (options.detectLanguage) {
    metadata.language = detectLanguage(rawText);
  }

  return {
    rawText,
    sourceFormat: format,
    metadata,
  };
}

export async function ingestText(
  text: string,
  sourceFormat: SupportedFormat = 'raw',
  options: IngestionOptions = DEFAULT_OPTIONS
): Promise<IngestionResult> {
  let rawText = text;

  if (options.normalizeEncoding) {
    rawText = normalizeEncoding(rawText);
  }

  if (options.removeFormattingNoise) {
    rawText = removeFormattingNoise(rawText);
  }

  const metadata: IngestionMetadata = {
    encoding: 'utf-8',
    language: options.detectLanguage ? detectLanguage(rawText) : undefined,
  };

  return {
    rawText,
    sourceFormat,
    metadata,
  };
}

function detectFormat(filename: string, file: Buffer | Blob): SupportedFormat {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'txt':
    case 'text':
      return 'txt';
    default:
      if (file instanceof Buffer) {
        if (file[0] === 0x25 && file[1] === 0x50 && file[2] === 0x44 && file[3] === 0x46) {
          return 'pdf';
        }
        if (file[0] === 0x50 && file[1] === 0x4B) {
          return 'docx';
        }
      }
      return 'raw';
  }
}

async function parsePDF(file: Buffer | Blob, metadata: IngestionMetadata): Promise<string> {
  try {
    const pdfParseModule = await import('pdf-parse') as any;
    const pdfParse = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
    const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;
    const data = pdfParse(buffer);
    metadata.pageCount = data.numpages;
    return data.text;
  } catch (error) {
    console.error('[Ingestion] PDF parsing failed:', error);
    throw new Error('Failed to parse PDF file');
  }
}

async function parseDOCX(file: Buffer | Blob, metadata: IngestionMetadata): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('[Ingestion] DOCX parsing failed:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

async function parseMarkdown(file: Buffer | Blob): Promise<string> {
  const content = file instanceof Blob 
    ? Buffer.from(await file.arrayBuffer()).toString('utf-8')
    : file.toString('utf-8');
  return content;
}

async function parseText(file: Buffer | Blob): Promise<string> {
  const content = file instanceof Blob 
    ? Buffer.from(await file.arrayBuffer()).toString('utf-8')
    : file.toString('utf-8');
  return content;
}

function normalizeEncoding(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\uFEFF/g, '');
}

function removeFormattingNoise(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2026/g, '...')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

export const PHASE_1_INGESTION_SYSTEM_PROMPT = `You are a text normalization helper. Your task is to clean and normalize extracted CV text.

Rules:
1. Remove excessive whitespace and line breaks
2. Fix common encoding issues
3. Preserve all meaningful content
4. Do NOT summarize or remove any information
5. Do NOT translate any content

Input: Raw extracted text from PDF/DOCX/TXT
Output: Cleaned normalized text`;

export function getPhase1Prompt(rawText: string): string {
  return `Clean and normalize the following CV text:

${rawText}

Provide the cleaned text without any additional commentary.`;
}
