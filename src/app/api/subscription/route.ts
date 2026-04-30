import { requireSession, ok, fail } from "@/lib/api-helpers";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const auth = await requireSession(["OWNER", "MANAGER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const db = createServerClient();

  const { data: plans } = await db
    .from("subscription_plans")
    .select("*")
    .eq("active", true)
    .order("price_monthly", { ascending: true });

  const { data: subscription } = await db
    .from("business_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plans) return fail("Failed to load plans", 500);

  return ok({ plans, current: subscription ?? null });
}
