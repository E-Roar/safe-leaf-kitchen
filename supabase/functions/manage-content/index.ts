
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== 'hidachi') {
      throw new Error('Unauthorized: Invalid Admin Key')
    }

    const { table, action, data, id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'delete') {
      if (!id) throw new Error('ID required for delete')
      
      // 1. Delete from Primary Table
      const { error: dbError } = await supabase.from(table).delete().eq('id', id)
      if (dbError) throw dbError

      // 2. Delete from Vector Table
      await supabase.from('document_chunks')
        .delete()
        .filter('metadata->>origin_table', 'eq', table)
        .filter('metadata->>origin_id', 'eq', id)
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'upsert') {
      // 1. Upsert to Primary Table
      const { data: result, error: dbError } = await supabase
        .from(table)
        .upsert(data)
        .select()
        .single()
      
      if (dbError) throw dbError

      // 2. Generate RAG Text Representation
      let ragContent = ''
      if (table === 'leaves') {
        ragContent = `Leaf: ${result.name.en} / ${result.name.fr}. 
        Aliases: ${Array.isArray(result.aliases) ? result.aliases.join(', ') : ''}.
        Summary: ${result.summary}.
        Safety: ${result.safety}.
        Nutritional Highlights: ${JSON.stringify(result.highlights)}.
        Bioactive Compounds: ${Array.isArray(result.compounds) ? result.compounds.join(', ') : ''}.`
      } else if (table === 'recipes') {
        ragContent = `Recipe: ${result.title.en} / ${result.title.fr}.
        Ingredients: ${Array.isArray(result.ingredients?.en) ? result.ingredients.en.join(', ') : ''}.
        Steps: ${Array.isArray(result.steps?.en) ? result.steps.en.join(' ') : ''}.
        Nutrition: ${JSON.stringify(result.nutrition)}.`
      }

      // 3. Generate Embedding (if OpenAI Key exists)
      const openAiKey = Deno.env.get('OPENAI_API_KEY')
      if (openAiKey && ragContent) {
        try {
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: ragContent
            })
          })
          
          if (embeddingResponse.ok) {
            const embeddingData = await embeddingResponse.json()
            const embedding = embeddingData.data[0].embedding

            // 4. Update Vector Table
            // First try to find existing chunk for this item
            const { data: existingChunk } = await supabase
              .from('document_chunks')
              .select('id')
              .match({ 'metadata->>origin_table': table, 'metadata->>origin_id': result.id })
              .single()

            const chunkData = {
              source_type: 'database_record',
              content: ragContent,
              embedding: embedding,
              metadata: { origin_table: table, origin_id: result.id }
            }

            if (existingChunk) {
               await supabase.from('document_chunks').update(chunkData).eq('id', existingChunk.id)
            } else {
               await supabase.from('document_chunks').insert(chunkData)
            }
          }
        } catch (embedError) {
          console.error("Embedding failed (non-fatal):", embedError)
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
