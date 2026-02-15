// ============================================
// Quick Test: Run Pipeline with GLM/Gemini
// ============================================

import { runFullPipeline, runPipelineWithGapFilling } from '@/lib/pipeline';

const testCV = `
Karim Shamsasenjan
Email: k.sh.asenajn@gmail.com
Phone: +98 912 345 6789
Location: Tehran, Iran
LinkedIn: https://linkedin.com/in/karim-shamsasenjan

SUMMARY
Experienced software engineer with 5+ years in web development. Specialized in React, Node.js, and cloud technologies.

WORK EXPERIENCE
Senior Software Engineer at Tech Company (2020-Present)
- Led team of 5 developers
- Built microservices handling 1M+ requests/day
- Improved system performance by 40%

Software Engineer at Startup (2018-2020)
- Developed REST APIs
- Worked with React and TypeScript

EDUCATION
B.Sc. Computer Science, Tehran University (2014-2018)

SKILLS
JavaScript, TypeScript, React, Node.js, PostgreSQL, AWS, Docker, Git
`;

async function main() {
  console.log('🚀 Starting CV Pipeline with GLM...\n');

  const apiKey = 'TEST_KEY_MOCK';

  try {
    const results = await runPipelineWithGapFilling(
      'test-user-123',
      { text: testCV },
      {
        selectedDomains: ['software_engineering'],
        cvLanguage: 'en',
        aiProvider: 'google',
        aiModel: 'gemini-2.5-flash',
        apiKey,
        enableVersioning: true,
        enableTraceability: true,
      },
      []
    );

    console.log('\n✅ Pipeline Results:\n');
    console.log('📊 Coverage Score:', results.assessment?.coverageScore);
    console.log('📝 Overall Quality:', results.assessment?.overallQuality);
    console.log('🔢 Version:', results.canonicalCV?.version);
    console.log('📄 Word Count:', results.rendering?.metadata?.wordCount);
    console.log('\n🎯 Gaps Found:', results.gapIntelligence?.gapGuidance?.length || 0);
    
    console.log('\n📄 Final CV Output:\n');
    console.log(results.rendering?.output);
    
  } catch (error) {
    console.error('❌ Pipeline Error:', error);
  }
}

main();
