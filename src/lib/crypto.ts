// Client-side AES-GCM encryption using Web Crypto API.
// Key is derived from vault password + user ID via PBKDF2.
// Nothing here is ever sent to the server.

const PBKDF2_ITERATIONS = 100_000

function b64encode(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function b64decode(str: string): Uint8Array {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

export async function deriveKey(password: string, userId: string): Promise<CryptoKey> {
    const enc = new TextEncoder()
    const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode(userId),
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    )
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(plaintext),
    )
    return JSON.stringify({ iv: b64encode(iv), data: b64encode(ciphertext) })
}

export async function decrypt(key: CryptoKey, payload: string): Promise<string> {
    const { iv, data } = JSON.parse(payload) as { iv: string; data: string }
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64decode(iv) },
        key,
        b64decode(data),
    )
    return new TextDecoder().decode(plaintext)
}
