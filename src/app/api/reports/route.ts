import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";

function todayStart(date?: string): string {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayEnd(date?: string): string {
  const d = date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function daysAgoStart(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const auth = await requireSession(["OWNER", "MANAGER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "daily";
  const date = searchParams.get("date") ?? undefined;
  const days = Math.min(Number(searchParams.get("days") ?? "7"), 90);

  const db = createServerClient();
  const branchId = ctx.branchId;

  // ─── DAILY ──────────────────────────────────────────────────────────────────
  if (type === "daily") {
    const { data: payments } = await db
      .from("payments")
      .select("amount, tip, method, created_at")
      .eq("branch_id", branchId)
      .eq("status", "COMPLETED")
      .gte("created_at", daysAgoStart(days))
      .order("created_at", { ascending: true });

    const { data: orders } = await db
      .from("orders")
      .select("id, created_at, status")
      .eq("branch_id", branchId)
      .gte("created_at", daysAgoStart(days));

    const dayMap: Record<string, { date: string; revenue: number; orders: number; payments: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, revenue: 0, orders: 0, payments: 0 };
    }

    for (const p of payments ?? []) {
      const key = (p.created_at as string).slice(0, 10);
      if (dayMap[key]) {
        dayMap[key].revenue += Number(p.amount) + Number(p.tip);
        dayMap[key].payments++;
      }
    }
    for (const o of orders ?? []) {
      const key = (o.created_at as string).slice(0, 10);
      if (dayMap[key]) dayMap[key].orders++;
    }

    const rows = Object.values(dayMap).map((r) => ({
      ...r,
      avg_order_value: r.payments > 0 ? r.revenue / r.payments : 0,
    }));

    return ok({ rows, total: rows.reduce((s, r) => s + r.revenue, 0) });
  }

  // ─── HOURLY ─────────────────────────────────────────────────────────────────
  if (type === "hourly") {
    const { data: payments } = await db
      .from("payments")
      .select("amount, tip, created_at")
      .eq("branch_id", branchId)
      .eq("status", "COMPLETED")
      .gte("created_at", todayStart(date))
      .lte("created_at", todayEnd(date));

    const hourMap: Record<number, { hour: number; revenue: number; orders: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { hour: h, revenue: 0, orders: 0 };
    }

    for (const p of payments ?? []) {
      const h = new Date(p.created_at as string).getHours();
      hourMap[h].revenue += Number(p.amount) + Number(p.tip);
      hourMap[h].orders++;
    }

    return ok({ rows: Object.values(hourMap) });
  }

  // ─── WAITER ─────────────────────────────────────────────────────────────────
  if (type === "waiter") {
    const since = daysAgoStart(days);

    const { data: orderItems } = await db
      .from("order_items")
      .select(
        "unit_price, quantity, order:orders!inner(id, waiter_id, waiter:users(id, name), branch_id, created_at)"
      )
      .eq("order.branch_id", branchId)
      .neq("status", "VOIDED")
      .gte("order.created_at", since);

    const waiterMap: Record<string, { waiterId: string; name: string; orders: Set<string>; revenue: number }> = {};

    for (const row of orderItems ?? []) {
      const order = row.order as unknown as { id: string; waiter_id: string; waiter: { id: string; name: string } };
      if (!order) continue;
      const wid = order.waiter_id;
      if (!waiterMap[wid]) {
        waiterMap[wid] = {
          waiterId: wid,
          name: order.waiter?.name ?? "Unknown",
          orders: new Set(),
          revenue: 0,
        };
      }
      waiterMap[wid].orders.add(order.id);
      waiterMap[wid].revenue += Number(row.unit_price) * row.quantity;
    }

    const rows = Object.values(waiterMap).map((w) => ({
      waiterId: w.waiterId,
      name: w.name,
      orders: w.orders.size,
      revenue: w.revenue,
      avg_order_value: w.orders.size > 0 ? w.revenue / w.orders.size : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    return ok({ rows });
  }

  // ─── CATEGORY ───────────────────────────────────────────────────────────────
  if (type === "category") {
    const since = daysAgoStart(days);

    const { data: orderItems } = await db
      .from("order_items")
      .select(
        "unit_price, quantity, menu_item:menu_items!inner(name, category:menu_categories(id, name)), order:orders!inner(branch_id, created_at)"
      )
      .eq("order.branch_id", branchId)
      .neq("status", "VOIDED")
      .gte("order.created_at", since);

    const catMap: Record<string, { categoryId: string; name: string; quantity: number; revenue: number }> = {};

    for (const row of orderItems ?? []) {
      const cat = (row.menu_item as unknown as { category: { id: string; name: string } })?.category;
      if (!cat) continue;
      if (!catMap[cat.id]) {
        catMap[cat.id] = { categoryId: cat.id, name: cat.name, quantity: 0, revenue: 0 };
      }
      catMap[cat.id].quantity += row.quantity;
      catMap[cat.id].revenue += Number(row.unit_price) * row.quantity;
    }

    const rows = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
    return ok({ rows });
  }

  // ─── PRODUCT ─────────────────────────────────────────────────────────────────
  if (type === "product") {
    const since = daysAgoStart(days);

    const { data: orderItems } = await db
      .from("order_items")
      .select(
        "menu_item_id, unit_price, quantity, menu_item:menu_items(name), order:orders!inner(branch_id, created_at)"
      )
      .eq("order.branch_id", branchId)
      .neq("status", "VOIDED")
      .gte("order.created_at", since);

    const productMap: Record<string, { menuItemId: string; name: string; quantity: number; revenue: number }> = {};

    for (const row of orderItems ?? []) {
      const mid = row.menu_item_id;
      if (!productMap[mid]) {
        productMap[mid] = {
          menuItemId: mid,
          name: (row.menu_item as unknown as { name: string })?.name ?? "Unknown",
          quantity: 0,
          revenue: 0,
        };
      }
      productMap[mid].quantity += row.quantity;
      productMap[mid].revenue += Number(row.unit_price) * row.quantity;
    }

    const rows = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 30);

    return ok({ rows });
  }

  // ─── PREP TIME ───────────────────────────────────────────────────────────────
  if (type === "prep_time") {
    const since = daysAgoStart(days);

    const { data: tickets } = await db
      .from("tickets")
      .select(
        "id, created_at, status, station:stations(name, type), items:ticket_items(done_at, status)"
      )
      .eq("status", "DONE")
      .gte("created_at", since);

    const stationMap: Record<string, { station: string; seconds: number[]; count: number }> = {};

    for (const ticket of tickets ?? []) {
      const station = (ticket.station as unknown as { name: string; type: string });
      if (!station) continue;

      const doneItems = (ticket.items as { done_at: string | null; status: string }[]).filter(
        (ti) => ti.status === "DONE" && ti.done_at
      );
      if (!doneItems.length) continue;

      const lastDoneAt = Math.max(...doneItems.map((ti) => new Date(ti.done_at!).getTime()));
      const createdAt = new Date(ticket.created_at as string).getTime();
      const seconds = (lastDoneAt - createdAt) / 1000;

      if (seconds <= 0 || seconds > 7200) continue; // skip bogus values

      const key = station.name;
      if (!stationMap[key]) {
        stationMap[key] = { station: station.name, seconds: [], count: 0 };
      }
      stationMap[key].seconds.push(seconds);
      stationMap[key].count++;
    }

    const rows = Object.values(stationMap).map((s) => ({
      station: s.station,
      count: s.count,
      avg_seconds: Math.round(s.seconds.reduce((a, b) => a + b, 0) / s.seconds.length),
      min_seconds: Math.round(Math.min(...s.seconds)),
      max_seconds: Math.round(Math.max(...s.seconds)),
    }));

    return ok({ rows });
  }

  // ─── VOIDS ───────────────────────────────────────────────────────────────────
  if (type === "voids") {
    const since = daysAgoStart(days);

    const { data: logs } = await db
      .from("audit_logs")
      .select("created_at, payload, user:users(name)")
      .eq("branch_id", branchId)
      .eq("action", "ITEM_VOIDED")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = (logs ?? []).map((log) => {
      const payload = log.payload as {
        orderId?: string;
        menuItemId?: string;
        quantity?: number;
        unitPrice?: number;
        reason?: string;
        menuItemName?: string;
      };
      return {
        at: log.created_at,
        voided_by: (log.user as unknown as { name: string })?.name ?? "Unknown",
        quantity: payload?.quantity ?? 1,
        unit_price: payload?.unitPrice ?? 0,
        reason: payload?.reason ?? "",
        orderId: payload?.orderId ?? "",
      };
    });

    return ok({ rows });
  }

  return fail("Unknown report type. Use: daily | hourly | waiter | category | product | prep_time | voids");
}
