# CV Tailor App - Project Architecture & Technical Map

## 1. Project Overview
**Name:** CV Tailor App
**Framework:** Next.js 16 (App Router)
**Language:** TypeScript
**Database:** Supabase (PostgreSQL)
**Styling:** Tailwind CSS + Radix UI
**AI Engine:** Multi-provider (OpenAI, Anthropic, Google Gemini)

## 2. High-Level Architecture
The application works as a "Job Application Assistant".
1.  **Input:** Users upload a CV (PDF/Word) or enter data manually.
2.  **Storage:** Data is normalized into a `ComprehensiveCV` JSON structure and stored in Supabase.
3.  **Job Application Flow:**
    *   User provides a Job Description (JD).
    *   User selects tone, AI model, and templates.
    *   System generates a tailored CV, Cover Letter, and Email.
4.  **Output:** Drafts can be edited and exported as DOCX/PDF.

## 3. Directory Structure Map
```
src/
├── app/                  # Next.js App Router
│   ├── [locale]/         # Internationalized Routes (en, fa)
│   │   ├── applications/ # Job Application Management
│   │   ├── cv-manager/   # CV Editing & Upload Interface
│   │   ├── new-app/      # Wizard for creating new applications
│   │   ├── settings/     # User config (AI keys, preferences)
│   │   └── dashboard/    # Main user overview
│   └── api/              # Backend Endpoints
│       ├── cv/           # CV CRUD & Extraction
│       ├── ai/           # AI Generation handling
│       └── export/       # Document Generation (PDF/DOCX)
├── lib/                  # Core Logic
│   ├── cv/               # CV parsing & validation logic
│   ├── ai/               # AI provider wrappers & logic
│   ├── types.ts          # CENTRAL TYPE DEFINITIONS
│   └── supabase/         # Database clients
└── components/           # UI Components (Radix + Tailwind)
```

## 4. System Inputs & Outputs

### Inputs
1.  **User Authentication:**
    *   Email/Password or Google OAuth (Supabase Auth).
    *   *Dev Mode Support:* LocalStorage fallback for non-authenticated dev work.
2.  **CV Data Entry:**
    *   **File Upload:** PDF (`pdf-parse`) or DOCX (`mammoth`/`docx`).
    *   **Raw Text:** Paste text directly.
    *   **Manual Form:** Structured input for experience, education, etc.
3.  **Job Application Context:**
    *   Job Title & Company Name.
    *   Job Description (Text).
    *   Tone Settings (Formal, Creative, etc.).
    *   Output Language (English, Persian, etc.).
4.  **Configuration:**
    *   AI Provider API Keys (Encrypted).
    *   Custom Prompts.

### Outputs
1.  **Structured Data (Internal):**
    *   `ComprehensiveCV` object (Normalized JSON).
    *   `JobApplication` record (Drafts & Final versions).
2.  **Generated Content (AI):**
    *   Tailored CV Content (Markdown/JSON).
    *   Cover Letter (Markdown).
    *   Interview Follow-up Emails.
3.  **Files (Export):**
    *   **DOCX:** Generated via `docx` library.
    *   **PDF:** Converted from DOM or DOCX.

## 5. Key Variables & Data Structures

### A. Core Database Tables (Supabase)
| Table | Description | Key Column |
| :--- | :--- | :--- |
| `users` | User profiles | `preferred_language` |
| `comprehensive_cvs` | **Main Data Store.** Stores the user's master CV. | `personal_info`, `work_experience` (JSONB) |
| `job_applications` | Tracks each job application attempt. | `job_description`, `final_output` (JSONB) |
| `ai_api_keys` | Stores user's API keys securely. | `api_key_encrypted` |
| `prompts` | System & User prompts for generation. | `prompt_text` |

### B. Critical TypeScript Interfaces (`src/lib/types.ts`)

#### `ComprehensiveCV` (The Master Object)
This object holds *everything* about a user's professional history.
```typescript
interface ComprehensiveCV {
    personal_info: PersonalInfo;
    work_experience: WorkExperience[];
    education: Education[];
    skills: string[];
    certifications: Certification[];
    languages: Language[];
    projects: Project[];
    // ...
}
```

#### `JobApplication` (The Process State)
Tracks the lifecycle of applying to a specific job.
```typescript
interface JobApplication {
    job_description: string;
    status: 'input' | 'processing' | 'draft_ready' | 'finalized';
    draft_outputs: DraftOutput[]; // AI Generated versions
    final_output: FinalOutput;    // Selected version
}
```

## 6. Dependencies & Libraries (Key Selection)

### Core
*   **`next` (16.1.6)**: Framework.
*   **`react` (19.2.3)**: UI Library.
*   **`@supabase/supabase-js`**: Database & Auth.

### AI & Processing
*   **`@google/generative-ai`**: Gemini API.
*   **`@anthropic-ai/sdk`**: Claude API.
*   **`openai`**: GPT API.
*   **`langchain`** (Not explicitly seen, likely direct SDK usage).

### File Handling
*   **`pdf-parse`**: Extract text from PDFs.
*   **`mammoth` / `docx`**: Read/Write Word documents.

### UI
*   **`tailwindcss`**: Styling.
*   **`radix-ui/*`**: Accessible primitives (Dialog, Tabs, etc.).
*   **`lucide-react`**: Icons.
*   **`sonner`**: Toast notifications.

## 7. Logic Flow: CV Extraction (Example)
1.  **User** uploads PDF.
2.  **Frontend** reads file -> sends to `/api/cv/extract`.
3.  **API** uses `pdf-parse` to get raw text.
4.  **API** calls AI (Gemini/Claude) with `cv-extraction-prompt`.
5.  **AI** returns JSON matching `ComprehensiveCV` schema.
6.  **Backend** validates JSON -> Returns to Frontend.
7.  **Frontend** updates `useCV` state -> Optimistic UI update.
