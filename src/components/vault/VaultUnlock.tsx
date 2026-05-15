import { useState, useEffect } from 'react'
import { Lock, Loader2, Fingerprint } from 'lucide-react'
import { useVault } from '@/context/VaultContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { deriveKey, decrypt } from '@/lib/crypto'
import {
    hasSavedCredential,
    clearSavedCredential,
    registerBiometric,
    authenticateWithBiometric,
} from '@/lib/webauthn'

// Step flow:
//   'biometric'   — credential saved, try biometric first
//   'password'    — standard password form
//   'offer_bio'   — password was valid, offer to save on device
type Step = 'biometric' | 'password' | 'offer_bio'

export default function VaultUnlock() {
    const { unlock, lock } = useVault()
    const { user } = useAuth()

    const [step, setStep] = useState<Step>(() =>
        hasSavedCredential() ? 'biometric' : 'password',
    )
    const [password, setPassword] = useState('')
    const [validatedPassword, setValidatedPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Auto-trigger biometric on mount when a credential exists
    useEffect(() => {
        if (step === 'biometric') {
            handleBiometric()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /** Validate the password WITHOUT touching VaultContext state. */
    async function validatePassword(pw: string): Promise<boolean> {
        if (!user) return false
        // Derive key locally — do NOT call unlock() yet (would trigger re-render)
        const key = await deriveKey(pw, user.id)
        const { data, error } = await supabase
            .from('secret_notes')
            .select('title_enc')
            .limit(1)
            .single()
        // PGRST116 = no rows → first-time user, any password is valid
        if (error && error.code !== 'PGRST116') {
            setError('Forkert adgangskode')
            return false
        }
        if (data?.title_enc) {
            try {
                await decrypt(key, data.title_enc)
            } catch {
                setError('Forkert adgangskode')
                return false
            }
        }
        return true
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!password || !user) return
        setLoading(true)
        setError('')
        try {
            const ok = await validatePassword(password)
            if (ok) {
                setValidatedPassword(password)
                setStep('offer_bio')
            }
        } catch {
            setError('Noget gik galt — prøv igen')
        } finally {
            setLoading(false)
        }
    }

    async function handleBiometric() {
        setLoading(true)
        setError('')
        try {
            const pw = await authenticateWithBiometric()
            const ok = await validatePassword(pw)
            if (ok) await unlock(pw, user!.id)
        } catch (err: any) {
            clearSavedCredential()
            setStep('password')
            setError('Biometrisk godkendelse fejlede — brug adgangskode')
        } finally {
            setLoading(false)
        }
    }

    async function handleRegisterBiometric() {
        if (!user) return
        setLoading(true)
        setError('')
        try {
            await registerBiometric(validatedPassword, user.id, user.email ?? user.id)
            // Now actually unlock
            await unlock(validatedPassword, user.id)
        } catch (err: any) {
            setError(err?.message ?? 'Biometrisk opsætning fejlede')
            setLoading(false)
        }
        // If unlock succeeds, SecretNotesPage will unmount this component
    }

    async function handleSkipBiometric() {
        await unlock(validatedPassword, user!.id)
    }

    // ── Biometric screen ────────────────────────────────────────────────────
    if (step === 'biometric') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-sm mx-auto">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <Fingerprint size={22} className="text-indigo-400" />
                    </div>
                    <h2 className="text-white font-semibold">Hemmelige noter</h2>
                    <p className="text-slate-500 text-sm">
                        Godkend med fingeraftryk eller ansigt for at låse op.
                    </p>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <button
                    onClick={handleBiometric}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
                    Lås op med biometri
                </button>

                <button
                    onClick={() => { clearSavedCredential(); setStep('password') }}
                    className="text-slate-500 text-xs hover:text-slate-300 transition-colors"
                >
                    Brug adgangskode i stedet
                </button>
            </div>
        )
    }

    // ── Offer biometric setup after password unlock ─────────────────────────
    if (step === 'offer_bio') {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-sm mx-auto">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <Fingerprint size={22} className="text-indigo-400" />
                    </div>
                    <h2 className="text-white font-semibold">Gem på denne enhed?</h2>
                    <p className="text-slate-500 text-sm">
                        Næste gang kan du låse op med fingeraftryk eller ansigt
                        i stedet for adgangskode.
                    </p>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <div className="w-full flex flex-col gap-2">
                    <button
                        onClick={handleRegisterBiometric}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Fingerprint size={14} />}
                        Ja, brug biometri
                    </button>
                    <button
                        onClick={handleSkipBiometric}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-200 rounded-lg py-2 text-sm transition-colors"
                    >
                        Nej tak, kun denne gang
                    </button>
                </div>
            </div>
        )
    }

    // ── Password form ───────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 max-w-sm mx-auto">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <Lock size={22} className="text-indigo-400" />
                </div>
                <h2 className="text-white font-semibold">Hemmelige noter</h2>
                <p className="text-slate-500 text-sm">
                    Indtast din vault-adgangskode for at låse op.<br />
                    Nøglen gemmes kun i hukommelsen.
                </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col gap-3">
                {/* Hidden username field so password managers keep vault creds separate */}
                <input type="text" name="username" autoComplete="username" value={`hemmeligt:${user?.email ?? ''}`} readOnly className="hidden" aria-hidden="true" />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Vault-adgangskode"
                    autoComplete="current-password"
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                    type="submit"
                    disabled={!password || loading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    Lås op
                </button>
            </form>

            <p className="text-slate-600 text-xs text-center">
                Første gang? Vælg en adgangskode — den bruges til at kryptere dine noter.<br />
                Husk den godt, den kan ikke nulstilles.
            </p>
        </div>
    )
}
