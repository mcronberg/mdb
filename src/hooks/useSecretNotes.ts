import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/crypto'
import type { SecretNote } from '@/types'

interface RawRow {
    id: string
    user_id: string
    title_enc: string
    content_enc: string
    created_at: string
    updated_at: string
}

async function decryptRow(row: RawRow, key: CryptoKey): Promise<SecretNote> {
    const [title, content] = await Promise.all([
        decrypt(key, row.title_enc),
        decrypt(key, row.content_enc),
    ])
    return { id: row.id, user_id: row.user_id, title, content, created_at: row.created_at, updated_at: row.updated_at }
}

export function useSecretNotes(key: CryptoKey | null) {
    return useQuery({
        queryKey: ['secret-notes'],
        enabled: !!key,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('secret_notes')
                .select('*')
                .order('updated_at', { ascending: false })
            if (error) throw error
            return Promise.all((data as RawRow[]).map(row => decryptRow(row, key!)))
        },
    })
}

export function useCreateSecretNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ key }: { key: CryptoKey }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const [title_enc, content_enc] = await Promise.all([
                encrypt(key, 'Ny hemmelig note'),
                encrypt(key, ''),
            ])
            const { data, error } = await supabase
                .from('secret_notes')
                .insert({ user_id: user.id, title_enc, content_enc })
                .select()
                .single()
            if (error) throw error
            const row = data as RawRow
            return decryptRow(row, key)
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['secret-notes'] }),
    })
}

export function useUpdateSecretNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, title, content, key }: { id: string; title: string; content: string; key: CryptoKey }) => {
            const [title_enc, content_enc] = await Promise.all([
                encrypt(key, title),
                encrypt(key, content),
            ])
            const { error } = await supabase
                .from('secret_notes')
                .update({ title_enc, content_enc, updated_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['secret-notes'] }),
    })
}

export function useDeleteSecretNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('secret_notes').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['secret-notes'] }),
    })
}
