
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      throw new Error('No image data provided')
    }

    // Call Roboflow API
    const response = await fetch(Deno.env.get('ROBOFLOW_ENDPOINT')!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: Deno.env.get('ROBOFLOW_API_KEY')!,
        image: imageBase64
      })
    })

    const result = await response.json()

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Store result and create RAG context
    // We don't await this to keep the response fast
    const { error } = await supabase.from('detected_leaves').insert({
      predictions: result.predictions,
      image_url: result.image?.signed_url, // Or upload to storage first if key needed
      metadata: result
    })

    if (error) {
      console.error('Error storing scan result:', error)
    }

    // Store as document chunk for RAG
    const leafNames = result.predictions.map((p: any) => p.class).join(', ')
    if (leafNames) {
      await supabase.from('document_chunks').insert({
        source_type: 'scan',
        content: `Leaf scan detected: ${leafNames}. Confidence: ${result.predictions[0]?.confidence}`,
        metadata: result
      })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
