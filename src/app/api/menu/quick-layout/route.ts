import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();

  const { data: layout, error } = await db
    .from("quick_menu_layouts")
    .select(`
      *,
      items:quick_menu_items(
        *,
        menu_item:menu_items(
          *,
          modifier_groups:menu_item_modifier_groups(
            sort_order,
            modifier_group:modifier_groups(
              *,
              modifiers(*)
            )
          )
        )
      )
    `)
    .eq("branch_id", session.user.branchId)
    .eq("is_default", true)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: layout });
}
