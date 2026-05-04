import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `Parse raw ingredient text into structured JSON. Return ONLY valid JSON:
{
  "ingredients": [
    {
      "name": string,
      "normalized_name": string,
      "quantity": number | null,
      "unit": string | null,
      "notes": string | null
    }
  ]
}

Rules:
- normalized_name should be lowercase singular (e.g. "tomato" not "Tomatoes").
- Convert fractions to decimals (1/2 → 0.5).
- Standardize units: tsp, tbsp, cup, oz, lb, g, kg, ml, l.
- Extract preparation notes like "diced", "sifted" into the notes field.
- Support Turkish and English ingredient names.
- Never include markdown outside the JSON.`;

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

  const body = await req.json();
  const { text } = body as { text: string };

  if (!text) {
    return new Response(JSON.stringify({ error: 'MISSING_TEXT' }), { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Parse these ingredients:\n\n${text}` }],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  let result: unknown;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return new Response(JSON.stringify({ error: 'PARSE_ERROR' }), { status: 500 });
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
