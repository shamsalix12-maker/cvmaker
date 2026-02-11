// ============================================
// [F083] src/hooks/usePrompts.ts
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Prompt } from '@/lib/types';
import { PROMPT_CATEGORIES } from '@/lib/prompts/default-prompts';

interface UsePromptsOptions {
    activeOnly?: boolean;
    category?: string;
    autoFetch?: boolean;
}

interface UsePromptsReturn {
    prompts: Prompt[];
    loading: boolean;
    error: string | null;
    categories: typeof PROMPT_CATEGORIES;
    fetchPrompts: () => Promise<void>;
    searchPrompts: (query: string, locale?: 'en' | 'fa') => Promise<void>;
    createPrompt: (prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => Promise<Prompt>;
    updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<Prompt>;
    deletePrompt: (id: string) => Promise<void>;
    togglePromptActive: (id: string) => Promise<Prompt>;
    getPromptsByIds: (ids: string[]) => Promise<Prompt[]>;
}

export function usePrompts(options: UsePromptsOptions = {}): UsePromptsReturn {
    const { activeOnly = false, category, autoFetch = true } = options;

    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper to get headers with dev user ID if present
    const getHeaders = useCallback((baseHeaders: HeadersInit = {}): HeadersInit => {
        const headers: any = { ...baseHeaders };
        if (typeof window !== 'undefined') {
            const storedDevUser = localStorage.getItem('cv_tailor_dev_user');
            if (storedDevUser) {
                try {
                    const user = JSON.parse(storedDevUser);
                    if (user && user.id && user.id.startsWith('dev-user-')) {
                        headers['x-user-id'] = user.id;
                    }
                } catch (e) {
                    console.warn('Failed to parse dev user for headers', e);
                }
            }
        }
        return headers;
    }, []);

    const fetchPrompts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (activeOnly) params.set('active', 'true');
            if (category) params.set('category', category);

            const res = await fetch(`/api/prompts?${params}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrompts(data.prompts || []);
        } catch (err: any) {
            setError(err.message);
            setPrompts([]);
        } finally {
            setLoading(false);
        }
    }, [activeOnly, category, getHeaders]);

    const searchPrompts = useCallback(async (query: string, locale: 'en' | 'fa' = 'en') => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ search: query, locale });
            const res = await fetch(`/api/prompts?${params}`, {
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setPrompts(data.prompts || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const createPrompt = useCallback(async (
        prompt: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Prompt> => {
        const res = await fetch('/api/prompts', {
            method: 'POST',
            headers: getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(prompt)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPrompts(prev => [...prev, data.prompt]);
        return data.prompt;
    }, [getHeaders]);

    const updatePrompt = useCallback(async (
        id: string, updates: Partial<Prompt>
    ): Promise<Prompt> => {
        const res = await fetch(`/api/prompts/${id}`, {
            method: 'PUT',
            headers: getHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPrompts(prev => prev.map(p => p.id === id ? data.prompt : p));
        return data.prompt;
    }, [getHeaders]);

    const deletePrompt = useCallback(async (id: string): Promise<void> => {
        const res = await fetch(`/api/prompts/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPrompts(prev => prev.filter(p => p.id !== id));
    }, [getHeaders]);

    const togglePromptActive = useCallback(async (id: string): Promise<Prompt> => {
        // Find current status inside existing prompts to flip it? 
        // Or let API handle. But generic PATCH might need body.
        // Assuming the specific endpoint logic handles toggle if body is empty or specific action.
        // Looking at previous code, it was a PATCH. Let's assume endpoint toggles or we send { active: !current }.
        // Actually, the previous code just did empty PATCH.

        const res = await fetch(`/api/prompts/${id}`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPrompts(prev => prev.map(p => p.id === id ? data.prompt : p));
        return data.prompt;
    }, [getHeaders]);

    const getPromptsByIds = useCallback(async (ids: string[]): Promise<Prompt[]> => {
        if (ids.length === 0) return [];
        const localPrompts = prompts.filter(p => ids.includes(p.id));
        if (localPrompts.length === ids.length) return localPrompts;

        const res = await fetch(`/api/prompts?ids=${ids.join(',')}`, {
            headers: getHeaders()
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.prompts || [];
    }, [prompts, getHeaders]);

    useEffect(() => {
        if (autoFetch) fetchPrompts();
    }, [autoFetch, fetchPrompts]);

    return {
        prompts, loading, error,
        categories: PROMPT_CATEGORIES,
        fetchPrompts, searchPrompts, createPrompt,
        updatePrompt, deletePrompt, togglePromptActive, getPromptsByIds
    };
}
