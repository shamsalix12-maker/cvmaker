// ============================================
// Phase 0: Project Analysis Layer
// Analyzes existing project structure to prevent conflicts and allow reuse
// ============================================

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectAnalysisResult {
  modules: ModuleInfo[];
  dependencies: DependencyInfo[];
  reusableComponents: ReusableComponent[];
  conflictRisks: ConflictRisk[];
  recommendations: string[];
  existingFiles: string[];
}

export interface ModuleInfo {
  name: string;
  path: string;
  exports: string[];
  dependencies: string[];
}

export interface DependencyInfo {
  from: string;
  to: string;
  type: 'import' | 'export' | 'api';
}

export interface ReusableComponent {
  name: string;
  path: string;
  description: string;
  canReuse: boolean;
}

export interface ConflictRisk {
  area: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

const EXISTING_CV_FILES = [
  'src/lib/cv/cv-extractor.ts',
  'src/lib/cv/cv-domains.ts',
  'src/lib/cv/cv-validator.ts',
  'src/lib/cv/cv-service.ts',
  'src/lib/cv/multi-stage-extractor.ts',
  'src/lib/types/cv-domain.types.ts',
  'src/lib/types.ts',
  'src/lib/parsers/pdf-parser.ts',
  'src/lib/parsers/docx-parser.ts',
  'src/lib/parsers/markdown-parser.ts',
  'src/lib/ai/ai-provider.ts',
  'src/lib/ai/google-ai-provider.ts',
  'src/lib/ai/openai-provider.ts',
  'src/lib/ai/anthropic-provider.ts',
];

const REUSABLE_PATTERNS = [
  { pattern: /cv-extractor/i, name: 'CV Extraction', canReuse: true },
  { pattern: /cv-validator/i, name: 'CV Validation', canReuse: true },
  { pattern: /cv-domains/i, name: 'Domain Definitions', canReuse: true },
  { pattern: /multi-stage/i, name: 'Multi-Stage Processing', canReuse: true },
  { pattern: /ai-provider/i, name: 'AI Provider Interface', canReuse: true },
  { pattern: /parser/i, name: 'File Parsers', canReuse: true },
];

const CONFLICT_PATTERNS = [
  { pattern: /cv-manager/i, severity: 'high' as const, description: 'Potential naming conflict with existing CV manager' },
  { pattern: /pipeline/i, severity: 'medium' as const, description: 'Pipeline naming might conflict' },
  { pattern: /orchestrator/i, severity: 'low' as const, description: 'Orchestrator already exists in cv-tailor-orchestrator' },
];

export async function analyzeProject(rootDir: string): Promise<ProjectAnalysisResult> {
  const modules: ModuleInfo[] = [];
  const dependencies: DependencyInfo[] = [];
  const reusableComponents: ReusableComponent[] = [];
  const conflictRisks: ConflictRisk[] = [];
  const existingFiles: string[] = [];
  const recommendations: string[] = [];

  for (const filePath of EXISTING_CV_FILES) {
    const fullPath = path.join(rootDir, filePath);
    if (fs.existsSync(fullPath)) {
      existingFiles.push(filePath);
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const moduleName = path.basename(filePath, '.ts');
      const exports = extractExports(content);
      const deps = extractDependencies(content);
      
      modules.push({
        name: moduleName,
        path: filePath,
        exports,
        dependencies: deps,
      });

      for (const dep of deps) {
        dependencies.push({
          from: moduleName,
          to: dep,
          type: 'import',
        });
      }
    }
  }

  for (const module of modules) {
    for (const pattern of REUSABLE_PATTERNS) {
      if (pattern.pattern.test(module.name)) {
        reusableComponents.push({
          name: pattern.name,
          path: module.path,
          description: `Found existing ${pattern.name} implementation`,
          canReuse: pattern.canReuse,
        });
      }
    }

    for (const pattern of CONFLICT_PATTERNS) {
      if (pattern.pattern.test(module.name)) {
        conflictRisks.push({
          area: module.path,
          severity: pattern.severity,
          description: pattern.description,
        });
      }
    }
  }

  if (reusableComponents.length > 0) {
    recommendations.push('Reuse existing CV extraction and validation modules');
    recommendations.push('Extend rather than replace existing domain logic');
  }

  if (conflictRisks.some(r => r.severity === 'high')) {
    recommendations.push('Review high-severity conflict areas before implementation');
  }

  recommendations.push('Use Phase 1-8 to integrate with existing parsers (pdf-parser.ts, docx-parser.ts)');
  recommendations.push('Leverage existing AI providers in src/lib/ai/');

  return {
    modules,
    dependencies,
    reusableComponents,
    conflictRisks,
    recommendations,
    existingFiles,
  };
}

function extractExports(content: string): string[] {
  const exportRegex = /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|interface|type)\s+(\w+)/g;
  const exports: string[] = [];
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
}

function extractDependencies(content: string): string[] {
  const importRegex = /import\s+.*?from\s+['"]([@\w/]+)['"]/g;
  const deps: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const dep = match[1];
    if (!dep.startsWith('@/')) {
      deps.push(dep);
    }
  }
  
  return [...new Set(deps)];
}

export const PHASE_0_ANALYSIS_SYSTEM_PROMPT = `You are a project analyzer. Analyze the provided project structure and generate a structured JSON describing modules, dependencies, reusable components, and conflict risks.

Output format:
{
  "modules": [{ "name": string, "path": string, "exports": string[], "dependencies": string[] }],
  "reusableComponents": [{ "name": string, "path": string, "description": string, "canReuse": boolean }],
  "conflictRisks": [{ "area": string, "severity": "low|medium|high", "description": string }],
  "recommendations": string[]
}

Do not modify any code. Only analyze and report.`;

export function getPhase0Prompt(): string {
  return PHASE_0_ANALYSIS_SYSTEM_PROMPT;
}
