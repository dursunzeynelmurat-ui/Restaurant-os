"use client";
import { cn } from "@/lib/utils";
import type { Table } from "@/types";

const STATUS_CONFIG = {
  AVAILABLE: { bg: "bg-emerald-900/40", border: "border-emerald-500", label: "Available", text: "text-emerald-400" },
  OCCUPIED: { bg: "bg-amber-900/40", border: "border-amber-500", label: "Occupied", text: "text-amber-400" },
  RESERVED: { bg: "bg-blue-900/40", border: "border-blue-500", label: "Reserved", text: "text-blue-400" },
  NEEDS_CLEANING: { bg: "bg-red-900/40", border: "border-red-500", label: "Cleaning", text: "text-red-400" },
  BLOCKED: { bg: "bg-gray-800", border: "border-gray-600", label: "Blocked", text: "text-gray-500" },
  BILL_REQUESTED: { bg: "bg-purple-900/40", border: "border-purple-500", label: "Bill Req.", text: "text-purple-400" },
  PAID: { bg: "bg-teal-900/40", border: "border-teal-500", label: "Paid", text: "text-teal-400" },
  AWAITING_RUNNER: { bg: "bg-orange-900/40", border: "border-orange-500", label: "Ready!", text: "text-orange-400" },
};

interface TableCardProps {
  table: Table;
  onClick?: () => void;
  size?: "sm" | "lg";
}

export default function TableCard({ table, onClick, size = "lg" }: TableCardProps) {
  const config = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.AVAILABLE;
  const order = table.active_order as { created_at: string; waiter?: { name: string } } | null;

  const elapsed = order
    ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 select-none",
        config.bg,
        config.border,
        size === "lg" ? "h-28 w-full" : "h-20 w-full",
        onClick ? "cursor-pointer hover:brightness-125" : "cursor-default"
      )}
    >
      <span className="text-2xl font-bold text-white">{table.number}</span>
      <span className={cn("text-xs font-medium mt-1", config.text)}>
        {config.label}
      </span>
      {elapsed !== null && (
        <span className="text-xs text-gray-400 mt-0.5">{elapsed}m</span>
      )}
    </button>
  );
}
