import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { AddOrderItemsSchema } from "@/lib/validators/order";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireSession(["WAITER", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const parsed = AddOrderItemsSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.flatten().toString());

  const db = createServerClient();

  const { data: order } = await db
    .from("orders")
    .select("id, status")
    .eq("id", params.orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (!order) return fail("Order not found", 404);
  if (order.status === "CLOSED" || order.status === "VOIDED")
    return fail("Order is closed", 409);

  // Fetch prices server-side — never trust client prices
  const menuItemIds = parsed.data.items.map((i) => i.menuItemId);
  const { data: menuItems } = await db
    .from("menu_items")
    .select("id, price, active")
    .in("id", menuItemIds);

  const priceMap: Record<string, number> = {};
  const activeIds = new Set<string>();
  for (const m of menuItems ?? []) {
    if (m.active) {
      priceMap[m.id] = Number(m.price);
      activeIds.add(m.id);
    }
  }

  const skipped: string[] = [];
  const insertedItems = [];
  const errors: string[] = [];

  for (const item of parsed.data.items) {
    if (!activeIds.has(item.menuItemId)) {
      skipped.push(item.menuItemId);
      continue;
    }

    const { data: oi, error } = await db
      .from("order_items")
      .insert({
        order_id: params.orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: priceMap[item.menuItemId],
        note: item.note ?? null,
        course: item.course,
        status: "PENDING",
      })
      .select()
      .single();

    if (error || !oi) {
      errors.push(`Failed to add ${item.menuItemId}: ${error?.message ?? "unknown"}`);
      continue;
    }

    insertedItems.push(oi);

    if (item.modifiers.length > 0) {
      const { error: modError } = await db.from("order_item_modifiers").insert(
        item.modifiers.map((m) => ({
          order_item_id: oi.id,
          modifier_id: m.modifierId,
          price_delta: m.priceDelta,
        }))
      );
      if (modError) errors.push(`Modifiers failed for item ${oi.id}`);
    }
  }

  if (insertedItems.length === 0 && errors.length > 0) {
    return fail(`All items failed to add: ${errors.join("; ")}`, 500);
  }

  return ok(
    { items: insertedItems, skipped, errors: errors.length ? errors : undefined },
    201
  );
}
