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
    const { imageBase64, storeResult } = await req.json()

    if (!imageBase64) {
      throw new Error('No image data provided')
    }

    const endpoint = Deno.env.get('ROBOFLOW_ENDPOINT')
    const apiKey = Deno.env.get('ROBOFLOW_API_KEY')
    if (!endpoint || !apiKey) {
      throw new Error('ROBOFLOW_ENDPOINT or ROBOFLOW_API_KEY not configured')
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: apiKey,
        image: imageBase64,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Roboflow API error (${response.status}): ${errorText}`)
    }

    const result = await response.json()

    // Non-blocking storage — fire and forget, never blocks inference response
    if (storeResult) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        supabase.from('detected_leaves').insert({
          predictions: result.predictions,
          image_url: result.image?.signed_url,
          metadata: result,
        }).then(({ error }) => {
          if (error) console.error('Error storing scan result:', error)
        })

        const leafNames = result.predictions?.map((p: any) => p.class).join(', ')
        if (leafNames) {
          supabase.from('document_chunks').insert({
            source_type: 'scan',
            content: `Leaf scan detected: ${leafNames}. Confidence: ${result.predictions[0]?.confidence}`,
            metadata: result,
          }).then(({ error }) => {
            if (error) console.error('Error storing document chunk:', error)
          })
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
