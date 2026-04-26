import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { useVault } from '@/context/VaultContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'

export default function VaultUnlock() {
    const { unlock, lock } = useVault()
    const { user } = useAuth()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleUnlock(e: React.FormEvent) {
        e.preventDefault()
        if (!password || !user) return
        setLoading(true)
        setError('')
        try {
            const key = await unlock(password, user.id)

            // Validate against an existing note (if any) to catch wrong passwords
            const { data } = await supabase
                .from('secret_notes')
                .select('title_enc')
                .limit(1)
                .single()

            if (data?.title_enc) {
                try {
                    await decrypt(key, data.title_enc)
                } catch {
                    // Decryption failed — wrong password
                    lock()
                    setError('Forkert adgangskode')
                }
            }
        } catch (err: any) {
            // Don't show "no rows" as an error (PGRST116 = no rows found = first time user)
            if (!err?.code || err.code !== 'PGRST116') {
                lock()
                setError('Forkert adgangskode')
            }
        } finally {
            setLoading(false)
        }
    }

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

            <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
                {/* Hidden username field so password managers store vault credentials separately from the main login */}
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
                {error && (
                    <p className="text-red-400 text-xs">{error}</p>
                )}
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
