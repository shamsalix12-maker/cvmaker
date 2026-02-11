import { Metadata } from 'next';
import { ApplicationWizard } from '@/components/application/ApplicationWizard';

export const metadata: Metadata = {
    title: 'New Job Application | CV Tailor',
    description: 'Create a tailored CV, cover letter, and application email using AI.',
};

export default function NewApplicationPage() {
    return (
        <main className="min-h-screen bg-background">
            <ApplicationWizard />
        </main>
    );
}
