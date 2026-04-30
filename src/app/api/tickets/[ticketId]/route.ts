import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { checkAndAggregateTicket } from "@/lib/ticket-router";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const auth = await requireSession(["KITCHEN", "BAR", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const db = createServerClient();
  const now = new Date().toISOString();

  // Bump all — mark every PENDING/IN_PROGRESS item as DONE in one action
  if (body.action === "bump_all") {
    const { data: items } = await db
      .from("ticket_items")
      .select("id")
      .eq("ticket_id", params.ticketId)
      .in("status", ["PENDING", "IN_PROGRESS"]);

    if (!items?.length) return fail("No active items to bump", 400);

    const ids = items.map((i: { id: string }) => i.id);
    await db
      .from("ticket_items")
      .update({ status: "DONE", done_at: now })
      .in("id", ids);

    await checkAndAggregateTicket(params.ticketId, ctx.branchId);
    return ok({ bumped: ids.length });
  }

  return fail("Unknown action");
}
