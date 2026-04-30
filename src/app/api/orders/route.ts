import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { CreateOrderSchema } from "@/lib/validators/order";

export async function POST(req: NextRequest) {
  const auth = await requireSession(["WAITER", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.flatten().toString());

  const db = createServerClient();
  const { tableId, covers } = parsed.data;

  const { data: table } = await db
    .from("tables")
    .select("id, status")
    .eq("id", tableId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (!table) return fail("Table not found", 404);
  if (table.status === "BLOCKED") return fail("Table is blocked", 409);

  // Return existing active order instead of creating duplicate
  const { data: existing } = await db
    .from("orders")
    .select("id")
    .eq("table_id", tableId)
    .in("status", ["OPEN", "SENT", "PARTIALLY_READY", "READY", "SERVED"])
    .maybeSingle();

  if (existing) return ok(existing);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      branch_id: ctx.branchId,
      table_id: tableId,
      waiter_id: ctx.userId,
      status: "OPEN",
      covers,
    })
    .select()
    .single();

  if (error) return fail(error.message, 500);

  await db
    .from("tables")
    .update({ status: "OCCUPIED", updated_at: new Date().toISOString() })
    .eq("id", tableId);

  return ok(order, 201);
}
