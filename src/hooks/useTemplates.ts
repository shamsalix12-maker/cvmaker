// ============================================
// [F150] src/hooks/useTemplates.ts
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Template, TemplateType, FileFormat } from '@/lib/types';

export function useTemplates(type?: TemplateType) {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const headers: HeadersInit = {};
            if (user.id.startsWith('dev-user-')) {
                headers['x-user-id'] = user.id;
            }

            const params = type ? `?type=${type}` : '';
            const res = await fetch(`/api/templates${params}`, { headers });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setTemplates(data.templates || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, type]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const createTemplate = useCallback(async (
        template: {
            template_name: string;
            template_type: TemplateType;
            file_format: FileFormat;
            file_content: string;
        }
    ): Promise<Template> => {
        if (!user) throw new Error('Not authenticated');

        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (user.id.startsWith('dev-user-')) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch('/api/templates', {
            method: 'POST',
            headers,
            body: JSON.stringify(template)
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setTemplates(prev => [data.template, ...prev]);
        return data.template;
    }, [user]);

    const deleteTemplate = useCallback(async (id: string) => {
        if (!user) throw new Error('Not authenticated');

        const headers: HeadersInit = {};
        if (user.id.startsWith('dev-user-')) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/templates/${id}`, {
            method: 'DELETE',
            headers
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setTemplates(prev => prev.filter(t => t.id !== id));
    }, [user]);

    return {
        templates,
        loading,
        error,
        fetchTemplates,
        createTemplate,
        deleteTemplate
    };
}
