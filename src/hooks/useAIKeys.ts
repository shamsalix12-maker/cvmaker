// ============================================
// [F081] src/hooks/useAIKeys.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AIProviderName, AIApiKey, AIModel } from '@/lib/types';
import { isDevUser } from '@/lib/auth/dev-auth';

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

        // DEV MODE: Load from localStorage
        if (isDevUser(user.id)) {
            try {
                const storedKeys = localStorage.getItem('ai_api_keys_dev');
                if (storedKeys) {
                    const keys = JSON.parse(storedKeys);
                    console.log('[useAIKeys] Dev Mode: Loaded keys from localStorage', keys.length);
                    setKeys(keys);
                } else {
                    setKeys([]);
                }
            } catch (e) {
                console.error('[useAIKeys] Failed to load local keys:', e);
                setKeys([]);
            }
            setLoading(false);
            return;
        }

        try {
            const headers: HeadersInit = {};
            if (isDevUser(user.id)) {
                headers['x-user-id'] = user.id;
            }

            const res = await fetch('/api/ai/keys', {
                headers,
                cache: 'no-store'
            });
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

        // DEV MODE: Save to localStorage instead of DB
        if (isDevUser(user.id)) {
            console.log('[useAIKeys] Dev Mode: Saving API key to localStorage');
            try {
                // Validate the key first
                const res = await fetch('/api/ai/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider_name: provider,
                        api_key: apiKey
                    })
                });
                const validation = await res.json();

                if (!validation.valid) {
                    throw new Error(validation.error || 'Invalid API key');
                }

                // Save to localStorage
                const storedKeys = localStorage.getItem('ai_api_keys_dev');
                let keys = storedKeys ? JSON.parse(storedKeys) : [];
                
                // Remove existing key for this provider
                keys = keys.filter((k: any) => k.provider_name !== provider);
                
                // Add new key
                keys.push({
                    id: `dev-key-${provider}`,
                    provider_name: provider,
                    api_key: apiKey,
                    is_valid: true,
                    available_models: validation.models || [],
                    token_balance: null,
                    last_validated_at: new Date().toISOString()
                });
                
                localStorage.setItem('ai_api_keys_dev', JSON.stringify(keys));
                
                await fetchKeys();
                
                return {
                    valid: true,
                    error: null,
                    models: validation.models
                };
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        }

        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };
            if (isDevUser(user.id)) {
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

        // DEV MODE: Remove from localStorage
        if (isDevUser(user.id)) {
            try {
                const storedKeys = localStorage.getItem('ai_api_keys_dev');
                if (storedKeys) {
                    let keys = JSON.parse(storedKeys);
                    keys = keys.filter((k: any) => k.provider_name !== provider);
                    localStorage.setItem('ai_api_keys_dev', JSON.stringify(keys));
                    setKeys(keys);
                    console.log('[useAIKeys] Dev Mode: Removed key from localStorage');
                }
            } catch (e) {
                console.error('[useAIKeys] Failed to remove local key:', e);
            }
            return;
        }

        try {
            const headers: HeadersInit = {};
            if (isDevUser(user.id)) {
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

    const validProviders = (keys || [])
        .filter(k => k.is_valid)
        .map(k => k.provider_name);

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
        validProviders
    };
}
