import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are a helpful cooking assistant. The user will provide a list of ingredients they have available. Suggest practical meal ideas using those ingredients.

Return ONLY valid JSON in this exact shape:
{
  "suggestions": [
    {
      "title": string,
      "description": string,
      "match_percentage": number,
      "available_ingredients": string[],
      "missing_ingredients": string[],
      "estimated_time_minutes": number | null,
      "difficulty": "easy" | "medium" | "hard",
      "cuisine": string | null,
      "is_ai_generated": true
    }
  ]
}

Rules:
- Suggest 4-6 realistic meal ideas.
- Prioritize recipes where the user has most ingredients (high match_percentage).
- match_percentage = (available / total required) * 100, rounded to nearest 5.
- Be practical — suggest real, commonly cooked dishes.
- Prefer simple recipes that can be made without many missing ingredients.
- Support Turkish and English ingredient names.
- Never include markdown or explanation outside the JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });

  const { data: userRow } = await supabase
    .from('users')
    .select('subscription_status, monthly_ai_usage')
    .eq('id', user.id)
    .single();

  // Pantry suggestions require at least Plus plan
  if (!userRow || userRow.subscription_status === 'free') {
    return new Response(JSON.stringify({ error: 'UPGRADE_REQUIRED' }), { status: 403 });
  }

  const body = await req.json();
  const { pantry_items, preferences } = body as {
    pantry_items: string[];
    preferences?: { cuisine?: string; max_time?: number; dietary?: string[] };
  };

  if (!pantry_items?.length) {
    return new Response(JSON.stringify({ error: 'NO_PANTRY_ITEMS' }), { status: 400 });
  }

  const preferencesText = preferences
    ? `\nPreferences: cuisine=${preferences.cuisine ?? 'any'}, max time=${preferences.max_time ?? 'any'} min, dietary=${(preferences.dietary ?? []).join(', ') || 'none'}`
    : '';

  const userMessage = `I have these ingredients: ${pantry_items.join(', ')}.${preferencesText}\n\nWhat can I cook?`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  let result: unknown;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return new Response(JSON.stringify({ error: 'PARSE_ERROR' }), { status: 500 });
  }

  const cost =
    response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015;

  await Promise.all([
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'suggest-recipes',
      model: MODEL,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_estimate: cost,
    }),
    supabase
      .from('users')
      .update({ monthly_ai_usage: (userRow.monthly_ai_usage ?? 0) + 1 })
      .eq('id', user.id),
  ]);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
