import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { CreateOrderSchema } from "@/lib/validators/order";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = createServerClient();
  const { tableId, covers } = parsed.data;
  const branchId = session.user.branchId;

  // Check table belongs to branch
  const { data: table } = await db
    .from("tables")
    .select("id, status")
    .eq("id", tableId)
    .eq("branch_id", branchId)
    .single();

  if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

  // Check for existing active order
  const { data: existing } = await db
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .in("status", ["OPEN", "SENT", "PARTIALLY_READY", "READY", "SERVED"])
    .maybeSingle();

  if (existing) return NextResponse.json({ data: existing });

  // Create order
  const { data: order, error } = await db
    .from("orders")
    .insert({
      branch_id: branchId,
      table_id: tableId,
      waiter_id: session.user.id,
      status: "OPEN",
      covers,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update table status
  await db
    .from("tables")
    .update({ status: "OCCUPIED", updated_at: new Date().toISOString() })
    .eq("id", tableId);

  return NextResponse.json({ data: order }, { status: 201 });
}
