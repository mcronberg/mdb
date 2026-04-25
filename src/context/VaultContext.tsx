import { createContext, useContext, useState } from 'react'
import { deriveKey } from '@/lib/crypto'

interface VaultContextValue {
    key: CryptoKey | null
    isUnlocked: boolean
    unlock: (password: string, userId: string) => Promise<CryptoKey>
    lock: () => void
}

const VaultContext = createContext<VaultContextValue | null>(null)

export function VaultProvider({ children }: { children: React.ReactNode }) {
    const [key, setKey] = useState<CryptoKey | null>(null)

    async function unlock(password: string, userId: string): Promise<CryptoKey> {
        const derived = await deriveKey(password, userId)
        setKey(derived)
        return derived
    }

    function lock() {
        setKey(null)
    }

    return (
        <VaultContext.Provider value={{ key, isUnlocked: key !== null, unlock, lock }}>
            {children}
        </VaultContext.Provider>
    )
}

export function useVault() {
    const ctx = useContext(VaultContext)
    if (!ctx) throw new Error('useVault must be used within VaultProvider')
    return ctx
}
