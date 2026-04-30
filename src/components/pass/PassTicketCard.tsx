"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { elapsedMinutes, cn } from "@/lib/utils";
import type { Ticket, TicketItem, OrderItem, MenuItem } from "@/types";

type PassTicket = Ticket & {
  order: {
    id: string;
    status: string;
    table: { id: string; number: string; area: { name: string } };
    waiter: { name: string };
  };
  items: (TicketItem & {
    order_item: OrderItem & { menu_item: MenuItem };
  })[];
};

interface GroupedTable {
  orderId: string;
  tableNumber: string;
  areaName: string;
  waiterName: string;
  tickets: PassTicket[];
  allItems: (TicketItem & { order_item: OrderItem & { menu_item: MenuItem } })[];
}

export default function PassTicketCard({ group }: { group: GroupedTable }) {
  const qc = useQueryClient();

  const markPickedUp = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${group.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "runner_pickup" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Table ${group.tableNumber} — picked up!`);
      qc.invalidateQueries({ queryKey: ["tickets", "pass"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: () => toast.error("Failed to mark picked up"),
  });

  const totalItems = group.allItems.length;
  const doneItems = group.allItems.filter(
    (ti) => ti.status === "DONE"
  ).length;
  const allComplete = doneItems === totalItems;

  const oldestTicket = group.tickets.reduce((oldest, t) =>
    new Date(t.created_at) < new Date(oldest.created_at) ? t : oldest
  );
  const waitMin = elapsedMinutes(oldestTicket.done_at ?? oldestTicket.created_at);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-gray-900 p-4 min-w-72",
        allComplete ? "border-emerald-500" : "border-amber-500"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-3xl font-black text-white">T{group.tableNumber}</p>
          <p className="text-sm text-gray-400">{group.areaName}</p>
          <p className="text-xs text-gray-500">🧑 {group.waiterName}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-xl font-bold",
              waitMin > 5 ? "text-red-400 animate-pulse" : waitMin > 2 ? "text-amber-400" : "text-gray-300"
            )}
          >
            {waitMin}m
          </p>
          <p className="text-xs text-gray-500">waiting</p>
        </div>
      </div>

      {/* Course completion bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Items ready</span>
          <span>
            {doneItems}/{totalItems}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              allComplete ? "bg-emerald-500" : "bg-amber-500"
            )}
            style={{ width: `${(doneItems / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Items by source station */}
      <div className="space-y-1 mb-4">
        {group.allItems.map((ti) => {
          const isDone = ti.status === "DONE";
          const oi = ti.order_item;
          return (
            <div
              key={ti.id}
              className={cn(
                "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                isDone ? "bg-emerald-900/30" : "bg-gray-800"
              )}
            >
              <span className={isDone ? "text-emerald-400" : "text-amber-400"}>
                {isDone ? "✓" : "⏳"}
              </span>
              <span className={cn("flex-1 font-medium", isDone ? "text-emerald-300" : "text-white")}>
                {oi.quantity}× {oi.menu_item?.name}
              </span>
              <span className="text-xs text-gray-500">
                {oi.menu_item?.station === "BAR" ? "🍺" : "🍳"}
              </span>
            </div>
          );
        })}
      </div>

      {!allComplete && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-2 mb-3">
          <p className="text-amber-400 text-xs text-center font-medium">
            ⚠ {totalItems - doneItems} item{totalItems - doneItems > 1 ? "s" : ""} still preparing
          </p>
        </div>
      )}

      <button
        onClick={() => markPickedUp.mutate()}
        disabled={markPickedUp.isPending || !allComplete}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-base transition-all active:scale-95",
          allComplete
            ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        )}
      >
        {markPickedUp.isPending ? "..." : allComplete ? "🏃 Pick Up & Serve" : "Waiting for items..."}
      </button>
    </div>
  );
}
