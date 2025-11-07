import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { correctOCRErrors } from './ocr-correction.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
interface AnalysisRequest {
  image: string;
  type: 'front' | 'back' | 'nutrition';
}

const RATE_LIMIT_WINDOW_HOURS = 1;
const MAX_ANALYSES_PER_WINDOW = 20;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024 * 4/3; // base64 is ~33% larger

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. VERIFY AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated request from user: ${user.id}`);

    // 2. VALIDATE INPUT
    const body = await req.json() as AnalysisRequest;
    
    if (!body.image || typeof body.image !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: image must be a base64 string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.type || !['front', 'back', 'nutrition'].includes(body.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: type must be "front", "back", or "nutrition"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format and size
    const base64Pattern = /^data:image\/(png|jpeg|jpg|webp);base64,/;
    if (!base64Pattern.test(body.image)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image format. Must be base64 encoded image (PNG, JPEG, WEBP)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.image.length > MAX_IMAGE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. CHECK RATE LIMIT
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

    // Get current usage in the window
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('ai_analysis_rate_limit')
      .select('analysis_count')
      .eq('user_id', user.id)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (rateLimitError && rateLimitError.code !== 'PGRST116') {
      console.error('Rate limit check error:', rateLimitError);
      throw rateLimitError;
    }

    const currentCount = rateLimitData?.analysis_count || 0;

    if (currentCount >= MAX_ANALYSES_PER_WINDOW) {
      console.warn(`Rate limit exceeded for user ${user.id}: ${currentCount}/${MAX_ANALYSES_PER_WINDOW}`);
      return new Response(
        JSON.stringify({ 
          error: `Rate limit exceeded. Maximum ${MAX_ANALYSES_PER_WINDOW} analyses per hour. Please try again later.`,
          retryAfter: 3600 - Math.floor((Date.now() - new Date(windowStart).getTime()) / 1000)
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. UPDATE RATE LIMIT COUNTER
    if (rateLimitData) {
      await supabase
        .from('ai_analysis_rate_limit')
        .update({ analysis_count: currentCount + 1 })
        .eq('user_id', user.id)
        .gte('window_start', windowStart.toISOString());
    } else {
      await supabase
        .from('ai_analysis_rate_limit')
        .insert({ 
          user_id: user.id, 
          analysis_count: 1,
          window_start: new Date().toISOString()
        });
    }

    // Clean up old rate limit records
    await supabase.rpc('cleanup_rate_limits');

    // 5. PROCEED WITH AI ANALYSIS
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';
    if (body.type === 'front') {
      prompt = `Analiza esta imagen del frente de un producto alimenticio.
      Extrae SOLO el nombre del producto (no la marca, solo el nombre del producto).
      Si hay un nombre claro, devuélvelo. Si no hay nombre visible, devuelve "Producto sin nombre".
      Responde en formato JSON: { "product_name": "..." }`;
    } else if (body.type === 'back') {
      prompt = `Analiza esta imagen de ingredientes de un producto alimenticio.

Extrae ÚNICAMENTE:
1. "ingredients": lista completa de ingredientes exactamente como aparecen
2. "allergens": solo los alérgenos declarados explícitamente (ej: "Contiene: leche, soya")
3. "warnings": advertencias de contaminación cruzada (ej: "Puede contener trazas de...", "Elaborado en instalaciones que...", etc.)

IMPORTANTE: 
- NO confundas ingredientes con alérgenos
- Los alérgenos son sustancias específicas declaradas aparte de los ingredientes
- Las advertencias de trazas/contaminación van SIEMPRE en "warnings", NUNCA en "allergens"
- Si no encuentras algún campo, devuelve string vacío ""

Responde ÚNICAMENTE en formato JSON:
{
  "ingredients": "...",
  "allergens": "...",
  "warnings": "..."
}`;
    } else if (body.type === 'nutrition') {
      prompt = `Analiza esta tabla de información nutricional de un producto alimenticio.

CRÍTICO: Extrae ÚNICAMENTE los valores correspondientes a 100 gramos (o 100 ml si es líquido).

IMPORTANTE sobre energía:
- Si la tabla muestra kJ (kilojulios), usa ese valor
- Si solo muestra kcal (kilocalorías), conviértelo: kJ = kcal × 4.184
- Si muestra ambos, usa el valor en kJ

IMPORTANTE sobre sodio:
- Si la tabla muestra "sodio" (sodium), usa ese valor en mg
- Si solo muestra "sal" (salt), calcula: sodio (mg) = sal (g) × 400
- Si muestra ambos, usa el valor de sodio

Extrae los siguientes valores numéricos (solo números, sin unidades):

1. "energy_kj": Energía en kilojulios (kJ) por 100g
2. "proteins": Proteínas en gramos por 100g
3. "carbohydrates": Carbohidratos totales en gramos por 100g
4. "sugars": Azúcares en gramos por 100g
5. "fats": Grasas totales en gramos por 100g
6. "saturated_fats": Grasas saturadas en gramos por 100g
7. "fiber": Fibra alimentaria en gramos por 100g
8. "sodium": Sodio en miligramos (mg) por 100g
9. "salt": Sal en gramos por 100g (si está disponible)

Si algún valor NO está visible o es ilegible, devuelve 0 para ese campo.

VALIDACIÓN: Verifica que los valores sean razonables:
- Energía: típicamente entre 0-4000 kJ
- Macronutrientes: típicamente entre 0-100 g
- Sodio: típicamente entre 0-5000 mg
- Si un valor parece incorrecto (ej: 10000g de proteína), devuelve 0

Responde ÚNICAMENTE en formato JSON estricto:
{
  "energy_kj": 0,
  "proteins": 0,
  "carbohydrates": 0,
  "sugars": 0,
  "fats": 0,
  "saturated_fats": 0,
  "fiber": 0,
  "sodium": 0,
  "salt": 0
}`;
    }
    
    console.log(`Calling Lovable AI for user ${user.id}, type: ${body.type}, usage: ${currentCount + 1}/${MAX_ANALYSES_PER_WINDOW}`);
    
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
              { type: 'image_url', image_url: { url: body.image } }
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
    console.log('AI response received successfully');
    
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
    
    // Aplicar corrección OCR SOLO para análisis de ingredientes (back)
    if (body.type === 'back') {
      const originalIngredients = result.ingredients || '';
      const originalAllergens = result.allergens || '';
      
      result.ingredients = correctOCRErrors(originalIngredients, false);
      result.allergens = correctOCRErrors(originalAllergens, true);
      
      console.log('✅ OCR corrections applied:', {
        ingredientsChanged: originalIngredients !== result.ingredients,
        allergensChanged: originalAllergens !== result.allergens
      });
    }
    
    console.log(`Analysis complete for user ${user.id}, type: ${body.type}`);
    
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
