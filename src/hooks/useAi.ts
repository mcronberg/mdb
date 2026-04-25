import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface RagSource {
    type: 'note' | 'diary'
    id: string
    title: string
    similarity: number
}

export interface RagResult {
    answer: string
    sources: RagSource[]
}

async function getAuthHeader(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')
    return `Bearer ${session.access_token}`
}

/** Fire-and-forget: embed a note or diary entry in the background */
export function embedDocument(type: 'note' | 'diary', id: string, text: string): void {
    if (!text.trim()) return
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        supabase.functions.invoke('embed-document', {
            body: { type, id, text },
            headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => { /* ignore background errors */ })
    })
}

/** Ask a question using RAG against the user's notes and diary */
export function useRagQuery() {
    return useMutation({
        mutationFn: async (query: string): Promise<RagResult> => {
            const authHeader = await getAuthHeader()
            const { data, error } = await supabase.functions.invoke('rag-query', {
                body: { query },
                headers: { Authorization: authHeader },
            })
            if (error) throw error
            if (data?.error) throw new Error(data.error)
            return data as RagResult
        },
    })
}

/** Re-embed all existing notes and diary entries (needed on first setup) */
export function useEmbedAll() {
    return useMutation({
        mutationFn: async (): Promise<{ count: number }> => {
            const authHeader = await getAuthHeader()

            const [notesRes, diaryRes] = await Promise.all([
                supabase.from('notes').select('id, title, content'),
                supabase.from('diary_entries').select('id, content, entry_date'),
            ])

            const notes = notesRes.data ?? []
            const diary = diaryRes.data ?? []
            let count = 0

            // Embed notes sequentially to avoid rate limits
            for (const note of notes) {
                const text = `${note.title}\n\n${note.content}`.trim()
                if (!text) continue
                await supabase.functions.invoke('embed-document', {
                    body: { type: 'note', id: note.id, text },
                    headers: { Authorization: authHeader },
                }).catch(() => { /* skip individual failures */ })
                count++
            }

            // Embed diary entries
            for (const entry of diary) {
                if (!entry.content?.trim()) continue
                await supabase.functions.invoke('embed-document', {
                    body: { type: 'diary', id: entry.id, text: entry.content },
                    headers: { Authorization: authHeader },
                }).catch(() => { /* skip individual failures */ })
                count++
            }

            return { count }
        },
    })
}
