import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const branchId = session.user.branchId;

  // Get all tables with their area info
  const { data: tables, error } = await db
    .from("tables")
    .select("*, area:areas(id, name, sort_order)")
    .eq("branch_id", branchId)
    .order("number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get active orders (OPEN or SENT or READY) for each table
  const { data: orders } = await db
    .from("orders")
    .select("id, table_id, status, created_at, waiter:users(name)")
    .eq("branch_id", branchId)
    .in("status", ["OPEN", "SENT", "PARTIALLY_READY", "READY", "SERVED"]);

  // Map active order to each table
  const orderByTable = (orders ?? []).reduce(
    (acc: Record<string, unknown>, o: Record<string, unknown>) => {
      acc[o.table_id as string] = o;
      return acc;
    },
    {}
  );

  const enriched = (tables ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    active_order: orderByTable[t.id as string] ?? null,
  }));

  return NextResponse.json({ data: enriched });
}
