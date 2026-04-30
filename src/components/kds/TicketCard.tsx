"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn, elapsedDisplay, elapsedMinutes } from "@/lib/utils";
import type { Ticket, TicketItem, OrderItem, MenuItem, Modifier } from "@/types";

interface TicketCardProps {
  ticket: Ticket & {
    order: {
      id: string;
      status: string;
      table: { number: string; area: { name: string } };
      waiter: { name: string };
      kitchen_note?: string;
    };
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
    const timer = setInterval(
      () => setElapsed(elapsedDisplay(ticket.created_at)),
      1000
    );
    return () => clearInterval(timer);
  }, [ticket.created_at]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tickets", stationKey] });

  const markItemDone = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/tickets/${ticket.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: invalidate,
    onError: () => toast.error("Failed to update item"),
  });

  const markItemInProgress = useMutation({
    mutationFn: async (itemId: string) => {
      await fetch(`/api/tickets/${ticket.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
    },
    onSuccess: invalidate,
  });

  const bumpAll = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bump_all" }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success(`Ticket T${ticket.order?.table?.number} bumped`);
      invalidate();
    },
    onError: () => toast.error("Failed to bump ticket"),
  });

  const activeItems = ticket.items.filter(
    (ti) => ti.status !== "DONE" && ti.status !== "VOIDED"
  );
  const allDone = activeItems.length === 0;

  const timeColor =
    elapsed_min >= 12
      ? "text-red-400 animate-pulse"
      : elapsed_min >= 8
      ? "text-amber-400"
      : "text-gray-400";

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-gray-900 p-4 flex flex-col gap-3 w-72 shrink-0",
        allDone
          ? "border-emerald-500 opacity-60"
          : ticket.status === "IN_PROGRESS"
          ? "border-amber-500"
          : "border-gray-700"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-black text-white">
            T{ticket.order?.table?.number}
          </p>
          <p className="text-sm text-gray-400">{ticket.order?.table?.area?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            🧑 {ticket.order?.waiter?.name}
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-xl font-bold font-mono", timeColor)}>{elapsed}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {allDone
              ? "✓ Done"
              : ticket.status === "IN_PROGRESS"
              ? "⚡ Cooking"
              : "⏳ Waiting"}
          </p>
        </div>
      </div>

      {/* Kitchen note */}
      {ticket.order?.kitchen_note && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-lg px-3 py-2 text-xs text-amber-300">
          📝 {ticket.order.kitchen_note}
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {ticket.items.map((ti) => {
          const oi = ti.order_item;
          if (!oi) return null;
          const isDone = ti.status === "DONE" || ti.status === "VOIDED";
          const isInProgress = ti.status === "IN_PROGRESS";

          return (
            <div
              key={ti.id}
              className={cn(
                "rounded-xl p-3 transition-all",
                ti.status === "VOIDED"
                  ? "bg-gray-800/50 opacity-40"
                  : isDone
                  ? "bg-emerald-900/30 border border-emerald-700"
                  : isInProgress
                  ? "bg-amber-900/30 border border-amber-700"
                  : "bg-gray-800 border border-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-bold text-base",
                      isDone ? "text-emerald-400 line-through" : "text-white"
                    )}
                  >
                    {oi.quantity}× {oi.menu_item?.name}
                  </p>
                  {(oi.modifiers ?? []).length > 0 && (
                    <p className="text-xs text-gray-400">
                      {(oi.modifiers ?? [])
                        .map((m) => m.modifier?.name)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {oi.note && (
                    <p className="text-xs text-amber-300 mt-0.5">📝 {oi.note}</p>
                  )}
                </div>
                {!isDone && (
                  <div className="flex gap-1 shrink-0">
                    {!isInProgress && (
                      <button
                        onClick={() => markItemInProgress.mutate(ti.id)}
                        className="w-9 h-9 bg-amber-600 hover:bg-amber-500 rounded-full text-white text-xs flex items-center justify-center active:scale-90"
                      >
                        ▶
                      </button>
                    )}
                    <button
                      onClick={() => markItemDone.mutate(ti.id)}
                      className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white text-lg flex items-center justify-center active:scale-90"
                    >
                      ✓
                    </button>
                  </div>
                )}
                {isDone && ti.status !== "VOIDED" && (
                  <div className="w-9 h-9 bg-emerald-700 rounded-full flex items-center justify-center">
                    <span className="text-emerald-300 text-lg">✓</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bump All button — only when there are active items */}
      {!allDone && (
        <button
          onClick={() => bumpAll.mutate()}
          disabled={bumpAll.isPending}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-base transition-all active:scale-95"
        >
          {bumpAll.isPending ? "..." : "✓✓ Bump All Done"}
        </button>
      )}

      {allDone && (
        <div className="bg-emerald-800/40 rounded-xl p-2 text-center">
          <p className="text-emerald-400 font-bold text-sm">
            ✓ Ready — heading to pass
          </p>
        </div>
      )}
    </div>
  );
}
