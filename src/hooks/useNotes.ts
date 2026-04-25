import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'

export function useNotes() {
    return useQuery({
        queryKey: ['notes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .order('updated_at', { ascending: false })
            if (error) throw error
            return data as Note[]
        },
    })
}

export function useCreateNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data, error } = await supabase
                .from('notes')
                .insert({ title: 'Ny note', content: '', user_id: user.id })
                .select()
                .single()
            if (error) throw error
            return data as Note
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
    })
}

export function useUpdateNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
            const { error } = await supabase
                .from('notes')
                .update({ title, content, updated_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
    })
}

export function useDeleteNote() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('notes').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
    })
}
