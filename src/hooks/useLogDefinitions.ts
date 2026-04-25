import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LogDefinition, LogDataType } from '@/types'

export function useLogDefinitions() {
    return useQuery({
        queryKey: ['log-definitions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('log_definitions')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true })
            if (error) throw error
            return data as LogDefinition[]
        },
    })
}

export function useCreateLogDefinition() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: { label: string; data_type: LogDataType; unit?: string }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { data, error } = await supabase
                .from('log_definitions')
                .insert({ user_id: user.id, label: input.label, data_type: input.data_type, unit: input.unit ?? null })
                .select()
                .single()
            if (error) throw error
            return data as LogDefinition
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['log-definitions'] }),
    })
}

export function useUpdateLogDefinition() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: { id: string; label: string; data_type: LogDataType; unit?: string }) => {
            const { error } = await supabase
                .from('log_definitions')
                .update({ label: input.label, data_type: input.data_type, unit: input.unit ?? null })
                .eq('id', input.id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['log-definitions'] }),
    })
}

export function useDeleteLogDefinition() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('log_definitions').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['log-definitions'] })
            qc.invalidateQueries({ queryKey: ['log-entries'] })
        },
    })
}
