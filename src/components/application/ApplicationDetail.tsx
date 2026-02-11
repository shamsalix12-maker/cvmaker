'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { JobApplication, FinalOutput } from '@/lib/types';
import { DownloadPanel } from '@/components/application/DownloadPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Briefcase,
    FileText,
    Settings,
    MessageSquare,
    ArrowLeft,
    Edit3
} from 'lucide-react';

interface ApplicationDetailProps {
    application: JobApplication;
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
    const t = useTranslations('application');
    const router = useRouter();

    const isFinalized = application.status === 'finalized';
    const output = application.edited_output || application.final_output;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Button variant="ghost" size="sm" className="-ml-3 h-8 px-2" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back
                        </Button>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="text-xs uppercase font-bold tracking-widest">{application.status.replace('_', ' ')}</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">{application.job_title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            {application.company_name}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                            <Calendar className="h-4 w-4" />
                            Updated {formatDistanceToNow(new Date(application.updated_at), { addSuffix: true })}
                        </div>
                    </div>
                </div>

                {!isFinalized && (
                    <Button
                        size="lg"
                        onClick={() => router.push(`/new-application?id=${application.id}`)}
                        className="rounded-full font-bold shadow-lg gap-2"
                    >
                        <Edit3 className="h-4 w-4" />
                        Continue Editing
                    </Button>
                )}
            </div>

            {/* Downloads Section (Only if finalized) */}
            {isFinalized && output && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DownloadPanel
                        type="cv"
                        content={output.tailored_cv}
                        filename={`${application.job_title} - CV`}
                    />
                    <DownloadPanel
                        type="cover_letter"
                        content={output.cover_letter}
                        filename={`${application.job_title} - Cover Letter`}
                    />
                    <DownloadPanel
                        type="email"
                        content={output.application_email}
                        filename={`${application.job_title} - Email`}
                    />
                </div>
            )}

            {/* Application Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Job Description */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Job Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2">
                            {application.job_description || "No description provided."}
                        </div>
                    </CardContent>
                </Card>

                {/* Settings & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Settings className="h-5 w-5 text-primary" />
                                Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium text-muted-foreground">Language</span>
                                <Badge variant="secondary" className="uppercase font-bold">
                                    {application.output_language}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium text-muted-foreground">Tone</span>
                                <Badge variant="secondary" className="capitalize font-bold">
                                    {application.tone_setting?.preset_value || 'Custom'}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm font-medium text-muted-foreground">AI Models</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {application.ai_selections?.length || 0} Selected
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm font-medium text-muted-foreground">Drafts</span>
                                <Badge variant="outline" className="font-mono text-xs">
                                    {application.draft_outputs?.length || 0} Generated
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Prompts Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {application.selected_prompt_ids?.length > 0 ? (
                                    application.selected_prompt_ids.map(id => (
                                        <li key={id} className="truncate">Prompt ID: {id.substring(0, 8)}...</li>
                                    ))
                                ) : (
                                    <li>No custom prompts selected</li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
