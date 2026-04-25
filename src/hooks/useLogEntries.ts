import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LogEntry } from '@/types'

export function useLogEntries(definitionId: string) {
    return useQuery({
        queryKey: ['log-entries', definitionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('log_entries')
                .select('*')
                .eq('definition_id', definitionId)
                .order('logged_at', { ascending: false })
            if (error) throw error
            return data as LogEntry[]
        },
        enabled: !!definitionId,
    })
}

export function useCreateLogEntry() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: {
            definition_id: string
            value_int?: number | null
            value_decimal?: number | null
            value_bool?: boolean | null
            value_text?: string | null
            note?: string | null
            logged_at?: string
        }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data, error } = await supabase
                .from('log_entries')
                .insert({
                    user_id: user.id,
                    definition_id: input.definition_id,
                    logged_at: input.logged_at ?? new Date().toISOString(),
                    value_int: input.value_int ?? null,
                    value_decimal: input.value_decimal ?? null,
                    value_bool: input.value_bool ?? null,
                    value_text: input.value_text ?? null,
                    note: input.note ?? null,
                })
                .select()
                .single()
            if (error) throw error
            return data as LogEntry
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['log-entries', variables.definition_id] })
        },
    })
}

export function useDeleteLogEntry() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, definitionId }: { id: string; definitionId: string }) => {
            const { error } = await supabase.from('log_entries').delete().eq('id', id)
            if (error) throw error
            return definitionId
        },
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['log-entries', variables.definitionId] })
        },
    })
}
