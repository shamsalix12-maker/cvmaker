'use client';

import { useState, useCallback } from 'react';
import {
    JobApplication,
    ApplicationStatus,
    DraftOutput,
    FinalOutput,
    AISelection,
    ToneSetting,
    OutputLanguage
} from '@/lib/types';
import { toast } from 'sonner';

export function useApplication(initialId?: string) {
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchApplication = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/applications/${id}`);
            if (!res.ok) throw new Error('Failed to fetch application');
            const data = await res.json();
            setApplication(data);
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createApplication = async (params: Partial<JobApplication>) => {
        setLoading(true);
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error('Failed to create application');
            const data = await res.json();
            setApplication(data);
            toast.success('Application started');
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateApplication = async (updates: Partial<JobApplication>) => {
        if (!application) return null;
        try {
            const res = await fetch(`/api/applications/${application.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error('Failed to update application');
            const data = await res.json();
            setApplication(data);
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        }
    };

    const startProcessing = async () => {
        if (!application) return null;
        setProcessing(true);
        try {
            const res = await fetch(`/api/applications/${application.id}/process`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('AI processing failed');
            const data = await res.json();
            setApplication(data);
            toast.success('Drafts generated');
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        } finally {
            setProcessing(false);
        }
    };

    const finalizeApplication = async () => {
        if (!application) return null;
        setProcessing(true);
        try {
            const res = await fetch(`/api/applications/${application.id}/finalize`, {
                method: 'POST'
            });
            if (!res.ok) throw new Error('Consolidation failed');
            const data = await res.json();
            setApplication(data);
            toast.success('Documents finalized');
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        } finally {
            setProcessing(false);
        }
    };

    const submitAnswer = async (answer: string) => {
        if (!application) return null;
        setProcessing(true);
        try {
            const res = await fetch(`/api/applications/${application.id}/clarify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer })
            });
            if (!res.ok) throw new Error('Clarification failed');
            const data = await res.json();
            setApplication(data);
            toast.success('Answer submitted');
            return data;
        } catch (error: any) {
            toast.error(error.message);
            return null;
        } finally {
            setProcessing(false);
        }
    };

    return {
        application,
        setApplication,
        loading,
        processing,
        fetchApplication,
        createApplication,
        updateApplication,
        startProcessing,
        finalizeApplication,
        submitAnswer
    };
}
