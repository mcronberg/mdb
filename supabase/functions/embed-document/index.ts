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

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Not authenticated')

        const { type, id, text } = await req.json() as {
            type: 'note' | 'diary'
            id: string
            text: string
        }

        if (!type || !id || !text?.trim()) {
            throw new Error('Missing required fields: type, id, text')
        }

        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

        // Generate embedding via OpenAI text-embedding-3-small
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text.slice(0, 8000), // stay within token limit
            }),
        })

        if (!embRes.ok) {
            const errText = await embRes.text()
            throw new Error(`OpenAI API error (${embRes.status}): ${errText}`)
        }

        const embData = await embRes.json()
        const embedding = embData.data[0].embedding as number[]

        // Update the record with the new embedding (RLS ensures user can only update own records)
        const table = type === 'note' ? 'notes' : 'diary_entries'
        const { error: updateError } = await supabase
            .from(table)
            .update({ embedding: JSON.stringify(embedding) })
            .eq('id', id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
