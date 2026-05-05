import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const CHEAP_MODEL = 'claude-haiku-4-5';
const STRONG_MODEL = 'claude-sonnet-4-6';

const FREE_WEEKLY_LIMIT = 5;
const PLUS_MONTHLY_LIMIT = 150;
const PRO_MONTHLY_LIMIT = 500;

const SYSTEM_PROMPT = `You are a recipe extraction specialist. Given any content (webpage text, social media post, screenshot text, or free-form text), extract a structured recipe and return ONLY valid JSON with this exact shape:

{
  "title": string,
  "description": string | null,
  "servings": number | null,
  "prep_time_minutes": number | null,
  "cook_time_minutes": number | null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "cuisine": string | null,
  "language": "en" | "tr" | null,
  "tags": string[],
  "dietary_info": string[],
  "ingredients": [
    {
      "name": string,
      "quantity": number | null,
      "unit": string | null,
      "notes": string | null
    }
  ],
  "steps": [
    {
      "instruction": string,
      "duration_minutes": number | null
    }
  ],
  "missing_info_warnings": string[]
}

Rules:
- If a field cannot be determined, use null.
- Mark estimated quantities with a warning in missing_info_warnings.
- Detect vague terms like "a little", "some", "as needed" and note them.
- Do not invent critical cooking steps. If unsure, add a warning.
- Normalize ingredient names (e.g. "all-purpose flour" not "AP flour").
- Support Turkish (tr) and English (en) — detect the recipe's language.
- Never include markdown, code fences, or explanation outside the JSON object.
- For food safety: if cooking times for meat/poultry seem unsafe, add a warning.`;

function isComplexContent(type: string, contentLength: number): boolean {
  return type === 'screenshot_base64' || type === 'url' || contentLength > 2000;
}

function calculateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  // Approximate pricing (update as Anthropic changes rates)
  const rates: Record<string, { input: number; output: number }> = {
    [CHEAP_MODEL]: { input: 0.00000025, output: 0.00000125 },
    [STRONG_MODEL]: { input: 0.000003, output: 0.000015 },
  };
  const r = rates[model] ?? rates[STRONG_MODEL];
  return inputTokens * r.input + outputTokens * r.output;
}

function getUsageLimit(subscriptionStatus: string): number {
  if (subscriptionStatus === 'pro') return PRO_MONTHLY_LIMIT;
  if (subscriptionStatus === 'plus') return PLUS_MONTHLY_LIMIT;
  return FREE_WEEKLY_LIMIT;
}

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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 });
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('subscription_status, monthly_ai_usage')
    .eq('id', user.id)
    .single();

  if (userError || !userRow) {
    return new Response(JSON.stringify({ error: 'USER_NOT_FOUND' }), { status: 404 });
  }

  const limit = getUsageLimit(userRow.subscription_status);
  if (userRow.monthly_ai_usage >= limit) {
    return new Response(
      JSON.stringify({ error: 'AI_LIMIT_REACHED', current: userRow.monthly_ai_usage, limit }),
      { status: 429 }
    );
  }

  const body = await req.json();
  const { content, type } = body as { content: string; type: string };

  if (!content || !type) {
    return new Response(JSON.stringify({ error: 'MISSING_CONTENT' }), { status: 400 });
  }

  const useStrongModel = isComplexContent(type, content.length);
  const model = useStrongModel ? STRONG_MODEL : CHEAP_MODEL;

  const messages: Anthropic.MessageParam[] =
    type === 'screenshot_base64'
      ? [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: content },
              },
              { type: 'text', text: 'Extract the recipe from this image.' },
            ],
          },
        ]
      : [
          {
            role: 'user',
            content: `Extract the recipe from the following ${type} content:\n\n${content}`,
          },
        ];

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

  let extracted: unknown;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    extracted = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return new Response(JSON.stringify({ error: 'PARSE_ERROR', raw: rawText }), { status: 500 });
  }

  const cost = calculateCostUsd(model, response.usage.input_tokens, response.usage.output_tokens);

  await Promise.all([
    supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      feature: 'extract-recipe',
      model,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_estimate: cost,
    }),
    supabase
      .from('users')
      .update({ monthly_ai_usage: userRow.monthly_ai_usage + 1 })
      .eq('id', user.id),
  ]);

  return new Response(JSON.stringify(extracted), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
});
