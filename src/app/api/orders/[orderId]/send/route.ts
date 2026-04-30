import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { routeOrderToTickets } from "@/lib/ticket-router";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireSession(["WAITER", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  // Client-provided idempotency key prevents double-send on retry/double-tap
  const idempotencyKey =
    req.headers.get("x-idempotency-key") ?? null;

  const db = createServerClient();

  // If we've already processed this exact send, return the existing result
  if (idempotencyKey) {
    const { data: existingOrder } = await db
      .from("orders")
      .select("id, status")
      .eq("id", params.orderId)
      .eq("send_idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existingOrder) return ok(existingOrder);
  }

  const { data: order, error: orderErr } = await db
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        menu_item:menu_items(id, name, station)
      )
    `)
    .eq("id", params.orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (orderErr || !order) return fail("Order not found", 404);
  if (order.status === "CLOSED" || order.status === "VOIDED")
    return fail("Order is closed", 409);

  const pendingItems = (order.items ?? []).filter(
    (i: { status: string }) => i.status === "PENDING"
  );

  if (pendingItems.length === 0)
    return fail("No pending items to send", 400);

  const now = new Date().toISOString();
  const pendingIds = pendingItems.map((i: { id: string }) => i.id);

  // Mark items SENT
  const { error: itemErr } = await db
    .from("order_items")
    .update({ status: "SENT", sent_at: now })
    .in("id", pendingIds);

  if (itemErr) return fail("Failed to update items: " + itemErr.message, 500);

  // Update order status + record idempotency key
  const { data: updatedOrder, error: orderUpdateErr } = await db
    .from("orders")
    .update({
      status: "SENT",
      updated_at: now,
      ...(idempotencyKey ? { send_idempotency_key: idempotencyKey } : {}),
    })
    .eq("id", params.orderId)
    .select()
    .single();

  if (orderUpdateErr) return fail(orderUpdateErr.message, 500);

  // Route to station tickets (non-blocking — already committed above)
  await routeOrderToTickets(params.orderId, ctx.branchId, pendingItems);

  return ok(updatedOrder);
}
