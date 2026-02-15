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
import { isDevUser } from '@/lib/auth/dev-auth';

interface UseCVReturn {
    cv: ComprehensiveCV | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    fieldStatuses: CVFieldStatus[];
    completionPercentage: number;
    audit: any | null;
    gaps: any | null;

    // Actions
    fetchCV: () => Promise<void>;
    saveCV: (cvData: Partial<ComprehensiveCV>) => Promise<void>;
    updateCV: (updates: Partial<ComprehensiveCV>) => Promise<void>;
    updateField: (fieldPath: string, value: any) => Promise<void>;
    deleteCV: () => Promise<void>;

    // AI Extraction/Refinement
    extractFromFile: (
        file: File,
        provider: AIProviderName,
        model: string,
        managerVersion?: string
    ) => Promise<CVExtractionResult>;

    extractFromText: (
        text: string,
        provider: AIProviderName,
        model: string,
        managerVersion?: string
    ) => Promise<CVExtractionResult>;

    refineCV: (params: {
        currentCV?: Partial<ComprehensiveCV>;
        resolvedGaps?: { gapId: string; userInput: string }[];
        selectedDomains?: string[];
        instructions?: string;
        additionalText?: string;
        cvLanguage?: string;
        provider?: AIProviderName;
        model?: string;
        managerVersion?: string;
    }) => Promise<CVExtractionResult>;

    applyExtraction: (result: CVExtractionResult) => Promise<void>;
}

