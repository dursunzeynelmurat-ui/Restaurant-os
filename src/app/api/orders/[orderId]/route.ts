import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const db = createServerClient();
  const { data: order, error } = await db
    .from("orders")
    .select(`
      *,
      table:tables(id, number, area:areas(name)),
      waiter:users(id, name),
      items:order_items(
        *,
        menu_item:menu_items(id, name, price, station, category:menu_categories(name)),
        modifiers:order_item_modifiers(*, modifier:modifiers(id, name, price_delta))
      ),
      payment:payments(*)
    `)
    .eq("id", params.orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (error) return fail("Order not found", 404);
  return ok(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const db = createServerClient();
  const now = new Date().toISOString();

  // Verify order belongs to this branch
  const { data: order } = await db
    .from("orders")
    .select("id, status, table_id, items:order_items(id, status)")
    .eq("id", params.orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (!order) return fail("Order not found", 404);

  if (body.action === "mark_served") {
    // Only waiter/manager/owner can mark served
    if (!["WAITER", "MANAGER", "OWNER"].includes(ctx.role)) {
      return fail("Forbidden", 403);
    }

    const readyIds = order.items
      .filter((i: { status: string }) => i.status === "READY")
      .map((i: { id: string }) => i.id);

    if (readyIds.length > 0) {
      await db
        .from("order_items")
        .update({ status: "SERVED", served_at: now })
        .in("id", readyIds);
    }

    await db
      .from("orders")
      .update({ status: "SERVED", updated_at: now })
      .eq("id", params.orderId);

    // Table back to OCCUPIED — food served but bill not yet requested
    await db
      .from("tables")
      .update({ status: "OCCUPIED", updated_at: now })
      .eq("id", order.table_id);

  } else if (body.action === "runner_pickup") {
    // Runner/waiter/manager can pick up
    if (!["RUNNER", "WAITER", "MANAGER", "OWNER"].includes(ctx.role)) {
      return fail("Forbidden", 403);
    }

    // Mark all READY items as SERVED
    const readyIds = order.items
      .filter((i: { status: string }) => i.status === "READY")
      .map((i: { id: string }) => i.id);

    if (readyIds.length > 0) {
      await db
        .from("order_items")
        .update({ status: "SERVED", served_at: now })
        .in("id", readyIds);
    }

    await db
      .from("orders")
      .update({ status: "SERVED", updated_at: now })
      .eq("id", params.orderId);

    // *** FIX: Update table status after runner picks up ***
    await db
      .from("tables")
      .update({ status: "OCCUPIED", updated_at: now })
      .eq("id", order.table_id);

  } else if (body.action === "request_bill") {
    if (!["WAITER", "MANAGER", "OWNER", "CASHIER"].includes(ctx.role)) {
      return fail("Forbidden", 403);
    }
    await db
      .from("tables")
      .update({ status: "BILL_REQUESTED", updated_at: now })
      .eq("id", order.table_id);

  } else if (body.action === "reset_table") {
    // Manager/owner only — reset stuck tables
    if (!["MANAGER", "OWNER"].includes(ctx.role)) {
      return fail("Forbidden", 403);
    }
    await db
      .from("tables")
      .update({ status: "AVAILABLE", updated_at: now })
      .eq("id", order.table_id);
  }

  const { data: updated } = await db
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  return ok(updated);
}
