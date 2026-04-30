import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { AddOrderItemsSchema } from "@/lib/validators/order";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = AddOrderItemsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = createServerClient();

  // Verify order belongs to this branch
  const { data: order } = await db
    .from("orders")
    .select("id, status")
    .eq("id", params.orderId)
    .eq("branch_id", session.user.branchId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CLOSED" || order.status === "VOIDED") {
    return NextResponse.json({ error: "Order is closed" }, { status: 409 });
  }

  // Get menu item prices
  const menuItemIds = parsed.data.items.map((i) => i.menuItemId);
  const { data: menuItems } = await db
    .from("menu_items")
    .select("id, price")
    .in("id", menuItemIds);

  const priceMap = (menuItems ?? []).reduce(
    (acc: Record<string, number>, m: { id: string; price: number }) => {
      acc[m.id] = m.price;
      return acc;
    },
    {}
  );

  // Insert order items
  const insertedItems = [];
  for (const item of parsed.data.items) {
    const { data: oi, error } = await db
      .from("order_items")
      .insert({
        order_id: params.orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: priceMap[item.menuItemId] ?? 0,
        note: item.note ?? null,
        course: item.course,
        status: "PENDING",
      })
      .select()
      .single();

    if (error || !oi) continue;
    insertedItems.push(oi);

    // Insert modifiers
    if (item.modifiers.length > 0) {
      await db.from("order_item_modifiers").insert(
        item.modifiers.map((m) => ({
          order_item_id: oi.id,
          modifier_id: m.modifierId,
          price_delta: m.priceDelta,
        }))
      );
    }
  }

  return NextResponse.json({ data: insertedItems }, { status: 201 });
}
