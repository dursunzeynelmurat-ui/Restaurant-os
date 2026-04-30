import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const station = (searchParams.get("station") ?? "kitchen").toUpperCase();

  const db = createServerClient();
  const branchId = session.user.branchId;

  // Find stations for this branch matching the type
  const { data: stations } = await db
    .from("stations")
    .select("id")
    .eq("branch_id", branchId)
    .eq("type", station);

  const stationIds = (stations ?? []).map((s: { id: string }) => s.id);
  if (!stationIds.length) return NextResponse.json({ data: [] });

  const statuses =
    station === "PASS"
      ? ["DONE"] // Pass shows completed kitchen/bar tickets
      : ["PENDING", "IN_PROGRESS"];

  const { data: tickets, error } = await db
    .from("tickets")
    .select(`
      *,
      station:stations(id, name, type),
      order:orders(
        id, status,
        table:tables(id, number, area:areas(name)),
        waiter:users(id, name)
      ),
      items:ticket_items(
        *,
        order_item:order_items(
          *,
          menu_item:menu_items(id, name, station),
          modifiers:order_item_modifiers(*, modifier:modifiers(id, name, price_delta))
        )
      )
    `)
    .in("station_id", stationIds)
    .in("status", statuses)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: tickets ?? [] });
}
