import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["OWNER", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createServerClient();
  const branchId = session.user.branchId;

  // Today start (UTC midnight — simplified for demo)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [tablesRes, ordersRes, paymentsRes, recentOrdersRes] = await Promise.all([
    // Open tables
    db
      .from("tables")
      .select("id, number, status")
      .eq("branch_id", branchId)
      .in("status", ["OCCUPIED", "AWAITING_RUNNER", "BILL_REQUESTED"]),
    // Orders in flight
    db
      .from("orders")
      .select("id, status, table:tables(number)")
      .eq("branch_id", branchId)
      .in("status", ["OPEN", "SENT", "PARTIALLY_READY", "READY", "SERVED"]),
    // Today's payments
    db
      .from("payments")
      .select("amount, tip, method")
      .eq("branch_id", branchId)
      .eq("status", "COMPLETED")
      .gte("created_at", todayStart.toISOString()),
    // Recent orders
    db
      .from("orders")
      .select("id, status, created_at, table:tables(number), waiter:users(name)")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const payments = paymentsRes.data ?? [];
  const revenueToday = payments.reduce(
    (sum: number, p: { amount: number; tip: number }) =>
      sum + Number(p.amount) + Number(p.tip),
    0
  );

  const methodSplit = payments.reduce(
    (acc: Record<string, number>, p: { method: string; amount: number }) => {
      acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
      return acc;
    },
    {}
  );

  // Ready items waiting at pass
  const { data: readyItems } = await db
    .from("order_items")
    .select("id, menu_item:menu_items(name)")
    .eq("status", "READY")
    .in(
      "order_id",
      (ordersRes.data ?? []).map((o: { id: string }) => o.id)
    );

  return NextResponse.json({
    data: {
      openTables: (tablesRes.data ?? []).length,
      ordersInFlight: (ordersRes.data ?? []).length,
      revenueToday,
      methodSplit,
      readyItemsAtPass: (readyItems ?? []).length,
      recentOrders: recentOrdersRes.data ?? [],
    },
  });
}
