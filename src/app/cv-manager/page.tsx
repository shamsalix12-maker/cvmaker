'use client';

import { CVCompletionFlow } from '@/components/cv/CVCompletionFlow';

export default function CVManagerTestPage() {
  const handleComplete = (cv: unknown) => {
    console.log('CV saved:', cv);
    alert('CV saved successfully! Check console for details.');
  };

  return (
    <CVCompletionFlow
      locale="fa"
      aiProvider="groq"
      aiModel="llama-3.3-70b-versatile"
      onComplete={handleComplete}
    />
  );
}
