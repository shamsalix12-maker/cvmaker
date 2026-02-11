'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    ComprehensiveCV,
    CVFieldStatus,
    CVExtractionResult,
    AIProviderName
} from '@/lib/types';
import { validateExtractedCV, getCompletionPercentage } from '@/lib/cv/cv-validator';

interface UseCVReturn {
    cv: ComprehensiveCV | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    fieldStatuses: CVFieldStatus[];
    completionPercentage: number;

    // Actions
    fetchCV: () => Promise<void>;
    saveCV: (cvData: Partial<ComprehensiveCV>) => Promise<void>;
    updateCV: (updates: Partial<ComprehensiveCV>) => Promise<void>;
    updateField: (fieldPath: string, value: any) => Promise<void>;
    deleteCV: () => Promise<void>;

    // AI Extraction
    extractFromFile: (
        file: File,
        provider: AIProviderName,
        model: string
    ) => Promise<CVExtractionResult>;

    extractFromText: (
        text: string,
        provider: AIProviderName,
        model: string
    ) => Promise<CVExtractionResult>;

    applyExtraction: (result: CVExtractionResult) => Promise<void>;
}

export function useCV(): UseCVReturn {
    const { user } = useAuth();

    const [cv, setCV] = useState<ComprehensiveCV | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived state
    const fieldStatuses = cv ? validateExtractedCV(cv) : [];
    const completionPercentage = getCompletionPercentage(fieldStatuses);

    // Fetch CV on mount
    useEffect(() => {
        if (user) {
            fetchCV();
        } else {
            setCV(null);
            setLoading(false);
        }
    }, [user?.id]);

    const fetchCV = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/cv', {
                headers: { 'x-user-id': user.id }
            });

            const data = await res.json();

            if (data.error && data.error !== 'Unauthorized') {
                throw new Error(data.error);
            }

            setCV(data.cv || null);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            setCV(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const saveCV = useCallback(async (cvData: Partial<ComprehensiveCV>) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({ cv: cvData })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCV(data.cv);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [user]);

    const updateCV = useCallback(async (updates: Partial<ComprehensiveCV>) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/cv', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({ updates })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCV(data.cv);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [user]);

    const updateField = useCallback(async (fieldPath: string, value: any) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/cv', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.id
                },
                body: JSON.stringify({ fieldPath, value })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCV(data.cv);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [user]);

    const deleteCV = useCallback(async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/cv', {
                method: 'DELETE',
                headers: { 'x-user-id': user.id }
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCV(null);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSaving(false);
        }
    }, [user]);

    const extractFromFile = useCallback(async (
        file: File,
        provider: AIProviderName,
        model: string
    ): Promise<CVExtractionResult> => {
        if (!user) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', provider);
        formData.append('model', model);

        const res = await fetch('/api/cv/extract', {
            method: 'POST',
            headers: { 'x-user-id': user.id },
            body: formData
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.extractionNotes || 'Extraction failed');
        }

        return result;
    }, [user]);

    const extractFromText = useCallback(async (
        text: string,
        provider: AIProviderName,
        model: string
    ): Promise<CVExtractionResult> => {
        if (!user) throw new Error('Not authenticated');

        const formData = new FormData();
        formData.append('rawText', text);
        formData.append('provider', provider);
        formData.append('model', model);

        const res = await fetch('/api/cv/extract', {
            method: 'POST',
            headers: { 'x-user-id': user.id },
            body: formData
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.extractionNotes || 'Extraction failed');
        }

        return result;
    }, [user]);

    const applyExtraction = useCallback(async (result: CVExtractionResult) => {
        await saveCV(result.cv);
    }, [saveCV]);

    return {
        cv,
        loading,
        saving,
        error,
        fieldStatuses,
        completionPercentage,
        fetchCV,
        saveCV,
        updateCV,
        updateField,
        deleteCV,
        extractFromFile,
        extractFromText,
        applyExtraction,
    };
}
