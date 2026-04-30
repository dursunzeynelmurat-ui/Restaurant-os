import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { checkAndAggregateTicket } from "@/lib/ticket-router";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string; itemId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createServerClient();
  const now = new Date().toISOString();

  const status = body.status as string;

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If marking DONE, check if whole ticket is done
  if (status === "DONE") {
    await checkAndAggregateTicket(params.ticketId, session.user.branchId);
  }

  // If marking IN_PROGRESS, update ticket status too
  if (status === "IN_PROGRESS") {
    await db
      .from("tickets")
      .update({ status: "IN_PROGRESS", updated_at: now })
      .eq("id", params.ticketId)
      .eq("status", "PENDING");
  }

  return NextResponse.json({ data });
}
