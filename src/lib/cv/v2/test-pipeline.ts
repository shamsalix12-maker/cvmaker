import { CVProcessorV2 } from './index';
import { AIProviderName } from '../../types';
// Removed dotenv

async function runTest() {
    console.log('🚀 Starting CV Processor V2.0 Test Pipeline...');

    const provider: AIProviderName = 'google'; // Default to google for test
    const aiModel = 'gemini-2.5-flash';
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';

    if (!apiKey) {
        console.error('❌ Error: GOOGLE_AI_API_KEY not found in .env.local');
        return;
    }

    const processor = new CVProcessorV2(provider, aiModel, apiKey);

    const sampleRawText = `
    JANE DOE
    Email: jane.doe@example.com | Phone: +1-555-0199
    Location: New York, NY
    LinkedIn: linkedin.com/in/janedoe

    SUMMARY
    Senior Software Engineer with 8 years of experience in building scalable cloud applications.

    EXPERIENCE
    Tech Innovators Inc. | Senior Software Engineer | 2020 - Present
    - Lead a team of 5 engineers to migrate legacy monolith to microservices.
    - Improved system performance by 35% using Redis caching.
    - Mentored junior developers and conducted code reviews.

    Web Solutions Ltd. | Full Stack Developer | 2017 - 2020
    - Developed and maintained multiple client websites using React and Node.js.
    - Reduced deployment time by 50% using CI/CD pipelines.

    EDUCATION
    Master of Science in Computer Science | University of Technology | 2015 - 2017
    Bachelor of Science in Software Engineering | State University | 2011 - 2015

    SKILLS
    JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, Kubernetes.
  `;

    try {
        // 1. Full Process
        console.log('\n--- PHASE 1, 2, 5, 6: Full Processing ---');
        const result = await processor.fullProcess(sampleRawText, 'Software Engineering domain rules.');

        if (!result.success) {
            console.error('❌ Pipeline failed:', result.error);
            return;
        }

        console.log('✅ Extraction Success!');
        console.log('CV ID:', result.cv?.id);
        console.log('Identity:', result.cv?.identity.full_name);
        console.log('Work Entries:', result.cv?.experience.length);

        console.log('\n--- PHASE 5: Audit Results ---');
        console.log('Overall Score:', result.audit?.overall_score);
        console.log('Audit Items:', result.audit?.items.length);

        console.log('\n--- PHASE 6: Gap Guidance ---');
        console.log('Gaps identified:', result.gaps?.items.length);
        result.gaps?.items.forEach((gap, i) => {
            console.log(`${i + 1}. [${gap.field}] ${gap.guidance_text}`);
        });

        // 2. Phase 7: Merge Patch
        console.log('\n--- PHASE 7: Merging Patch ---');
        const patch = {
            identity: {
                website_url: 'https://janedoe.dev'
            },
            skills: ['Go', 'GraphQL']
        } as any;
        const mergedCV = processor.merger.merge(result.cv!, patch);
        console.log('✅ Merge Success!');
        console.log('New Version:', mergedCV.version);
        console.log('Updated Skills:', mergedCV.skills.slice(-2));

        // 3. Phase 8: Rendering
        console.log('\n--- PHASE 8: Rendering Final CV ---');
        const renderResult = await processor.renderer.render(mergedCV, ['Software Engineering']);
        if (renderResult.success) {
            console.log('✅ Rendering Success!');
            console.log('--- FINAL TEXT START ---');
            console.log(renderResult.text);
            console.log('--- FINAL TEXT END ---');
        }

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    }
}

runTest();
