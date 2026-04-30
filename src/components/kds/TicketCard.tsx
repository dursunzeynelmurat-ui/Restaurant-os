"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn, elapsedDisplay, elapsedMinutes } from "@/lib/utils";
import type { Ticket, TicketItem, OrderItem, MenuItem, Modifier } from "@/types";

interface TicketCardProps {
  ticket: Ticket & {
    order: { id: string; status: string; table: { number: string; area: { name: string } }; waiter: { name: string } };
    items: (TicketItem & {
      order_item: OrderItem & {
        menu_item: MenuItem;
        modifiers: { modifier: Modifier }[];
      };
    })[];
  };
  stationKey: string;
}

export default function TicketCard({ ticket, stationKey }: TicketCardProps) {
  const qc = useQueryClient();
  const [elapsed, setElapsed] = useState(() => elapsedDisplay(ticket.created_at));

  const elapsed_min = elapsedMinutes(ticket.created_at);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(elapsedDisplay(ticket.created_at));
    }, 1000);
    return () => clearInterval(timer);
  }, [ticket.created_at]);

  const markItemDone = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/tickets/${ticket.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", stationKey] }),
    onError: () => toast.error("Failed to update item"),
  });

  const markItemInProgress = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/tickets/${ticket.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", stationKey] }),
  });

  const allDone = ticket.items.every(
    (ti) => ti.status === "DONE" || ti.status === "VOIDED"
  );

  const timeColor =
    elapsed_min >= 12
      ? "text-red-400 animate-pulse"
      : elapsed_min >= 8
      ? "text-amber-400"
      : "text-gray-400";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-gray-900 p-4 flex flex-col gap-3 min-w-64 max-w-72 shrink-0",
        ticket.status === "IN_PROGRESS" ? "border-amber-500" : "border-gray-700"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-black text-white">T{ticket.order?.table?.number}</p>
          <p className="text-sm text-gray-400">{ticket.order?.table?.area?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">🧑 {ticket.order?.waiter?.name}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-xl font-bold font-mono", timeColor)}>{elapsed}</p>
          <p className="text-xs text-gray-500">
            {ticket.status === "IN_PROGRESS" ? "⚡ In progress" : "⏳ Waiting"}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {ticket.items.map((ti) => {
          const isDone = ti.status === "DONE";
          const isInProgress = ti.status === "IN_PROGRESS";
          const oi = ti.order_item;
          if (!oi) return null;

          return (
            <div
              key={ti.id}
              className={cn(
                "rounded-xl p-3 transition-all",
                isDone
                  ? "bg-emerald-900/30 border border-emerald-700"
                  : isInProgress
                  ? "bg-amber-900/30 border border-amber-700"
                  : "bg-gray-800 border border-gray-700"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <p className={cn("font-bold text-base", isDone ? "text-emerald-400 line-through" : "text-white")}>
                    {oi.quantity}× {oi.menu_item?.name}
                  </p>
                  {(oi.modifiers ?? []).length > 0 && (
                    <p className="text-xs text-gray-400">
                      {(oi.modifiers ?? []).map((m) => m.modifier?.name).join(" · ")}
                    </p>
                  )}
                  {oi.note && <p className="text-xs text-amber-300">📝 {oi.note}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!isDone && !isInProgress && (
                    <button
                      onClick={() => markItemInProgress.mutate(ti.id)}
                      className="w-10 h-10 bg-amber-600 hover:bg-amber-500 rounded-full text-white font-bold text-xs flex items-center justify-center transition-all active:scale-90"
                    >
                      ▶
                    </button>
                  )}
                  {!isDone && (
                    <button
                      onClick={() => markItemDone.mutate(ti.id)}
                      className="w-10 h-10 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white font-bold text-lg flex items-center justify-center transition-all active:scale-90"
                    >
                      ✓
                    </button>
                  )}
                  {isDone && (
                    <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center">
                      <span className="text-emerald-300 text-lg">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      {allDone && (
        <div className="bg-emerald-800/50 rounded-xl p-2 text-center">
          <p className="text-emerald-400 font-bold text-sm">✓ All ready — heading to pass</p>
        </div>
      )}
    </div>
  );
}
