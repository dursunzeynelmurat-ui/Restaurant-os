"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  PENDING:     "bg-gray-700 text-gray-300",
  SENT:        "bg-blue-700 text-blue-100",
  IN_PROGRESS: "bg-amber-700 text-amber-100",
  READY:       "bg-emerald-700 text-emerald-100",
  SERVED:      "bg-teal-700 text-teal-100",
  VOIDED:      "bg-red-900 text-red-300 line-through",
};

async function fetchTable(tableId: string) {
  const res = await fetch(`/api/tables/${tableId}`);
  const json = await res.json();
  return json.data;
}

async function fetchOrder(orderId: string) {
  const res = await fetch(`/api/orders/${orderId}`);
  const json = await res.json();
  return json.data as Order;
}

export default function TableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: table } = useQuery({
    queryKey: ["table", tableId],
    queryFn: () => fetchTable(tableId),
    refetchInterval: 5000,
  });

  const activeOrderId = table?.active_order?.id;

  const { data: order } = useQuery({
    queryKey: ["order", activeOrderId],
    queryFn: () => fetchOrder(activeOrderId!),
    enabled: !!activeOrderId,
    refetchInterval: 5000,
  });

  const openTable = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, covers: 2 }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["table", tableId] });
      router.push(`/waiter/table/${tableId}/rush-order`);
    },
    onError: () => toast.error("Failed to open table"),
  });

  const markServed = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orders/${activeOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_served" }),
      });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Table marked as served");
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["table", tableId] });
      qc.invalidateQueries({ queryKey: ["order", activeOrderId] });
    },
  });

  const items = order?.items ?? [];
  const total = items.reduce((sum, item: OrderItem) => {
    const modTotal = (item.modifiers ?? []).reduce(
      (s, m) => s + Number(m.price_delta),
      0
    );
    return sum + (Number(item.unit_price) + modTotal) * item.quantity;
  }, 0);

  const hasReady = items.some((i: OrderItem) => i.status === "READY");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Back
        </button>
        <h2 className="text-xl font-bold">
          Table {table?.number ?? "..."}
        </h2>
        <span className="text-sm text-gray-400">
          {table?.area?.name ?? ""}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!activeOrderId ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-gray-400 text-lg">Table is available</p>
            <button
              onClick={() => openTable.mutate()}
              disabled={openTable.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-xl transition-all active:scale-95"
            >
              {openTable.isPending ? "Opening..." : "Open Table"}
            </button>
          </div>
        ) : (
          <>
            {/* Order items */}
            <div className="space-y-2 mb-4">
              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items yet</p>
              ) : (
                items.map((item: OrderItem) => {
                  const modTotal = (item.modifiers ?? []).reduce(
                    (s, m) => s + Number(m.price_delta),
                    0
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {item.quantity}× {item.menu_item?.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[item.status] ?? ""}`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                        {(item.modifiers ?? []).length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.modifiers!.map((m) => m.modifier?.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-white font-medium">
                        {formatCurrency(
                          (Number(item.unit_price) + modTotal) * item.quantity
                        )}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total */}
            {items.length > 0 && (
              <div className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center mb-4">
                <span className="text-gray-400">Total</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(total)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/waiter/table/${tableId}/rush-order`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
              >
                + Add Order
              </button>
              {hasReady && (
                <button
                  onClick={() => markServed.mutate()}
                  disabled={markServed.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95"
                >
                  ✓ Mark Served
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
