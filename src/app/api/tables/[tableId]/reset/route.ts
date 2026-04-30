import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { tableId: string } }
) {
  const auth = await requireSession(["WAITER", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const db = createServerClient();

  const { data: table } = await db
    .from("tables")
    .select("id, status")
    .eq("id", params.tableId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (!table) return fail("Table not found", 404);

  // Only allow reset from NEEDS_CLEANING or BLOCKED
  if (!["NEEDS_CLEANING", "BLOCKED"].includes(table.status)) {
    return fail(
      `Cannot reset a table with status ${table.status}. Close the active order first.`,
      409
    );
  }

  const { data, error } = await db
    .from("tables")
    .update({ status: "AVAILABLE", updated_at: new Date().toISOString() })
    .eq("id", params.tableId)
    .select()
    .single();

  if (error) return fail(error.message, 500);
  return ok(data);
}
