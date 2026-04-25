import { useMutation } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface RagSource {
    type: 'note' | 'diary'
    id: string
    title: string
    similarity: number
}

export interface ActionTaken {
    type: 'create_note' | 'update_note' | 'create_diary' | 'update_diary'
    id: string
    title: string
}

export interface RagResult {
    answer: string
    sources: RagSource[]
    actions_taken: ActionTaken[]
}

/** Fire-and-forget: embed a note or diary entry in the background */
export function embedDocument(type: 'note' | 'diary', id: string, text: string): void {
    if (!text.trim()) return
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        supabase.functions.invoke('embed-document', {
            body: { type, id, text },
        }).catch(() => { /* ignore background errors */ })
    })
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

/** Ask a question using RAG against the user's notes and diary */
export function useRagQuery() {
    return useMutation({
        mutationFn: async ({ query, history }: { query: string; history: ChatMessage[] }): Promise<RagResult> => {
            const { data, error } = await supabase.functions.invoke('rag-query', {
                body: { query, history },
            })
            if (error) {
                if (error instanceof FunctionsHttpError) {
                    const body = await error.context.json().catch(() => null)
                    throw new Error(body?.error ?? error.message)
                }
                throw error
            }
            if (data?.error) throw new Error(data.error)
            return data as RagResult
        },
    })
}

/** Re-embed all existing notes and diary entries (needed on first setup) */
export function useEmbedAll() {
    return useMutation({
        mutationFn: async (): Promise<{ count: number }> => {
            const [notesRes, diaryRes] = await Promise.all([
                supabase.from('notes').select('id, title, content'),
                supabase.from('diary_entries').select('id, content, entry_date'),
            ])

            const notes = notesRes.data ?? []
            const diary = diaryRes.data ?? []
            let count = 0

            for (const note of notes) {
                const text = `${note.title}\n\n${note.content}`.trim()
                if (!text) continue
                await supabase.functions.invoke('embed-document', {
                    body: { type: 'note', id: note.id, text },
                }).catch(() => { /* skip individual failures */ })
                count++
            }

            for (const entry of diary) {
                if (!entry.content?.trim()) continue
                await supabase.functions.invoke('embed-document', {
                    body: { type: 'diary', id: entry.id, text: entry.content },
                }).catch(() => { /* skip individual failures */ })
                count++
            }

            return { count }
        },
    })
}
