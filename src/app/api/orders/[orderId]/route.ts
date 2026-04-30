import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    .eq("branch_id", session.user.branchId)
    .single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createServerClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.action === "mark_served") {
    updates.status = "SERVED";
    // Update all READY items to SERVED
    const { data: order } = await db
      .from("orders")
      .select("id, table_id, items:order_items(id, status)")
      .eq("id", params.orderId)
      .single();

    if (order) {
      const readyIds = order.items
        .filter((i: { status: string }) => i.status === "READY")
        .map((i: { id: string }) => i.id);

      if (readyIds.length > 0) {
        await db
          .from("order_items")
          .update({ status: "SERVED", served_at: new Date().toISOString() })
          .in("id", readyIds);
      }
      // Table back to OCCUPIED
      await db
        .from("tables")
        .update({ status: "OCCUPIED", updated_at: new Date().toISOString() })
        .eq("id", order.table_id);
    }
  } else if (body.action === "runner_pickup") {
    updates.status = "SERVED";
  } else if (body.status) {
    updates.status = body.status;
  }

  const { data, error } = await db
    .from("orders")
    .update(updates)
    .eq("id", params.orderId)
    .eq("branch_id", session.user.branchId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
