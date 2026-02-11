// ============================================
// [F081] src/hooks/useAIKeys.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AIProviderName, AIApiKey, AIModel } from '@/lib/types';

interface StoredKey {
    id: string;
    provider_name: AIProviderName;
    is_valid: boolean;
    available_models: AIModel[];
    token_balance: string | null;
    last_validated_at: string | null;
}

export function useAIKeys() {
    const { user } = useAuth();
    const [keys, setKeys] = useState<StoredKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch keys on mount
    useEffect(() => {
        if (user) {
            fetchKeys();
        } else {
            setKeys([]);
            setLoading(false);
        }
    }, [user]);

    const fetchKeys = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const headers: HeadersInit = {};
            if (user.id.startsWith('dev-user-')) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/ai/keys', { headers });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setKeys(data.keys || []);
        } catch (err: any) {
            console.error('Failed to fetch keys:', err);
            // Don't set error state for fetch failures to avoid blocking UI, just log
            // setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addKey = useCallback(async (provider: AIProviderName, apiKey: string) => {
        if (!user) return;
        setError(null);

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (user.id.startsWith('dev-user-')) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/ai/keys', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    provider_name: provider,
                    api_key: apiKey
                })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            await fetchKeys();
            // Only return validation result
            return {
                valid: data.validation.valid,
                error: data.validation.error,
                models: data.validation.models
            };
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [user, fetchKeys]);

    const removeKey = useCallback(async (provider: AIProviderName) => {
        if (!user) return;
        try {
            const headers: HeadersInit = {};
            if (user.id.startsWith('dev-user-')) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch(`/api/ai/keys?provider=${provider}`, {
                method: 'DELETE',
                headers
            });

            if (!res.ok) {
                throw new Error('Failed to delete key');
            }

            await fetchKeys();
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        }
    }, [user, fetchKeys]);

    const validateKey = useCallback(async (provider: AIProviderName, apiKey: string) => {
        const res = await fetch('/api/ai/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider_name: provider,
                api_key: apiKey
            })
        });
        return res.json();
    }, []);

    const getModelsForProvider = useCallback((provider: AIProviderName): AIModel[] => {
        const key = keys.find(k => k.provider_name === provider);
        return key?.available_models || [];
    }, [keys]);

    const hasValidKey = useCallback((provider: AIProviderName): boolean => {
        const key = keys.find(k => k.provider_name === provider);
        return key?.is_valid || false;
    }, [keys]);

    const getValidProviders = useCallback((): AIProviderName[] => {
        return keys.filter(k => k.is_valid).map(k => k.provider_name);
    }, [keys]);

    return {
        keys,
        loading,
        error,
        fetchKeys,
        addKey,
        removeKey,
        validateKey,
        getModelsForProvider,
        hasValidKey,
        getValidProviders
    };
}
