import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { VoidItemSchema } from "@/lib/validators/order";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string; itemId: string } }
) {
  // Void requires manager or owner + a reason
  const auth = await requireSession(["MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const parsed = VoidItemSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.flatten().toString());

  const db = createServerClient();
  const now = new Date().toISOString();

  // Verify item belongs to this branch's order
  const { data: item } = await db
    .from("order_items")
    .select("id, status, order_id, menu_item_id, quantity, unit_price")
    .eq("id", params.itemId)
    .eq("order_id", params.orderId)
    .single();

  if (!item) return fail("Item not found", 404);
  if (item.status === "VOIDED") return fail("Item already voided", 409);

  // Verify order belongs to this branch
  const { data: order } = await db
    .from("orders")
    .select("id, status, table_id")
    .eq("id", params.orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (!order) return fail("Order not found", 404);
  if (order.status === "CLOSED") return fail("Cannot void items on a closed order", 409);

  const { data: updated, error } = await db
    .from("order_items")
    .update({
      status: "VOIDED",
      voided_by: ctx.userId,
      voided_at: now,
      void_reason: parsed.data.reason,
    })
    .eq("id", params.itemId)
    .select()
    .single();

  if (error) return fail(error.message, 500);

  // Also void any ticket items for this order item
  await db
    .from("ticket_items")
    .update({ status: "VOIDED", done_at: now })
    .eq("order_item_id", params.itemId);

  // Audit log
  await db.from("audit_logs").insert({
    user_id: ctx.userId,
    business_id: ctx.businessId,
    branch_id: ctx.branchId,
    action: "ITEM_VOIDED",
    entity: "order_item",
    entity_id: params.itemId,
    payload: {
      orderId: params.orderId,
      menuItemId: item.menu_item_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      reason: parsed.data.reason,
    },
  });

  return ok(updated);
}
