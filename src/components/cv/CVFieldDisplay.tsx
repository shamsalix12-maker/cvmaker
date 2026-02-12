'use client';

import { useTranslations } from 'next-intl';
import { ComprehensiveCV, CVFieldStatus, CVSection } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceIndicator } from '@/components/cv/ConfidenceIndicator';
import { format } from 'date-fns';
import { BriefcaseIcon, GraduationCapIcon, InfoIcon, PenSquare, EyeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CVFieldDisplayProps {
    cv: ComprehensiveCV;
    fieldStatuses: CVFieldStatus[];
    confidence: number;
    onUpdate: (updates: Partial<ComprehensiveCV>) => void;
    onEditSection?: (section: string) => void;
    className?: string;
}

export function CVFieldDisplay({
    cv,
    fieldStatuses,
    confidence,
    onUpdate,
    onEditSection,
    className
}: CVFieldDisplayProps) {
    const t = useTranslations('cv');

    const formatDate = (date: string) => {
        if (!date) return '-';
        try {
            return format(new Date(date), 'MMM yyyy');
        } catch {
            return date;
        }
    };

    return (
        <div className={cn("space-y-6", className)}>

            {/* Confidence Header */}
            <div className="flex items-center justify-between">
                <ConfidenceIndicator confidence={confidence} />
                <span className="text-sm text-muted-foreground">
                    {t('last_updated')}: {formatDate(cv.updated_at)}
                </span>
            </div>

            {/* Sections Grid */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Personal Info */}
                <Card className="col-span-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <InfoIcon className="h-5 w-5 text-primary" />
                            {t('personal_info')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditSection?.('personal_info')}>
                            <PenSquare className="h-4 w-4 mr-1" />
                            {t('edit')}
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">{t('full_name')}</span>
                            <div className="font-medium">{cv.personal_info?.full_name || '-'}</div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">{t('email')}</span>
                            <div className="font-medium">{cv.personal_info?.email || '-'}</div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">{t('phone')}</span>
                            <div className="font-medium">{cv.personal_info?.phone || '-'}</div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">{t('location')}</span>
                            <div className="font-medium">{cv.personal_info?.location || '-'}</div>
                        </div>

                        <div className="col-span-full space-y-1">
                            <span className="text-xs text-muted-foreground block">{t('summary')}</span>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                {cv.personal_info?.summary || '-'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Work Experience */}
                <Card className="col-span-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BriefcaseIcon className="h-5 w-5 text-primary" />
                            {t('work_experience')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditSection?.('work_experience')}>
                            <PenSquare className="h-4 w-4 mr-1" />
                            {t('edit')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {(cv.work_experience || []).map((exp, idx) => (
                            <div key={exp.id || idx} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                                <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />

                                <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                    <div>
                                        <h4 className="font-semibold text-base">{exp.job_title}</h4>
                                        <span className="text-sm text-foreground/80">{exp.company}</span>
                                    </div>
                                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                        {formatDate(exp.start_date || '')} - {exp.is_current ? t('current_job') : (exp.end_date ? formatDate(exp.end_date) : '')}
                                    </span>
                                </div>

                                {exp.location && (
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        📍 {exp.location}
                                    </div>
                                )}

                                <p className="text-sm text-foreground/80 mb-2 whitespace-pre-wrap">
                                    {exp.description}
                                </p>

                                {exp.achievements && exp.achievements.length > 0 && (
                                    <ul className="list-disc list-inside text-sm text-foreground/80 pl-1 space-y-1">
                                        {exp.achievements.map((achievement, i) => (
                                            <li key={i}>{achievement}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}

                        {(!cv.work_experience || cv.work_experience.length === 0) && (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                No work experience added yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Education */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <GraduationCapIcon className="h-5 w-5 text-primary" />
                            {t('education')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditSection?.('education')}>
                            <PenSquare className="h-4 w-4 mr-1" />
                            {t('edit')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(cv.education || []).map((edu, idx) => (
                            <div key={edu.id || idx} className="border-b last:border-0 pb-3 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <h4 className="font-medium text-sm">{edu.degree}</h4>
                                        <div className="text-sm text-muted-foreground">{edu.institution}</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(edu.end_date)}
                                    </span>
                                </div>
                                {edu.gpa && <div className="text-xs mt-1">GPA: {edu.gpa}</div>}
                            </div>
                        ))}
                        {(!cv.education || cv.education.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                                No education added.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <EyeIcon className="h-5 w-5 text-primary" />
                            {t('skills')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditSection?.('skills')}>
                            <PenSquare className="h-4 w-4 mr-1" />
                            {t('edit')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {(cv.skills || []).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="px-2 py-0.5 text-xs font-normal">
                                    {typeof skill === 'string' ? skill : (skill as any).name || JSON.stringify(skill)}
                                </Badge>
                            ))}
                            {(!cv.skills || cv.skills.length === 0) && (
                                <div className="text-center w-full py-4 text-muted-foreground text-xs">
                                    No skills added.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Projects */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BriefcaseIcon className="h-5 w-5 text-primary" />
                            {t('projects')}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEditSection?.('projects')}>
                            <PenSquare className="h-4 w-4 mr-1" />
                            {t('edit')}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(cv.projects || []).map((proj, idx) => (
                            <div key={proj.id || idx} className="border-b last:border-0 pb-3 last:pb-0">
                                <h4 className="font-medium text-sm">{proj.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
