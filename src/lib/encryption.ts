// ============================================
// [F077] src/lib/encryption.ts
// ============================================

import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || 'default-dev-key-change-in-prod';

/**
 * Basic encryption
 */
export function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

/**
 * Basic decryption
 */
export function decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt API Key with validation
 */
export function encryptApiKey(apiKey: string): string {
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error('API key cannot be empty');
    }
    return encrypt(apiKey.trim());
}

/**
 * Decrypt API Key with validation
 */
export function decryptApiKey(encryptedKey: string): string {
    try {
        const decrypted = decrypt(encryptedKey);
        if (!decrypted) {
            throw new Error('Decryption failed');
        }
        return decrypted;
    } catch (error) {
        throw new Error('Failed to decrypt API key');
    }
}
