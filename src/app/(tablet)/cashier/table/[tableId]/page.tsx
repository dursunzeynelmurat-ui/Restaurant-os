"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

async function fetchTable(tableId: string) {
  const res = await fetch(`/api/tables/${tableId}`);
  return res.json().then((j) => j.data);
}

async function fetchOrder(orderId: string) {
  const res = await fetch(`/api/orders/${orderId}`);
  return res.json().then((j) => j.data as Order);
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "💵 Cash", color: "bg-emerald-600 hover:bg-emerald-500" },
  { value: "CARD", label: "💳 Card", color: "bg-blue-600 hover:bg-blue-500" },
  { value: "TRANSFER", label: "🏦 Transfer", color: "bg-purple-600 hover:bg-purple-500" },
  { value: "MIXED", label: "🔀 Mixed", color: "bg-amber-600 hover:bg-amber-500" },
];

const TIP_PRESETS = [0, 10, 20, 50];

export default function CashierTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [tipPreset, setTipPreset] = useState<number | null>(0);
  const [customTipInput, setCustomTipInput] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [tendered, setTendered] = useState("");
  // MIXED split inputs
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");

  const { data: table } = useQuery({
    queryKey: ["table", tableId],
    queryFn: () => fetchTable(tableId),
  });

  const orderId = table?.active_order?.id;

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
  });

  const tip = showCustomTip
    ? Number(customTipInput) || 0
    : tipPreset ?? 0;

  const items = order?.items ?? [];

  const subtotal = items.reduce((sum, item: OrderItem) => {
    const modTotal = (item.modifiers ?? []).reduce(
      (s, m) => s + Number(m.price_delta),
      0
    );
    return sum + (Number(item.unit_price) + modTotal) * item.quantity;
  }, 0);

  const total = subtotal + tip;

  const change =
    selectedMethod === "CASH" && tendered
      ? Number(tendered) - total
      : null;

  const mixedCash = Number(cashAmount) || 0;
  const mixedCard = Number(cardAmount) || 0;
  const mixedSumOk = selectedMethod === "MIXED"
    ? Math.abs(mixedCash + mixedCard - total) < 0.01
    : true;

  const processPayment = useMutation({
    mutationFn: async () => {
      if (!selectedMethod || !orderId) throw new Error("Missing data");
      if (selectedMethod === "MIXED" && !mixedSumOk) {
        throw new Error(`Split must equal ${formatCurrency(total)}`);
      }

      const payload: Record<string, unknown> = {
        orderId,
        tip,
        method: selectedMethod,
      };

      if (selectedMethod === "MIXED") {
        payload.splits = [
          { method: "CASH", amount: mixedCash },
          { method: "CARD", amount: mixedCard },
        ];
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Payment failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Payment accepted! Table closed.");
      qc.invalidateQueries({ queryKey: ["tables"] });
      router.push("/cashier");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!orderId || (!isLoading && !order)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-400 text-lg">No active order for Table {table?.number}</p>
        <button
          onClick={() => router.back()}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-white">Table {table?.number} — Bill</h2>
        <span className="text-sm text-gray-400">{order?.waiter?.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Items */}
        <div className="p-4 space-y-2">
          {items.map((item: OrderItem) => {
            const modTotal = (item.modifiers ?? []).reduce(
              (s, m) => s + Number(m.price_delta),
              0
            );
            const lineTotal = (Number(item.unit_price) + modTotal) * item.quantity;
            return (
              <div key={item.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex-1">
                  <p className="text-white font-semibold">
                    {item.quantity}× {item.menu_item?.name}
                  </p>
                  {(item.modifiers ?? []).length > 0 && (
                    <p className="text-gray-400 text-xs">
                      {item.modifiers!.map((m) => m.modifier?.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCurrency(lineTotal)}</p>
                  <p className="text-gray-500 text-xs">
                    {formatCurrency(Number(item.unit_price) + modTotal)} each
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mx-4 bg-gray-800 rounded-2xl p-4 space-y-3 mb-4">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Tip row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tip</span>
              <div className="flex gap-2">
                {TIP_PRESETS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTipPreset(t);
                      setShowCustomTip(false);
                      setCustomTipInput("");
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      !showCustomTip && tipPreset === t
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {t === 0 ? "None" : `₺${t}`}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowCustomTip(true);
                    setTipPreset(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    showCustomTip
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Other
                </button>
              </div>
            </div>
            {showCustomTip && (
              <input
                type="number"
                min="0"
                step="0.01"
                value={customTipInput}
                onChange={(e) => setCustomTipInput(e.target.value)}
                placeholder="Enter tip amount..."
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            )}
          </div>

          {tip > 0 && (
            <div className="flex justify-between text-gray-400">
              <span>Tip</span>
              <span className="text-emerald-400">+{formatCurrency(tip)}</span>
            </div>
          )}

          <div className="flex justify-between text-xl font-black text-white border-t border-gray-700 pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {!showPayment ? (
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-2xl active:scale-95 transition-all"
          >
            Accept Payment — {formatCurrency(total)}
          </button>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800 space-y-3">
          {/* Method selection */}
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  setSelectedMethod(m.value);
                  setCashAmount("");
                  setCardAmount("");
                  setTendered("");
                }}
                className={`py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 ${
                  selectedMethod === m.value
                    ? m.color + " ring-2 ring-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Cash tendered */}
          {selectedMethod === "CASH" && (
            <div className="flex gap-3">
              <input
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder="Cash tendered..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
              />
              {change !== null && change >= 0 && (
                <div className="bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-3 flex flex-col items-center justify-center">
                  <span className="text-xs text-emerald-400">Change</span>
                  <span className="text-lg font-bold text-emerald-300">
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mixed split inputs */}
          {selectedMethod === "MIXED" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Split total must equal {formatCurrency(total)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">💵 Cash</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-emerald-500 focus:outline-none text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">💳 Card</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
                  />
                </div>
              </div>
              {(mixedCash > 0 || mixedCard > 0) && (
                <div className={`text-sm font-medium text-center ${mixedSumOk ? "text-emerald-400" : "text-red-400"}`}>
                  {mixedSumOk
                    ? `✓ Split OK — ${formatCurrency(mixedCash)} cash + ${formatCurrency(mixedCard)} card`
                    : `Split is ${formatCurrency(mixedCash + mixedCard)}, need ${formatCurrency(total)}`}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowPayment(false)}
              className="flex-1 py-4 rounded-2xl bg-gray-700 text-white font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => processPayment.mutate()}
              disabled={
                !selectedMethod ||
                processPayment.isPending ||
                (selectedMethod === "MIXED" && !mixedSumOk)
              }
              className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-lg transition-all active:scale-95"
            >
              {processPayment.isPending ? "Processing..." : "✓ Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
