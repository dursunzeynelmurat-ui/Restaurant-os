import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are a culinary expert. Given an ingredient from a recipe, suggest 2-3 practical substitutes a home cook might already have. Return ONLY valid JSON:

{
  "substitutes": [
    {
      "ingredient": string,
      "quantity": string,
      "notes": string
    }
  ]
}

Keep "notes" brief (1 sentence max). If there are truly no good substitutes, return an empty array.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { ingredient_name, quantity, unit, recipe_title } = await req.json();
    if (!ingredient_name) return new Response(JSON.stringify({ error: 'ingredient_name required' }), { status: 400 });

    const userMsg = [
      `Recipe: ${recipe_title ?? 'unknown'}`,
      `Ingredient: ${quantity ? `${quantity} ${unit ?? ''} `.trim() + ' ' : ''}${ingredient_name}`,
    ].join('\n');

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = JSON.parse(text.trim());

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
