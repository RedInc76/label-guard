import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    if (type === 'front') {
      prompt = `Analiza esta imagen del frente de un producto alimenticio.
      Extrae SOLO el nombre del producto (no la marca, solo el nombre del producto).
      Si hay un nombre claro, devuélvelo. Si no hay nombre visible, devuelve "Producto sin nombre".
      Responde en formato JSON: { "product_name": "..." }`;
    } else {
      prompt = `Analiza la tabla de ingredientes y alérgenos de este producto alimenticio.
      Extrae:
      1. Lista completa de ingredientes (en texto, tal como aparece)
      2. Alérgenos declarados (busca en "Contiene:", "Alérgenos:", etc.)
      3. Advertencias de trazas (busca "Puede contener trazas de...", "Fabricado en instalaciones que...", etc.)
      
      Responde en formato JSON estricto:
      {
        "ingredients": "lista completa de ingredientes o vacío si no hay",
        "allergens": "lista de alérgenos declarados o vacío si no hay",
        "warnings": "advertencias de trazas o vacío si no hay"
      }`;
    }
    
    console.log('Calling Lovable AI with type:', type);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('AI response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }
    
    // Extract JSON from the content (it might be wrapped in markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const result = JSON.parse(jsonStr);
    console.log('Analysis complete:', type);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in analyze-product-photo:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze image', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
