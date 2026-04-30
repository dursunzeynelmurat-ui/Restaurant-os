import { createServerClient } from "./supabase";
import type { OrderItem, MenuItem, Station } from "@/types";

interface ItemWithMenuItem extends OrderItem {
  menu_item: MenuItem;
}

export async function routeOrderToTickets(
  orderId: string,
  branchId: string,
  items: ItemWithMenuItem[]
): Promise<void> {
  const db = createServerClient();

  // Get stations for this branch
  const { data: stations } = await db
    .from("stations")
    .select("*")
    .eq("branch_id", branchId)
    .eq("active", true);

  if (!stations?.length) return;

  const kitchenStation = stations.find((s: Station) => s.type === "KITCHEN");
  const barStation = stations.find((s: Station) => s.type === "BAR");

  // Group items by station
  const kitchenItems = items.filter(
    (item) => item.menu_item.station === "KITCHEN"
  );
  const barItems = items.filter((item) => item.menu_item.station === "BAR");

  // Create kitchen ticket if needed
  if (kitchenItems.length > 0 && kitchenStation) {
    await createTicketForStation(db, orderId, kitchenStation.id, kitchenItems);
  }

  // Create bar ticket if needed
  if (barItems.length > 0 && barStation) {
    await createTicketForStation(db, orderId, barStation.id, barItems);
  }
}

async function createTicketForStation(
  db: ReturnType<typeof createServerClient>,
  orderId: string,
  stationId: string,
  items: ItemWithMenuItem[]
): Promise<void> {
  const { data: ticket, error } = await db
    .from("tickets")
    .insert({ order_id: orderId, station_id: stationId, status: "PENDING" })
    .select()
    .single();

  if (error || !ticket) return;

  const ticketItems = items.map((item) => ({
    ticket_id: ticket.id,
    order_item_id: item.id,
    status: "PENDING" as const,
  }));

  await db.from("ticket_items").insert(ticketItems);
}

export async function checkAndAggregateTicket(
  ticketId: string,
  branchId: string
): Promise<void> {
  const db = createServerClient();

  // Check if all items in this ticket are DONE
  const { data: ticketItems } = await db
    .from("ticket_items")
    .select("*")
    .eq("ticket_id", ticketId);

  if (!ticketItems?.length) return;

  const allDone = ticketItems.every(
    (ti: { status: string }) => ti.status === "DONE" || ti.status === "VOIDED"
  );

  if (!allDone) return;

  // Mark ticket as DONE
  await db
    .from("tickets")
    .update({ status: "DONE", done_at: new Date().toISOString() })
    .eq("id", ticketId);

  // Mark all corresponding order items as READY
  const orderItemIds = ticketItems.map(
    (ti: { order_item_id: string }) => ti.order_item_id
  );
  const now = new Date().toISOString();
  await db
    .from("order_items")
    .update({ status: "READY", ready_at: now })
    .in("id", orderItemIds);

  // Get the order from this ticket
  const { data: ticket } = await db
    .from("tickets")
    .select("order_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) return;

  // Check if all tickets for this order are done
  const { data: allTickets } = await db
    .from("tickets")
    .select("status")
    .eq("order_id", ticket.order_id);

  const allTicketsDone = allTickets?.every(
    (t: { status: string }) => t.status === "DONE" || t.status === "VOIDED"
  );

  if (allTicketsDone) {
    // All stations done — mark order READY and table AWAITING_RUNNER
    const { data: order } = await db
      .from("orders")
      .select("table_id")
      .eq("id", ticket.order_id)
      .single();

    await db
      .from("orders")
      .update({ status: "READY" })
      .eq("id", ticket.order_id);

    if (order?.table_id) {
      await db
        .from("tables")
        .update({ status: "AWAITING_RUNNER", updated_at: now })
        .eq("id", order.table_id);
    }
  }
}
