# CV Manager Module - Comprehensive Documentation & Code (Updated)

## 1. Module Overview & Philosophy

The **CV Manager** is the foundational module of the CV Tailor application. Its purpose is to create and maintain a "Master CV" (Comprehensive CV) for the user. This Master CV serves as the single source of truth from which tailored resumes, cover letters, and application emails are generated.

### Core Logic & Workflow:

1.  **Ingestion Phase**: The system accepts inputs in two ways:
    *   **File Upload**: Supports `.pdf`, `.docx`, `.md`, and `.txt`.
    *   **Manual Paste**: Users can paste raw text from any source.
2.  **Server-Side Parsing**:
    *   Files are processed on the server to prevent client-side bundling issues.
    *   **PDF**: Processed via `pdf-parse` (Server-side dynamic import).
    *   **DOCX**: Processed via `mammoth`.
    *   **Text/MD**: Read directly as strings.
3.  **AI Orchestration**:
    *   The raw text is sent to the AI (primarily Google Gemini 1.5/2.0) with a sophisticated **System Prompt**.
    *   The prompt enforces a strict JSON schema, ensuring that professional experience is mapped to structured fields.
4.  **Data Transformation & Validation**:
    *   The AI's JSON is passed through a transformer (`cv-extractor.ts`) which ensures every entry has a unique ID and missing sections are initialized.
    *   A validator runs to calculate completion percentages.
5.  **Persistence Layer**:
    *   The data is stored in the `comprehensive_cvs` table in Supabase.
    *   **Native Upsert**: Uses Postgres `ON CONFLICT (user_id)` to prevent race conditions.
6.  **User Interaction (UI)**:
    *   Multi-tab interface: Upload, Edit Fields, Preview.

---

## 2. Core Code - Logic & Backend

### 2.1 API Route: Extraction (`src/app/api/cv/extract/route.ts`)
Handles the incoming file/text, dispatches to parsers, and manages authentication and decryption.

```typescript
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserId(request);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json({ error: 'Expected multipart/form-data request' }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const rawText = formData.get('rawText') as string | null;
        const provider = formData.get('provider') as AIProviderName;
        const model = formData.get('model') as string;

        if (!provider || !model) return NextResponse.json({ error: 'AI provider and model required' }, { status: 400 });

        const { data: keyData } = await supabase
            .from('ai_api_keys')
            .select('api_key_encrypted')
            .eq('user_id', userId)
            .eq('provider_name', provider)
            .single();

        if (!keyData) return NextResponse.json({ error: `No API key for ${provider}` }, { status: 400 });
        const apiKey = decryptApiKey(keyData.api_key_encrypted);

        let textToProcess: string;
        if (file) {
            const parsed = await parseFile(file);
            textToProcess = parsed.text;
        } else {
            textToProcess = rawText || '';
        }

        if (!textToProcess.trim()) return NextResponse.json({ error: 'Empty text' }, { status: 400 });

        const result = await extractCVWithAI({ rawText: textToProcess, aiProvider: provider, aiModel: model }, apiKey);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Extract] Server Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
```

### 2.2 AI Extractor Engine (`src/lib/cv/cv-extractor.ts`)
Converts raw AI text into valid objects and handles all CV sections.

```typescript
function transformAICVData(parsed: any, rawText?: string): Partial<ComprehensiveCV> {
    const addIds = (arr: any[]) => (arr || []).map(item => ({ ...item, id: item.id || generateId() }));

    return {
        personal_info: parsed.personal_info || {},
        work_experience: addIds(parsed.work_experience),
        education: addIds(parsed.education),
        skills: parsed.skills || [],
        certifications: addIds(parsed.certifications),
        languages: (parsed.languages || []).map((l: any) => ({
            language: l.language || '',
            proficiency: (l.proficiency?.toLowerCase() || 'intermediate') as any,
        })),
        projects: addIds(parsed.projects),
        additional_sections: addIds(parsed.additional_sections),
        raw_text: rawText || parsed.raw_text,
    };
}

export async function extractCVWithAI(request: CVExtractionRequest, apiKey: string): Promise<CVExtractionResult> {
    try {
        const provider = getAIProvider(request.aiProvider);
        const response = await provider.complete({ apiKey, temperature: 0.1, maxTokens: 4096 }, {
            model: request.aiModel,
            messages: [
                { id: 'sys-1', role: 'system', content: CV_EXTRACTION_SYSTEM_PROMPT },
                { id: 'usr-1', role: 'user', content: CV_EXTRACTION_USER_PROMPT(request.rawText) }
            ],
            jsonMode: request.aiProvider !== 'google',
        });

        const parsed = provider.parseJsonResponse<any>(response);
        if (!parsed) return { success: false, extractionNotes: 'AI failed to return valid JSON' /* ... */ };

        const cv = transformAICVData(parsed, request.rawText);
        return { success: true, cv, /* ... */ };
    } catch (error: any) {
        return { success: false, extractionNotes: `Extraction failed: ${error.message}` /* ... */ };
    }
}
```

---

## 3. Core Code - Frontend & UI

### 3.1 Main Hook (`src/hooks/useCV.ts`)
Uses `FormData` for proper API communication.

```typescript
const extractFromText = useCallback(async (text: string, provider: AIProviderName, model: string) => {
    const formData = new FormData();
    formData.append('rawText', text);
    formData.append('provider', provider);
    formData.append('model', model);

    const res = await fetch('/api/cv/extract', {
        method: 'POST',
        headers: isDevUser(user.id) ? { 'x-user-id': user.id } : {},
        body: formData
    });

    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.error || result.extractionNotes);
    return result;
}, [user]);
```

### 3.2 UI Page (`src/app/[locale]/cv-manager/page.tsx`)
Handles states, errors, and fallback logic.

```typescript
const handleManualConfirm = async (rawText: string) => {
    // try {
    //    const result = await extractFromText(rawText, 'google', 'gemini-1.5-flash');
    //    if (result.success) { await applyExtraction(result); setActiveTab('fields'); }
    //    else { await saveCV({ raw_text: rawText, ... }); }
    // } catch (err) { ... fallback to saving raw text ... }
};
```

---

## 4. Key Fixes Applied (Refactor v2)

1.  **Data Flow**: Switched from JSON body to `FormData` in `useCV.ts` to match server expectations.
2.  **Robustness**: Added global `try-catch` in API routes and AI logic.
3.  **Parsers**: Used dynamic `import()` for `pdf-parse` to fix environment/build issues.
4.  **Database**: Replaced manual "Check-then-Write" with native Supabase `.upsert()`.
5.  **Completeness**: `transformAICVData` now maps **Languages**, **Certifications**, and **Projects** which were previously ignored.
