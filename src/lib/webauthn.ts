// WebAuthn + PRF extension for biometric vault unlock.
// The PRF extension produces a deterministic secret from the authenticator
// (Secure Enclave / TPM) which is used as a wrapping key to encrypt the
// vault password in localStorage. The vault password itself never changes;
// only the ability to retrieve it without typing it is added here.

const CRED_ID_KEY = 'mdb_vault_cred_id'
const ENCRYPTED_PW_KEY = 'mdb_vault_encrypted'

// Fixed PRF eval input — consistent across register/authenticate calls.
const PRF_INPUT = new TextEncoder().encode('mdb-vault-v1')

function b64encode(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    return btoa(String.fromCharCode(...bytes))
}

function b64decode(str: string): Uint8Array {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

/** Returns true if a biometric credential has been saved on this device/browser. */
export function hasSavedCredential(): boolean {
    return !!localStorage.getItem(CRED_ID_KEY) && !!localStorage.getItem(ENCRYPTED_PW_KEY)
}

/** Remove the saved credential (e.g. when user wants to reset or use password instead). */
export function clearSavedCredential(): void {
    localStorage.removeItem(CRED_ID_KEY)
    localStorage.removeItem(ENCRYPTED_PW_KEY)
}

/** Derive an AES-256-GCM wrapping key from the PRF output via HKDF. */
async function deriveWrapKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
    const base = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey'])
    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(32),
            info: new TextEncoder().encode('mdb-vault-wrap-key-v1'),
        },
        base,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    )
}

async function encryptWithWrapKey(wrapKey: CryptoKey, plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        wrapKey,
        new TextEncoder().encode(plaintext),
    )
    return JSON.stringify({ iv: b64encode(iv), data: b64encode(ciphertext) })
}

async function decryptWithWrapKey(wrapKey: CryptoKey, payload: string): Promise<string> {
    const { iv, data } = JSON.parse(payload) as { iv: string; data: string }
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64decode(iv) },
        wrapKey,
        b64decode(data),
    )
    return new TextDecoder().decode(plaintext)
}

/**
 * Register a platform authenticator credential with the PRF extension.
 * On success, the vault password is stored encrypted in localStorage.
 * Throws if PRF is not supported by the browser/authenticator.
 */
export async function registerBiometric(
    vaultPassword: string,
    userId: string,
    userEmail: string,
): Promise<void> {
    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const credential = (await navigator.credentials.create({
        publicKey: {
            challenge,
            rp: { name: 'MyDigitalBrain', id: window.location.hostname },
            user: {
                id: new TextEncoder().encode(userId),
                name: userEmail,
                displayName: userEmail,
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },   // ES256
                { type: 'public-key', alg: -257 },  // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                residentKey: 'required',
            },
            extensions: {
                prf: { eval: { first: PRF_INPUT } },
            } as any,
        },
    })) as PublicKeyCredential | null

    if (!credential) throw new Error('Registrering annulleret')

    const prfResult = (credential.getClientExtensionResults() as any).prf?.results?.first as
        | ArrayBuffer
        | undefined
    if (!prfResult) {
        throw new Error(
            'Din browser eller enhed understøtter ikke PRF-udvidelsen til WebAuthn. ' +
            'Prøv Chrome 116+ eller Edge 116+.',
        )
    }

    const wrapKey = await deriveWrapKey(prfResult)
    const encrypted = await encryptWithWrapKey(wrapKey, vaultPassword)

    localStorage.setItem(CRED_ID_KEY, b64encode(credential.rawId))
    localStorage.setItem(ENCRYPTED_PW_KEY, encrypted)
}

/**
 * Authenticate with the saved credential and return the decrypted vault password.
 * Throws if authentication is cancelled or the credential is invalid.
 */
export async function authenticateWithBiometric(): Promise<string> {
    const credIdStr = localStorage.getItem(CRED_ID_KEY)
    const encryptedPw = localStorage.getItem(ENCRYPTED_PW_KEY)
    if (!credIdStr || !encryptedPw) throw new Error('Ingen gemt credential på denne enhed')

    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const credential = (await navigator.credentials.get({
        publicKey: {
            challenge,
            allowCredentials: [{ type: 'public-key', id: b64decode(credIdStr) }],
            userVerification: 'required',
            extensions: {
                prf: { eval: { first: PRF_INPUT } },
            } as any,
        },
    })) as PublicKeyCredential | null

    if (!credential) throw new Error('Biometrisk godkendelse annulleret')

    const prfResult = (credential.getClientExtensionResults() as any).prf?.results?.first as
        | ArrayBuffer
        | undefined
    if (!prfResult) throw new Error('PRF-output mangler fra authenticator')

    const wrapKey = await deriveWrapKey(prfResult)
    return decryptWithWrapKey(wrapKey, encryptedPw)
}
