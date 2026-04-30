"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { QuickMenuLayout, QuickMenuItem, MenuItem, DraftItem, ModifierGroup, Modifier } from "@/types";

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchTableAndOrder(tableId: string) {
  const res = await fetch(`/api/tables/${tableId}`);
  const json = await res.json();
  return json.data;
}

async function fetchQuickMenu() {
  const res = await fetch("/api/menu/quick-layout");
  const json = await res.json();
  return json.data as QuickMenuLayout & { items: (QuickMenuItem & { menu_item: MenuItem & { modifier_groups?: { modifier_group: ModifierGroup & { modifiers: Modifier[] } }[] } })[] };
}

// ─── Quick Menu Button ────────────────────────────────────────────────────────

function QuickMenuButton({
  item,
  count,
  onTap,
  onLongPress,
}: {
  item: QuickMenuItem & { menu_item: MenuItem };
  count: number;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const label = item.label ?? item.menu_item.name;
  const color = item.color ?? "#374151";

  function startPress() {
    pressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  }

  function endPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  return (
    <button
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onClick={onTap}
      className="relative flex flex-col items-center justify-center rounded-2xl text-white font-bold transition-all active:scale-90 select-none touch-manipulation"
      style={{ backgroundColor: color, minHeight: "80px" }}
    >
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-white text-gray-900 text-sm font-black rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10">
          {count}
        </span>
      )}
      <span className="text-sm font-bold leading-tight px-2 text-center">{label}</span>
      <span className="text-xs opacity-75 mt-1">{formatCurrency(Number(item.menu_item.price))}</span>
    </button>
  );
}

// ─── Modifier Sheet ───────────────────────────────────────────────────────────

