
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the SafeLeafKitchen AI Assistant. 
Your goal is to help users identify safely edible plants using the context provided.
Answer ONLY based on the context. If the answer is not in the context, say you don't know.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1].content

    // 1. Generate Embedding
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: lastMessage
      })
    })

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // 2. Retrieve Relevant Context
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: relevantDocs, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 5
    })

    if (matchError) {
      console.error('Vector match error:', matchError)
      throw new Error('Failed to retrieve context')
    }

    // 3. Build RAG Context
    const ragContext = relevantDocs?.map((d: any) => d.content).join('\n\n') || "No relevant context found."

    // 4. Call LLM (OpenRouter)
    const completionResponse = await fetch(Deno.env.get('OPENROUTER_ENDPOINT')!, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: `Context:\n${ragContext}\n\n${SYSTEM_PROMPT}` },
          ...messages
        ]
      })
    })

    const completionData = await completionResponse.json()

    return new Response(JSON.stringify(completionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
