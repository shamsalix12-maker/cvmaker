import { JobApplication, ComprehensiveCV, ToneSetting } from '@/lib/types';

export class ApplicationPrompts {
    /**
     * System prompt for analyzing job description vs CV
     */
    static getAnalysisPrompt(cv: ComprehensiveCV, jobDescription: string) {
        return `
You are an expert career consultant and CV writer. 
Your task is to analyze a candidate's comprehensive CV against a specific Job Description.

Candidate's CV Data (JSON):
${JSON.stringify(cv, null, 2)}

Job Description:
${jobDescription}

Identify:
1. Key skills and requirements in the Job Description.
2. Matching experience and skills in the CV.
3. Significant gaps where more information might be needed to tailor the CV effectively.
4. Strategic points to emphasize for this specific role.

If critical information is missing to make a strong case for a mandatory requirement, suggest 1-3 targeted questions to ask the candidate.
`;
    }

    /**
     * System prompt for generating clarifying questions
     */
    static getClarificationPrompt() {
        return `
Based on the previous analysis, if there are critical gaps in information, ask the candidate 1-3 specific, polite questions.
These questions should aim to uncover hidden experience or skills that match the job description but are not explicitly detailed in the current CV.
Keep the questions professional and focused.
`;
    }

    /**
     * System prompt for drafting tailored content
     */
    static getDraftingPrompt(
        cv: ComprehensiveCV,
        jobDescription: string,
        tone: ToneSetting,
        language: string,
        additionalContext?: string
    ) {
        const toneDesc = tone.mode === 'preset' ? tone.preset_value : tone.custom_text;

        return `
You are an expert ${language === 'fa' ? 'Persian' : 'English'} CV writer.
Task: Create a highly tailored draft for this job application.

Target Tone: ${toneDesc}
Output Language: ${language}

Candidate's CV:
${JSON.stringify(cv, null, 2)}

Job Description:
${jobDescription}

${additionalContext ? `Additional Candidate Context:\n${additionalContext}` : ''}

Generate a compelling draft that highlights the candidate's most relevant achievements.
Focus on impact and quantifiable results. 
Use industry-specific keywords from the job description naturally.
`;
    }

    /**
     * System prompt for consolidating multiple drafts into the final 3-part output
     */
    static getConsolidationPrompt(drafts: string[], language: string) {
        return `
You are a master editor. You are provided with multiple AI-generated drafts for a job application.
Your goal is to synthesize these drafts into one high-quality, professional final output.

Final output must be a JSON object with exactly these three keys:
1. "tailored_cv": A full, formatted CV ready for use.
2. "cover_letter": A professional cover letter.
3. "application_email": A concise and effective email to the hiring manager.

Drafts to merge:
${drafts.map((d, i) => `--- DRAFT ${i + 1} ---\n${d}`).join('\n\n')}

Requirements:
- Merge the best points from all drafts.
- Ensure consistent tone and flawless ${language === 'fa' ? 'Persian' : 'English'} grammar.
- Use professional formatting (clear headings, bullet points).
- The tailored_cv should follow the general structure of a modern CV but be specifically tuned to the job description provided in previous context.
- Return ONLY the JSON object.
`;
    }
}
