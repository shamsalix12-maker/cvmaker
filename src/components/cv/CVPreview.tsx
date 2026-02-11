'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ComprehensiveCV } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown'; // Assuming this exists or markdown-to-jsx
import { Download, FileText, Code } from 'lucide-react';

interface CVPreviewProps {
    cv: ComprehensiveCV;
    locale: 'en' | 'fa';
    className?: string;
}

export function CVPreview({ cv, locale, className }: CVPreviewProps) {
    const t = useTranslations('cv');
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

    const handleDownload = (format: 'pdf' | 'docx') => {
        // Implement download logic here
        console.log(`Downloading as ${format}`);
        // This would likely call an API endpoint to generate the file
    };

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'formatted' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('formatted')}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('preview')}
                    </Button>
                    <Button
                        variant={viewMode === 'raw' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('raw')}
                    >
                        <Code className="h-4 w-4 mr-2" />
                        {t('raw_text')}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload('docx')}>
                        <Download className="h-4 w-4 mr-2" />
                        Word
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                </div>
            </div>

            <Card className="min-h-[600px] max-h-[800px] overflow-y-auto">
                <CardContent className="p-8">
                    {viewMode === 'raw' ? (
                        <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80 bg-muted/50 p-4 rounded-md">
                            {cv.raw_text || JSON.stringify(cv, null, 2)}
                        </pre>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            {/* This is a simple HTML representation related to the CV content */}
                            <h1 className="text-3xl font-bold mb-1">{cv.personal_info.full_name}</h1>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                                {cv.personal_info.email && <span>📧 {cv.personal_info.email}</span>}
                                {cv.personal_info.phone && <span>📞 {cv.personal_info.phone}</span>}
                                {cv.personal_info.location && <span>📍 {cv.personal_info.location}</span>}
                                {cv.personal_info.linkedin_url && (
                                    <a href={cv.personal_info.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                        LinkedIn
                                    </a>
                                )}
                            </div>

                            {cv.personal_info.summary && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold border-b pb-2 mb-3 uppercase tracking-wide text-primary">Professional Summary</h2>
                                    <p>{cv.personal_info.summary}</p>
                                </div>
                            )}

                            {(cv.work_experience && cv.work_experience.length > 0) && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 uppercase tracking-wide text-primary">Experience</h2>
                                    <div className="space-y-6">
                                        {cv.work_experience.map((exp, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <h3 className="text-lg font-bold">{exp.job_title}</h3>
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                                                    </span>
                                                </div>
                                                <div className="text-base font-semibold text-foreground/80 mb-2">{exp.company} {exp.location ? `— ${exp.location}` : ''}</div>
                                                <p className="whitespace-pre-line mb-2">{exp.description}</p>
                                                {exp.achievements && (
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {exp.achievements.map((ach, j) => (
                                                            <li key={j}>{ach}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(cv.education && cv.education.length > 0) && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 uppercase tracking-wide text-primary">Education</h2>
                                    <div className="space-y-4">
                                        {cv.education.map((edu, i) => (
                                            <div key={i}>
                                                <h3 className="text-lg font-bold">{edu.institution}</h3>
                                                <div className="flex justify-between">
                                                    <span>{edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}</span>
                                                    <span className="text-sm text-muted-foreground">{edu.end_date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(cv.skills && cv.skills.length > 0) && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 uppercase tracking-wide text-primary">Skills</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {cv.skills.map((skill, i) => (
                                            <span key={i} className="bg-muted px-2 py-1 rounded text-sm">
                                                {typeof skill === 'string' ? skill : (skill as any).name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
