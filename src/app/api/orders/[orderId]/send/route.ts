import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { routeOrderToTickets } from "@/lib/ticket-router";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const branchId = session.user.branchId;

  // Fetch order with PENDING items
  const { data: order } = await db
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        menu_item:menu_items(id, name, station)
      )
    `)
    .eq("id", params.orderId)
    .eq("branch_id", branchId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const pendingItems = (order.items ?? []).filter(
    (i: { status: string }) => i.status === "PENDING"
  );

  if (pendingItems.length === 0) {
    return NextResponse.json({ error: "No pending items to send" }, { status: 400 });
  }

  // Mark pending items as SENT
  const pendingIds = pendingItems.map((i: { id: string }) => i.id);
  const now = new Date().toISOString();
  await db
    .from("order_items")
    .update({ status: "SENT", sent_at: now })
    .in("id", pendingIds);

  // Update order status to SENT
  await db
    .from("orders")
    .update({ status: "SENT", updated_at: now })
    .eq("id", params.orderId);

  // Route items to station tickets
  await routeOrderToTickets(params.orderId, branchId, pendingItems);

  const { data: updatedOrder } = await db
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  return NextResponse.json({ data: updatedOrder });
}
