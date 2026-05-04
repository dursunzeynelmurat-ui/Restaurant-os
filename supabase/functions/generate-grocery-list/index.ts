import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are a grocery list organizer. Given a list of recipe ingredients and optionally items already in the user's pantry, generate a clean, de-duplicated shopping list grouped by store category.

Return ONLY valid JSON:
{
  "items": [
    {
      "name": string,
      "quantity": number | null,
      "unit": string | null,
      "category": "produce" | "meat" | "dairy" | "bakery" | "dry_goods" | "spices" | "frozen" | "beverages" | "other",
      "notes": string | null
    }
  ]
}

Rules:
- Merge duplicate ingredients (e.g., "2 cups flour" + "1 cup flour" = "3 cups flour").
- Exclude items already in the pantry.
- Group by the most logical supermarket category.
- Use simple, recognizable item names.
- Support Turkish ingredient names.
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

  const body = await req.json();
  const { recipe_ingredients, pantry_items } = body as {
    recipe_ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
    pantry_items?: string[];
  };

  if (!recipe_ingredients?.length) {
    return new Response(JSON.stringify({ error: 'NO_INGREDIENTS' }), { status: 400 });
  }

  const ingredientLines = recipe_ingredients
    .map((i) => `${i.quantity ?? ''} ${i.unit ?? ''} ${i.name}`.trim())
    .join('\n');

  const pantryText = pantry_items?.length
    ? `\nItems already in pantry (exclude from list): ${pantry_items.join(', ')}`
    : '';

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Recipe ingredients:\n${ingredientLines}${pantryText}\n\nGenerate my grocery list.`,
      },
    ],
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