export function useCV(): UseCVReturn {
    const { user } = useAuth();

    const [cv, setCV] = useState<ComprehensiveCV | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audit, setAudit] = useState<any | null>(null);
    const [gaps, setGaps] = useState<any | null>(null);

    // Derived state
    const fieldStatuses = cv ? validateExtractedCV(cv) : [];
    const completionPercentage = getCompletionPercentage(fieldStatuses);


    const fetchCV = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        // DEV MODE: First check Local Storage to prevent overwrite
        if (isDevUser(user.id)) {
            try {
                const localData = localStorage.getItem(`cv_data_${user.id}`);
                if (localData) {
                    console.log('[useCV] Dev Mode: Loaded CV from LocalStorage');
                    setCV(JSON.parse(localData));
                    setLoading(false);
                    return; // Stop here, do not call API
                }
            } catch (e) {
                console.error('[useCV] Failed to load local CV:', e);
            }
        }

        try {
            const headers: HeadersInit = {};
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/cv', {
                headers
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

    // Fetch CV on mount
    useEffect(() => {
        if (user) {
            fetchCV();
        } else {
            setCV(null);
            setLoading(false);
        }
    }, [user?.id, fetchCV]);

    const saveCV = useCallback(async (cvData: Partial<ComprehensiveCV>) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        // Optimistic update - set CV immediately so UI reflects changes
        // even if the save fails (e.g. RLS issues in dev mode)
        const optimisticCV = {
            ...cv, // Keep existing fields if partial update
            ...cvData,
            user_id: user.id
        } as ComprehensiveCV;

        setCV(optimisticCV);

        if (isDevUser(user.id)) {
            console.warn('[useCV] Dev Mode: Saving to LocalStorage (Cloud Skipped)');
            try {
                // Simulate save delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Use the optimistic object as base to ensure we have the latest merged state
                const finalCV = {
                    ...optimisticCV,
                    updated_at: new Date().toISOString(),
                    created_at: cv?.created_at || new Date().toISOString(),
                } as ComprehensiveCV;

                // Update local state with timestamps
                setCV(finalCV);

                localStorage.setItem(`cv_data_${user.id}`, JSON.stringify(finalCV));
                window.dispatchEvent(new Event('storage'));
                console.log('[useCV] Dev Mode: Saved to LocalStorage successfully.');
            } catch (e) {
                console.error('Local storage save failed', e);
            }

            setSaving(false);
            return;
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/cv', {
                method: 'POST',
                headers,
                body: JSON.stringify({ cv: cvData })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // If success, update with server response (which might have generated IDs etc)
            setCV(data.cv);

        } catch (err: any) {
            setError(err.message);
            // We usually re-throw to let the caller handle UI feedback
            throw err;
        } finally {
            setSaving(false);
        }
    }, [user, cv]);

    const updateCV = useCallback(async (updates: Partial<ComprehensiveCV>) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        // DEV MODE: Local Storage Persistence
        if (isDevUser(user.id)) {
            try {
                const updatedCV = {
                    ...(cv || {}),
                    ...updates,
                    updated_at: new Date().toISOString()
                } as ComprehensiveCV;

                setCV(updatedCV);
                localStorage.setItem(`cv_data_${user.id}`, JSON.stringify(updatedCV));
                window.dispatchEvent(new Event('storage'));
                console.log('[useCV] Dev Mode: Updated CV in LocalStorage');
            } catch (e) {
                console.error('[useCV] Failed to update local CV:', e);
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/cv', {
                method: 'PUT',
                headers,
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
    }, [user, cv]);

    const updateField = useCallback(async (fieldPath: string, value: any) => {
        if (!user) return;

        setSaving(true);
        setError(null);

        // DEV MODE: Local Storage Persistence for Field Updates
        if (isDevUser(user.id)) {
            try {
                if (!cv) throw new Error("No CV found to update");
                const newCV = JSON.parse(JSON.stringify(cv)); // Deep clone

                // Simple dot-notation setter
                const keys = fieldPath.split('.');
                let current = newCV;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;

                newCV.updated_at = new Date().toISOString();

                setCV(newCV);
                localStorage.setItem(`cv_data_${user.id}`, JSON.stringify(newCV));
                window.dispatchEvent(new Event('storage'));
                console.log(`[useCV] Dev Mode: Updated field ${fieldPath} in LocalStorage`);
            } catch (e: any) {
                console.error('[useCV] Failed to update local field:', e);
                setError(e.message);
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/cv', {
                method: 'PUT',
                headers,
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
    }, [user, cv]);

    const deleteCV = useCallback(async () => {
        if (!user) return;

        setSaving(true);
        setError(null);

        // DEV MODE: Delete from Local Storage
        if (isDevUser(user.id)) {
            try {
                localStorage.removeItem(`cv_data_${user.id}`);
                setCV(null);
                window.dispatchEvent(new Event('storage'));
                console.log('[useCV] Dev Mode: Deleted CV from LocalStorage');
            } catch (e) {
                console.error('[useCV] Failed to delete local CV:', e);
            } finally {
                setSaving(false);
            }
            return;
        }

        try {
            const headers: HeadersInit = {};
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/cv', {
                method: 'DELETE',
                headers
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
        model: string,
        managerVersion?: string
    ): Promise<CVExtractionResult> => {
        if (!user) throw new Error('Not authenticated');

        console.log('[useCV] extractFromFile called', { provider, model, isDev: isDevUser(user.id) });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', provider);
        formData.append('model', model);
        if (managerVersion) formData.append('managerVersion', managerVersion);

        const headers: HeadersInit = {};
        if (isDevUser(user.id)) {
            headers['x-user-id'] = user.id;
            const storedKeys = localStorage.getItem('ai_api_keys_dev');
            if (storedKeys) {
                try {
                    const keys = JSON.parse(storedKeys);
                    const keyForProvider = keys.find((k: any) => k.provider_name === provider);
                    if (keyForProvider?.api_key) {
                        formData.append('devApiKey', keyForProvider.api_key);
                        console.log('[useCV] Dev Mode: Added API key from localStorage for', provider);
                    }
                } catch (e) {
                    console.error('[useCV] Failed to parse stored API keys:', e);
                }
            }
        }

        const res = await fetch('/api/cv/extract', {
            method: 'POST',
            headers,
            body: formData
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
            throw new Error(result.extractionNotes || result.error || 'Extraction failed');
        }

        return result;
    }, [user]);

    const extractFromText = useCallback(async (
        text: string,
        provider: AIProviderName,
        model: string,
        managerVersion?: string
    ): Promise<CVExtractionResult> => {
        if (!user) throw new Error('Not authenticated');

        console.log('[useCV] extractFromText called', { provider, model, textLength: text.length, isDev: isDevUser(user.id) });

        const formData = new FormData();
        formData.append('rawText', text);
        formData.append('provider', provider);
        formData.append('model', model);
        if (managerVersion) formData.append('managerVersion', managerVersion);

        const headers: HeadersInit = {};
        if (isDevUser(user.id)) {
            headers['x-user-id'] = user.id;
            const storedKeys = localStorage.getItem('ai_api_keys_dev');
            if (storedKeys) {
                try {
                    const keys = JSON.parse(storedKeys);
                    const keyForProvider = keys.find((k: any) => k.provider_name === provider);
                    if (keyForProvider?.api_key) {
                        formData.append('devApiKey', keyForProvider.api_key);
                        console.log('[useCV] Dev Mode: Added API key from localStorage for', provider);
                    }
                } catch (e) {
                    console.error('[useCV] Failed to parse stored API keys:', e);
                }
            }
        }

        const res = await fetch('/api/cv/extract', {
            method: 'POST',
            headers,
            body: formData
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.error || result.extractionNotes || 'Extraction failed');
        }

        if (!result.success) {
            throw new Error(result.extractionNotes || 'AI extraction returned failure status');
        }

        return result;
    }, [user]);

    const refineCV = useCallback(async (
        params: {
            currentCV?: Partial<ComprehensiveCV>;
            resolvedGaps?: { gapId: string; userInput: string }[];
            selectedDomains?: string[];
            instructions?: string;
            additionalText?: string;
            cvLanguage?: string;
            provider?: AIProviderName;
            model?: string;
            managerVersion?: string;
        }
    ): Promise<CVExtractionResult> => {
        const {
            currentCV: providedCV,
            resolvedGaps,
            selectedDomains,
            instructions,
            additionalText,
            cvLanguage,
            provider,
            model,
            managerVersion
        } = params;

        const baseCV = providedCV || cv;
        if (!user || !baseCV) throw new Error('Not authenticated or no CV to refine');

        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (isDevUser(user.id)) {
            headers['x-user-id'] = user.id;
        }

        console.log('[REFINE-DEBUG-8] Sending refine request');

        const res = await fetch('/api/cv/refine', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                currentCV: baseCV, // Using provided or hook's CV
                resolvedGaps,
                selectedDomains,
                instructions,
                additionalText,
                cvLanguage,
                provider,
                model,
                managerVersion
            })
        });

        const result = await res.json();

        console.log('[REFINE-DEBUG-9] Refine response:', {
            status: res.status,
            hasData: !!result,
            dataSections: result && result.cv ? Object.keys(result.cv) : []
        });

        if (!res.ok || !result.success) {
            throw new Error(result.error || result.extractionNotes || 'Refinement failed');
        }

        return result;
    }, [user, cv]);

    const applyExtraction = useCallback(async (result: CVExtractionResult) => {
        if (result.audit) setAudit(result.audit);
        if (result.gaps) setGaps(result.gaps);
        await saveCV(result.cv);
    }, [saveCV]);

    return {
        cv,
        loading,
        saving,
        error,
        fieldStatuses,
        completionPercentage,
        audit,
        gaps,
        fetchCV,
        saveCV,
        updateCV,
        updateField,
        deleteCV,
        extractFromFile,
        extractFromText,
        refineCV,
        applyExtraction,
    };
}
