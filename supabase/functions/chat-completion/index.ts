import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!openrouterKey) {
      throw new Error('OpenRouter API key not configured on server.')
    }

    const openrouterEndpoint = Deno.env.get('OPENROUTER_ENDPOINT')
      || 'https://openrouter.ai/api/v1/chat/completions'

    // Optionally enhance system message with RAG context
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (lastUserMsg && openaiKey) {
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: lastUserMsg }),
        })

        if (embRes.ok) {
          const embData = await embRes.json()
          const queryEmbedding = embData.data[0].embedding

          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )

          const { data: relevantDocs } = await supabase.rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.7,
            match_count: 5,
          })

          if (relevantDocs?.length) {
            const ragContext = relevantDocs.map((d: any) => d.content).join('\n\n')
            for (const msg of messages) {
              if (msg.role === 'system') {
                msg.content += `\n\nRelevant context:\n${ragContext}`
                break
              }
            }
          }
        }
      }
    } catch (_e) {
      console.error('RAG enhancement skipped (non-fatal):', _e)
    }

    const completionRes = await fetch(openrouterEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages,
      }),
    })

    const completionData = await completionRes.json()

    if (!completionRes.ok) {
      console.error('OpenRouter error:', completionRes.status, completionData)
      throw new Error(
        `OpenRouter returned ${completionRes.status}: ${completionData?.error?.message || completionData?.error || 'Unknown error'}`
      )
    }

    return new Response(JSON.stringify(completionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
