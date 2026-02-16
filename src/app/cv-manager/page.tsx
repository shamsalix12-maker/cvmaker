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
      aiProvider="google"
      aiModel="gemini-2.0-flash-exp"
      onComplete={handleComplete}
    />
  );
}
