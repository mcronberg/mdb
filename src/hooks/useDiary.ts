import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/types'
import { format } from 'date-fns'

export function useDiary() {
    return useQuery({
        queryKey: ['diary'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('diary_entries')
                .select('*')
                .order('entry_date', { ascending: false })
            if (error) throw error
            return data as DiaryEntry[]
        },
    })
}

export function useCreateDiaryEntry() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data, error } = await supabase
                .from('diary_entries')
                .insert({
                    user_id: user.id,
                    content: '',
                    mood: null,
                    entry_date: format(new Date(), 'yyyy-MM-dd'),
                })
                .select()
                .single()
            if (error) throw error
            return data as DiaryEntry
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
    })
}

export function useUpdateDiaryEntry() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            id,
            content,
            mood,
            entry_date,
        }: {
            id: string
            content: string
            mood: DiaryEntry['mood']
            entry_date: string
        }) => {
            const { error } = await supabase
                .from('diary_entries')
                .update({ content, mood, entry_date, updated_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
    })
}

export function useDeleteDiaryEntry() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('diary_entries').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['diary'] }),
    })
}
