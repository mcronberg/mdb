import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No auth header')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not authenticated')

        const { query } = await req.json() as { query: string }
        if (!query?.trim()) throw new Error('Missing query')

        const openaiKey = Deno.env.get('OPENAI_API_KEY')?.trim()
        if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

        const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
            ?.trim()
            ?.replace(/^["']|["']$/g, '')   // strip accidental surrounding quotes
            ?.replace(/^Bearer\s+/i, '')    // strip accidental "Bearer " prefix
        if (!openrouterKey) throw new Error('OPENROUTER_API_KEY not configured')

        // Generate query embedding
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: query,
            }),
        })

        if (!embRes.ok) {
            const errText = await embRes.text()
            throw new Error(`OpenAI embedding error (${embRes.status}): ${errText}`)
        }

        const embData = await embRes.json()
        const queryEmbedding = embData.data[0].embedding

        // Similarity search across notes and diary (parallel)
        const [notesResult, diaryResult] = await Promise.all([
            supabase.rpc('match_notes', {
                query_embedding: queryEmbedding,
                match_user_id: user.id,
                match_threshold: 0.3,
                match_count: 5,
            }),
            supabase.rpc('match_diary', {
                query_embedding: queryEmbedding,
                match_user_id: user.id,
                match_threshold: 0.3,
                match_count: 5,
            }),
        ])

        const notes = (notesResult.data ?? []) as Array<{
            id: string; title: string; content: string; updated_at: string; similarity: number
        }>
        const diary = (diaryResult.data ?? []) as Array<{
            id: string; content: string; entry_date: string; mood: string | null; similarity: number
        }>

        // No relevant documents found
        if (notes.length === 0 && diary.length === 0) {
            return new Response(JSON.stringify({
                answer: 'Jeg fandt ingen relevante noter eller dagbogsindlæg til at besvare dit spørgsmål. Sørg for at dine noter er indlejret (klik "Klargør AI" på AI-siden).',
                sources: [],
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Build context string from results
        const contextParts: string[] = []

        for (const note of notes) {
            contextParts.push(`[Note: "${note.title}"]\n${note.content}`)
        }

        for (const entry of diary) {
            const moodStr = entry.mood ? ` (humør: ${entry.mood})` : ''
            contextParts.push(`[Dagbog ${entry.entry_date}${moodStr}]\n${entry.content}`)
        }

        const context = contextParts.join('\n\n---\n\n')
        const model = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini'

        // Call OpenRouter LLM
        const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://mcronberg.github.io/mdb/',
                'X-Title': 'MyDigitalBrain',
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `Du er en personlig AI-assistent der hjælper brugeren med at finde og forstå indhold fra deres personlige noter og dagbog. Svar altid på dansk. Svar KUN baseret på den givne kontekst — brug ikke ekstern viden. Hvis konteksten ikke er tilstrækkelig til at besvare spørgsmålet, sig det direkte.\n\nKontekst:\n${context}`,
                    },
                    {
                        role: 'user',
                        content: query,
                    },
                ],
                max_tokens: 1024,
            }),
        })

        if (!llmRes.ok) {
            const errText = await llmRes.text()
            throw new Error(`OpenRouter error (${llmRes.status}): ${errText}`)
        }

        const llmData = await llmRes.json()
        const answer = llmData.choices[0].message.content

        // Build sources list sorted by similarity
        const sources = [
            ...notes.map(n => ({ type: 'note' as const, id: n.id, title: n.title, similarity: n.similarity })),
            ...diary.map(d => ({ type: 'diary' as const, id: d.id, title: d.entry_date, similarity: d.similarity })),
        ].sort((a, b) => b.similarity - a.similarity)

        return new Response(JSON.stringify({ answer, sources }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
