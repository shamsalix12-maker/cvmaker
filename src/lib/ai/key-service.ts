import { createServerSupabaseClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/encryption';
import { AIProviderName } from '@/lib/types';

export class KeyService {
    /**
     * Get and decrypt an API key for a specific provider and user
     */
    static async getDecryptedKey(provider: AIProviderName, userId: string): Promise<string | null> {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('ai_api_keys')
            .select('api_key_encrypted')
            .eq('user_id', userId)
            .eq('provider_name', provider)
            .single();

        if (error || !data) return null;

        try {
            return decryptApiKey(data.api_key_encrypted);
        } catch (e) {
            console.error(`Failed to decrypt key for ${provider}:`, e);
            return null;
        }
    }

    /**
     * Get all decrypted keys for a user
     */
    static async getAllDecryptedKeys(userId: string): Promise<Record<AIProviderName, string>> {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
            .from('ai_api_keys')
            .select('provider_name, api_key_encrypted')
            .eq('user_id', userId);

        if (error || !data) return {} as Record<AIProviderName, string>;

        const keys: any = {};
        data.forEach((item: any) => {
            try {
                keys[item.provider_name] = decryptApiKey(item.api_key_encrypted);
            } catch (e) {
                console.error(`Failed to decrypt key for ${item.provider_name}:`, e);
            }
        });

        return keys;
    }
}
