"use client";
import { useQuery } from "@tanstack/react-query";
import PassTicketCard from "@/components/pass/PassTicketCard";
import type { Ticket, TicketItem, OrderItem, MenuItem } from "@/types";

type PassTicket = Ticket & {
  order: {
    id: string;
    status: string;
    table: { id: string; number: string; area: { name: string } };
    waiter: { name: string };
  };
  items: (TicketItem & { order_item: OrderItem & { menu_item: MenuItem } })[];
};

async function fetchPassTickets() {
  const res = await fetch("/api/tickets?station=pass");
  const json = await res.json();
  return json.data as PassTicket[];
}

interface GroupedTable {
  orderId: string;
  tableNumber: string;
  areaName: string;
  waiterName: string;
  tickets: PassTicket[];
  allItems: (TicketItem & { order_item: OrderItem & { menu_item: MenuItem } })[];
}

export default function PassPage() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tickets", "pass"],
    queryFn: fetchPassTickets,
    refetchInterval: 3000,
  });

  // Group by order
  const groups = tickets.reduce((acc: Record<string, GroupedTable>, ticket) => {
    const orderId = ticket.order?.id;
    if (!orderId) return acc;
    if (!acc[orderId]) {
      acc[orderId] = {
        orderId,
        tableNumber: ticket.order.table?.number ?? "?",
        areaName: ticket.order.table?.area?.name ?? "",
        waiterName: ticket.order.waiter?.name ?? "",
        tickets: [],
        allItems: [],
      };
    }
    acc[orderId].tickets.push(ticket);
    acc[orderId].allItems.push(...(ticket.items ?? []));
    return acc;
  }, {});

  const groupList = Object.values(groups);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading pass...</p>
      </div>
    );
  }

  if (groupList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-6xl">🍽️</p>
        <p className="text-gray-400 text-xl font-medium">Pass is clear</p>
        <p className="text-gray-600 text-sm">No items ready for pickup</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="flex gap-4 p-4 overflow-x-auto h-full items-start">
        {groupList.map((group) => (
          <PassTicketCard key={group.orderId} group={group} />
        ))}
      </div>
    </div>
  );
}
