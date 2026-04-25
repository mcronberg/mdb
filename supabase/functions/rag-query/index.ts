import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const tools = [
    {
        type: 'function',
        function: {
            name: 'create_note',
            description: 'Opret en ny note med titel og indhold.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Titlen på noten' },
                    content: { type: 'string', description: 'Indholdet på noten (markdown)' },
                },
                required: ['title', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_note',
            description: 'Opdater en eksisterende note. Brug kun hvis brugeren eksplicit beder om at rette en specifik note og du kender note-id\'et fra konteksten.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'ID på noten der skal opdateres' },
                    title: { type: 'string', description: 'Ny titel' },
                    content: { type: 'string', description: 'Nyt indhold (markdown)' },
                },
                required: ['id', 'title', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_diary_entry',
            description: 'Opret et nyt dagbogsindlæg.',
            parameters: {
                type: 'object',
                properties: {
                    entry_date: { type: 'string', description: 'Dato i format YYYY-MM-DD' },
                    content: { type: 'string', description: 'Indholdet i dagbogsindlægget (markdown)' },
                    mood: { type: 'string', enum: ['great', 'good', 'neutral', 'bad', 'terrible'], description: 'Humør (valgfrit)' },
                },
                required: ['entry_date', 'content'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_diary_entry',
            description: 'Opdater et eksisterende dagbogsindlæg. Brug kun hvis brugeren eksplicit beder om det og du kender entry-id\'et fra konteksten.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'ID på dagbogsindlægget der skal opdateres' },
                    content: { type: 'string', description: 'Nyt indhold (markdown)' },
                    mood: { type: 'string', enum: ['great', 'good', 'neutral', 'bad', 'terrible'], description: 'Nyt humør (valgfrit)' },
                    entry_date: { type: 'string', description: 'Ny dato i format YYYY-MM-DD (valgfrit)' },
                },
                required: ['id', 'content'],
            },
        },
    },
]

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

        const { query, history = [] } = await req.json() as { query: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }
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

        // Build context string — always include IDs so LLM can reference them for updates
        const contextParts: string[] = []
        for (const note of notes) {
            contextParts.push(`[Note id="${note.id}" title="${note.title}"]\n${note.content}`)
        }
        for (const entry of diary) {
            const moodStr = entry.mood ? ` mood="${entry.mood}"` : ''
            contextParts.push(`[Dagbog id="${entry.id}" date="${entry.entry_date}"${moodStr}]\n${entry.content}`)
        }
        const context = contextParts.length > 0
            ? contextParts.join('\n\n---\n\n')
            : '(ingen relevante noter eller dagbogsindlæg fundet)'

        const today = new Date().toISOString().slice(0, 10)
        const model = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini'

        const systemPrompt = `Du er en personlig AI-assistent der hjælper brugeren med deres noter og dagbog. Svar altid på dansk. Dagens dato er ${today}.

Du kan både besvare spørgsmål OG skrive/redigere noter og dagbogsindlæg via de tilgængelige tools. Brug tools når brugeren beder om det — f.eks. "opret en note", "skriv i dagbogen", "opdater noten om X".

Ved opdatering: brug KUN id'er fra konteksten nedenfor. Find det relevante id baseret på titel/dato.
Ved oprettelse: brug altid indhold der præcist matcher hvad brugeren bad om.

Kontekst (brugerens eksisterende noter og dagbog):
${context}`

        // Keep at most 10 previous turns to avoid token bloat
        const recentHistory = history.slice(-10)

        const messages: object[] = [
            { role: 'system', content: systemPrompt },
            ...recentHistory.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: query },
        ]

        // First LLM call
        const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://mcronberg.github.io/mdb/',
                'X-Title': 'MyDigitalBrain',
            },
            body: JSON.stringify({ model, messages, tools, tool_choice: 'auto', max_tokens: 1024 }),
        })

        if (!llmRes.ok) {
            const errText = await llmRes.text()
            throw new Error(`OpenRouter error (${llmRes.status}): ${errText}`)
        }

        const llmData = await llmRes.json()
        const assistantMsg = llmData.choices[0].message

        // --- Execute tool calls if present ---
        type ActionTaken = { type: string; id: string; title: string; content: string }
        const actionsTaken: ActionTaken[] = []

        if (assistantMsg.tool_calls?.length > 0) {
            messages.push(assistantMsg)

            for (const tc of assistantMsg.tool_calls) {
                const args = JSON.parse(tc.function.arguments)
                let toolResult = ''

                if (tc.function.name === 'create_note') {
                    const { data: { user: u } } = await supabase.auth.getUser()
                    const { data, error } = await supabase
                        .from('notes')
                        .insert({ title: args.title, content: args.content, user_id: u!.id })
                        .select('id, title')
                        .single()
                    if (error) { toolResult = `Fejl: ${error.message}` }
                    else {
                        actionsTaken.push({ type: 'create_note', id: data.id, title: data.title, content: args.content })
                        toolResult = `Note oprettet med id=${data.id}`
                    }
                } else if (tc.function.name === 'update_note') {
                    const { error } = await supabase
                        .from('notes')
                        .update({ title: args.title, content: args.content, updated_at: new Date().toISOString() })
                        .eq('id', args.id)
                        .eq('user_id', user.id)
                    if (error) { toolResult = `Fejl: ${error.message}` }
                    else {
                        actionsTaken.push({ type: 'update_note', id: args.id, title: args.title, content: args.content })
                        toolResult = `Note opdateret`
                    }
                } else if (tc.function.name === 'create_diary_entry') {
                    const { data: { user: u } } = await supabase.auth.getUser()
                    const { data, error } = await supabase
                        .from('diary_entries')
                        .insert({ entry_date: args.entry_date, content: args.content, mood: args.mood ?? null, user_id: u!.id })
                        .select('id, entry_date')
                        .single()
                    if (error) { toolResult = `Fejl: ${error.message}` }
                    else {
                        actionsTaken.push({ type: 'create_diary', id: data.id, title: data.entry_date, content: args.content })
                        toolResult = `Dagbogsindlæg oprettet med id=${data.id}`
                    }
                } else if (tc.function.name === 'update_diary_entry') {
                    const updateFields: Record<string, unknown> = {
                        content: args.content,
                        updated_at: new Date().toISOString(),
                    }
                    if (args.mood !== undefined) updateFields.mood = args.mood
                    if (args.entry_date !== undefined) updateFields.entry_date = args.entry_date
                    const { error } = await supabase
                        .from('diary_entries')
                        .update(updateFields)
                        .eq('id', args.id)
                        .eq('user_id', user.id)
                    if (error) { toolResult = `Fejl: ${error.message}` }
                    else {
                        actionsTaken.push({ type: 'update_diary', id: args.id, title: args.entry_date ?? args.id, content: args.content })
                        toolResult = `Dagbogsindlæg opdateret`
                    }
                }

                messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResult })
            }

            // Second LLM call to get confirmation answer
            const llmRes2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openrouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://mcronberg.github.io/mdb/',
                    'X-Title': 'MyDigitalBrain',
                },
                body: JSON.stringify({ model, messages, max_tokens: 512 }),
            })
            if (!llmRes2.ok) {
                const errText = await llmRes2.text()
                throw new Error(`OpenRouter error round 2 (${llmRes2.status}): ${errText}`)
            }
            const llmData2 = await llmRes2.json()
            const answer = llmData2.choices[0].message.content

            // Trigger re-embedding for written documents (use full title+content)
            for (const action of actionsTaken) {
                if (action.type === 'create_note' || action.type === 'update_note') {
                    const embedText = `${action.title}\n\n${action.content}`.trim()
                    await supabase.functions.invoke('embed-document', {
                        body: { type: 'note', id: action.id, text: embedText },
                    }).catch(() => { /* ignore */ })
                } else if (action.type === 'create_diary' || action.type === 'update_diary') {
                    await supabase.functions.invoke('embed-document', {
                        body: { type: 'diary', id: action.id, text: action.content || action.title },
                    }).catch(() => { /* ignore */ })
                }
            }

            const sources = [
                ...notes.map(n => ({ type: 'note' as const, id: n.id, title: n.title, similarity: n.similarity })),
                ...diary.map(d => ({ type: 'diary' as const, id: d.id, title: d.entry_date, similarity: d.similarity })),
            ].sort((a, b) => b.similarity - a.similarity)

            return new Response(JSON.stringify({ answer, sources, actions_taken: actionsTaken }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // No tool calls — plain answer
        const answer = assistantMsg.content

        const sources = [
            ...notes.map(n => ({ type: 'note' as const, id: n.id, title: n.title, similarity: n.similarity })),
            ...diary.map(d => ({ type: 'diary' as const, id: d.id, title: d.entry_date, similarity: d.similarity })),
        ].sort((a, b) => b.similarity - a.similarity)

        return new Response(JSON.stringify({ answer, sources, actions_taken: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})