function ModifierSheet({
  item,
  onAdd,
  onClose,
}: {
  item: QuickMenuItem & { menu_item: MenuItem & { modifier_groups?: { modifier_group: ModifierGroup & { modifiers: Modifier[] } }[] } };
  onAdd: (modifiers: { modifierId: string; name: string; priceDelta: number }[], note: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");

  const groups = item.menu_item.modifier_groups ?? [];

  function toggleMod(modId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  }

  function handleAdd() {
    const allModifiers = groups.flatMap((g) => g.modifier_group?.modifiers ?? []);
    const selectedMods = allModifiers
      .filter((m: Modifier) => selected.has(m.id))
      .map((m: Modifier) => ({
        modifierId: m.id,
        name: m.name,
        priceDelta: Number(m.price_delta),
      }));
    onAdd(selectedMods, note);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-3xl w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white">{item.menu_item.name}</h3>
        <p className="text-gray-400">{formatCurrency(Number(item.menu_item.price))}</p>

        {groups.map((g) => (
          <div key={g.modifier_group?.id ?? Math.random()}>
            <p className="text-sm text-gray-400 font-medium mb-2">{g.modifier_group?.name}</p>
            <div className="flex flex-wrap gap-2">
              {(g.modifier_group?.modifiers ?? []).map((mod: Modifier) => (
                <button
                  key={mod.id}
                  onClick={() => toggleMod(mod.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selected.has(mod.id)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {mod.name}
                  {Number(mod.price_delta) > 0 && ` +${formatCurrency(Number(mod.price_delta))}`}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label className="text-sm text-gray-400">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 mt-1 border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. no sauce..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-2 flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Rush Order Page ─────────────────────────────────────────────────────

export default function RushOrderPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [draft, setDraft] = useState<Map<string, DraftItem>>(new Map());
  const [modifierTarget, setModifierTarget] = useState<null | (QuickMenuItem & { menu_item: MenuItem & { modifier_groups?: { modifier_group: ModifierGroup & { modifiers: Modifier[] } }[] } })>(null);
  const [sending, setSending] = useState(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  const { data: tableData } = useQuery({
    queryKey: ["table", tableId],
    queryFn: () => fetchTableAndOrder(tableId),
  });

  const { data: quickMenu, isLoading: menuLoading } = useQuery({
    queryKey: ["quick-menu"],
    queryFn: fetchQuickMenu,
  });

  const orderId = tableData?.active_order?.id;

  function addToDraft(menuItem: MenuItem, extraModifiers?: { modifierId: string; name: string; priceDelta: number }[], note?: string) {
    setDraft((prev) => {
      const next = new Map(prev);
      const existing = next.get(menuItem.id);
      if (existing && !extraModifiers?.length && !note) {
        // Simple repeat tap — increment quantity
        next.set(menuItem.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        // New entry with modifiers or first tap
        const key = extraModifiers?.length
          ? `${menuItem.id}-${Date.now()}`
          : menuItem.id;
        next.set(key, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: Number(menuItem.price),
          quantity: 1,
          station: menuItem.station,
          modifiers: extraModifiers ?? [],
          note: note ?? "",
          color: undefined,
        });
      }
      return next;
    });
  }

  function removeFromDraft(key: string) {
    setDraft((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function adjustQty(key: string, delta: number) {
    setDraft((prev) => {
      const next = new Map(prev);
      const item = next.get(key);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) next.delete(key);
      else next.set(key, { ...item, quantity: newQty });
      return next;
    });
  }

  const draftTotal = Array.from(draft.values()).reduce(
    (sum, item) =>
      sum +
      (item.price + item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) *
        item.quantity,
    0
  );

  async function sendOrder() {
    if (!orderId || draft.size === 0) return;
    setSending(true);

    try {
      // Add items to order
      const items = Array.from(draft.values()).map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        note: item.note || undefined,
        course: 1,
        modifiers: item.modifiers.map((m) => ({
          modifierId: m.modifierId,
          priceDelta: m.priceDelta,
        })),
      }));

      const addRes = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!addRes.ok) throw new Error("Failed to add items");

      // Fire the order with idempotency key to prevent duplicate tickets on retry
      const sendRes = await fetch(`/api/orders/${orderId}/send`, {
        method: "PATCH",
        headers: { "x-idempotency-key": idempotencyKey.current },
      });

      if (!sendRes.ok) throw new Error("Failed to send order");

      toast.success("Order sent to kitchen & bar!");
      setDraft(new Map());
      idempotencyKey.current = crypto.randomUUID(); // fresh key for next order
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["table", tableId] });
      router.push(`/waiter/table/${tableId}`);
    } catch {
      toast.error("Failed to send order");
    } finally {
      setSending(false);
    }
  }

  // Grid items sorted by position
  const sortedItems = (quickMenu?.items ?? []).sort(
    (a, b) => a.grid_row * 10 + a.grid_col - (b.grid_row * 10 + b.grid_col)
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Quick Menu Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm">
            ← Back
          </button>
          <h2 className="text-lg font-bold text-white">
            Table {tableData?.number ?? "..."} — Rush Order
          </h2>
          <span className="text-xs text-gray-500">{draft.size} types</span>
        </div>

        {menuLoading ? (
          <div className="text-center text-gray-400 py-16">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {sortedItems.map((qItem) => {
              // Count all draft entries for this menu item id
              const count = Array.from(draft.values())
                .filter((d) => d.menuItemId === qItem.menu_item_id)
                .reduce((s, d) => s + d.quantity, 0);

              return (
                <QuickMenuButton
                  key={qItem.id}
                  item={qItem as QuickMenuItem & { menu_item: MenuItem }}
                  count={count}
                  onTap={() => {
                    const mi = qItem.menu_item as MenuItem & { modifier_groups?: { modifier_group?: ModifierGroup & { modifiers: Modifier[] } }[] };
                    const hasRequiredMods =
                      mi.modifier_groups?.some((g) => g.modifier_group?.required) ?? false;
                    if (hasRequiredMods) {
                      setModifierTarget(qItem as QuickMenuItem & { menu_item: MenuItem & { modifier_groups?: { modifier_group: ModifierGroup & { modifiers: Modifier[] } }[] } });
                    } else if (mi) {
                      addToDraft(mi);
                    }
                  }}
                  onLongPress={() =>
                    setModifierTarget(qItem as QuickMenuItem & { menu_item: MenuItem & { modifier_groups?: { modifier_group: ModifierGroup & { modifiers: Modifier[] } }[] } })
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Draft Basket */}
      <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <h3 className="font-bold text-white">Order</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {draft.size === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Tap product buttons to add items
            </p>
          ) : (
            Array.from(draft.entries()).map(([key, item]) => (
              <div key={key} className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    {item.modifiers.length > 0 && (
                      <p className="text-gray-400 text-xs truncate">
                        {item.modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-amber-400 text-xs">{item.note}</p>
                    )}
                  </div>
                  <span className="text-white text-xs shrink-0">
                    {formatCurrency(
                      (item.price +
                        item.modifiers.reduce((s, m) => s + m.priceDelta, 0)) *
                        item.quantity
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustQty(key, -1)}
                      className="w-8 h-8 bg-gray-700 rounded-full text-white font-bold text-lg flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-white font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => adjustQty(key, 1)}
                      className="w-8 h-8 bg-gray-700 rounded-full text-white font-bold text-lg flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromDraft(key)}
                    className="text-red-400 text-xs hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total + Send */}
        <div className="p-3 border-t border-gray-800 space-y-3">
          {draft.size > 0 && (
            <div className="flex justify-between text-white">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="font-bold">{formatCurrency(draftTotal)}</span>
            </div>
          )}
          <button
            onClick={sendOrder}
            disabled={draft.size === 0 || sending || !orderId}
            className="w-full py-4 rounded-2xl text-lg font-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {sending ? "Sending..." : "🚀 Send Order"}
          </button>
        </div>
      </div>

      {/* Modifier Sheet */}
      {modifierTarget && (
        <ModifierSheet
          item={modifierTarget}
          onAdd={(modifiers, note) => addToDraft(modifierTarget.menu_item, modifiers, note)}
          onClose={() => setModifierTarget(null)}
        />
      )}
    </div>
  );
}
