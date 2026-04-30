import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { checkAndAggregateTicket } from "@/lib/ticket-router";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string; itemId: string } }
) {
  const auth = await requireSession(["KITCHEN", "BAR", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const status = body.status as string;

  if (!["IN_PROGRESS", "DONE"].includes(status)) {
    return fail("Status must be IN_PROGRESS or DONE");
  }

  const db = createServerClient();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("ticket_items")
    .update({
      status,
      done_at: status === "DONE" ? now : null,
    })
    .eq("id", params.itemId)
    .eq("ticket_id", params.ticketId)
    .select()
    .single();

  if (error) return fail(error.message, 500);

  if (status === "DONE") {
    await checkAndAggregateTicket(params.ticketId, ctx.branchId);
  }

  if (status === "IN_PROGRESS") {
    await db
      .from("tickets")
      .update({ status: "IN_PROGRESS", updated_at: now })
      .eq("id", params.ticketId)
      .eq("status", "PENDING");
  }

  return ok(data);
}
