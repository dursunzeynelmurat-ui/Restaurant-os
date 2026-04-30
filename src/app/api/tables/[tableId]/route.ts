import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: table, error } = await db
    .from("tables")
    .select("*, area:areas(id, name)")
    .eq("id", params.tableId)
    .eq("branch_id", session.user.branchId)
    .single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get active order
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("table_id", params.tableId)
    .in("status", ["OPEN", "SENT", "PARTIALLY_READY", "READY", "SERVED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data: { ...table, active_order: order } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = createServerClient();

  const { data, error } = await db
    .from("tables")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", params.tableId)
    .eq("branch_id", session.user.branchId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
