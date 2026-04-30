"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

type Tab = "overview" | "hourly" | "waiter" | "product" | "category" | "prep_time" | "voids";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "hourly", label: "By Hour" },
  { key: "waiter", label: "By Waiter" },
  { key: "product", label: "Top Products" },
  { key: "category", label: "By Category" },
  { key: "prep_time", label: "Prep Times" },
  { key: "voids", label: "Voids" },
];

function fetchReport(type: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ type, ...params }).toString();
  return fetch(`/api/reports?${qs}`).then((r) => r.json()).then((j) => j.data);
}

function fmtSeconds(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function BarRow({ label, value, max, fmt }: { label: string; value: number; max: number; fmt: (v: number) => string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-gray-600 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className="h-5 bg-blue-500 rounded-full flex items-center justify-end pr-2 transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          <span className="text-xs text-white font-medium">{pct > 20 ? fmt(value) : ""}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-gray-800 w-20 text-right shrink-0">{fmt(value)}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState("7");

  const overviewQ = useQuery({
    queryKey: ["reports", "daily", days],
    queryFn: () => fetchReport("daily", { days }),
    enabled: tab === "overview",
    refetchInterval: 30_000,
  });

  const hourlyQ = useQuery({
    queryKey: ["reports", "hourly", date],
    queryFn: () => fetchReport("hourly", { date }),
    enabled: tab === "hourly",
  });

  const waiterQ = useQuery({
    queryKey: ["reports", "waiter", days],
    queryFn: () => fetchReport("waiter", { days }),
    enabled: tab === "waiter",
  });

  const productQ = useQuery({
    queryKey: ["reports", "product", days],
    queryFn: () => fetchReport("product", { days }),
    enabled: tab === "product",
  });

  const categoryQ = useQuery({
    queryKey: ["reports", "category", days],
    queryFn: () => fetchReport("category", { days }),
    enabled: tab === "category",
  });

  const prepQ = useQuery({
    queryKey: ["reports", "prep_time", days],
    queryFn: () => fetchReport("prep_time", { days }),
    enabled: tab === "prep_time",
  });

  const voidsQ = useQuery({
    queryKey: ["reports", "voids", days],
    queryFn: () => fetchReport("voids", { days }),
    enabled: tab === "voids",
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Precise analytics for your restaurant</p>
        </div>
        <div className="flex items-center gap-3">
          {tab === "hourly" ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          ) : (
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (() => {
        const d = overviewQ.data;
        const rows: { date: string; revenue: number; orders: number; avg_order_value: number }[] = d?.rows ?? [];
        const total = d?.total ?? 0;
        const maxRev = Math.max(...rows.map((r) => r.revenue), 1);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-black text-gray-900">{formatCurrency(total)}</p>
                <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-3xl font-black text-gray-900">{rows.reduce((s, r) => s + r.orders, 0)}</p>
                <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <p className="text-sm text-gray-500">Avg per Payment</p>
                <p className="text-3xl font-black text-gray-900">
                  {formatCurrency(rows.reduce((s, r) => s + r.avg_order_value, 0) / Math.max(rows.filter((r) => r.avg_order_value > 0).length, 1))}
                </p>
                <p className="text-xs text-gray-400 mt-1">Across all days</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Daily Revenue</h3>
              <div className="space-y-3">
                {rows.map((r) => (
                  <BarRow key={r.date} label={r.date} value={r.revenue} max={maxRev} fmt={formatCurrency} />
                ))}
                {rows.length === 0 && <p className="text-gray-400 text-sm">No data yet.</p>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── HOURLY ── */}
      {tab === "hourly" && (() => {
        const rows: { hour: number; revenue: number; orders: number }[] = hourlyQ.data?.rows ?? [];
        const maxRev = Math.max(...rows.map((r) => r.revenue), 1);
        const activeRows = rows.filter((r) => r.revenue > 0 || r.orders > 0);

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Revenue by Hour — {date}</h3>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.hour} className="flex items-center gap-3">
                  <span className="w-14 text-sm text-gray-500 shrink-0">
                    {String(r.hour).padStart(2, "0")}:00
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 bg-indigo-500 rounded-full"
                      style={{ width: `${Math.max(r.revenue > 0 ? (r.revenue / maxRev) * 100 : 0, 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-24 text-right shrink-0">
                    {r.revenue > 0 ? formatCurrency(r.revenue) : "—"}
                  </span>
                  <span className="text-xs text-gray-400 w-14 text-right shrink-0">
                    {r.orders > 0 ? `${r.orders} orders` : ""}
                  </span>
                </div>
              ))}
              {activeRows.length === 0 && <p className="text-gray-400 text-sm">No payments on this date.</p>}
            </div>
          </div>
        );
      })()}

      {/* ── WAITER ── */}
      {tab === "waiter" && (() => {
        const rows: { waiterId: string; name: string; orders: number; revenue: number; avg_order_value: number }[] = waiterQ.data?.rows ?? [];

        return (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Sales by Waiter</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Waiter</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Orders</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Avg / Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.waiterId} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{r.orders}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(r.revenue)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{formatCurrency(r.avg_order_value)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">No data for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ── PRODUCT ── */}
      {tab === "product" && (() => {
        const rows: { menuItemId: string; name: string; quantity: number; revenue: number }[] = productQ.data?.rows ?? [];
        const maxRev = Math.max(...rows.map((r) => r.revenue), 1);

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Top Products by Revenue</h3>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={r.menuItemId} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-gray-400 text-right shrink-0">{i + 1}</span>
                  <span className="w-40 text-sm text-gray-700 truncate shrink-0">{r.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 bg-emerald-500 rounded-full"
                      style={{ width: `${Math.max((r.revenue / maxRev) * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right shrink-0">{r.quantity}×</span>
                  <span className="text-sm font-semibold text-gray-900 w-24 text-right shrink-0">{formatCurrency(r.revenue)}</span>
                </div>
              ))}
              {rows.length === 0 && <p className="text-gray-400 text-sm">No data for this period.</p>}
            </div>
          </div>
        );
      })()}

      {/* ── CATEGORY ── */}
      {tab === "category" && (() => {
        const rows: { categoryId: string; name: string; quantity: number; revenue: number }[] = categoryQ.data?.rows ?? [];
        const maxRev = Math.max(...rows.map((r) => r.revenue), 1);

        return (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Sales by Category</h3>
            <div className="space-y-3">
              {rows.map((r) => (
                <BarRow key={r.categoryId} label={r.name} value={r.revenue} max={maxRev} fmt={formatCurrency} />
              ))}
              {rows.length === 0 && <p className="text-gray-400 text-sm">No data for this period.</p>}
            </div>
          </div>
        );
      })()}

      {/* ── PREP TIME ── */}
      {tab === "prep_time" && (() => {
        const rows: { station: string; count: number; avg_seconds: number; min_seconds: number; max_seconds: number }[] = prepQ.data?.rows ?? [];

        return (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">KDS Prep Times</h3>
              <p className="text-xs text-gray-400 mt-0.5">Time from ticket created to all items done</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Station</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Tickets</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Avg</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Min</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Max</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.station} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="px-5 py-3 font-medium text-gray-800">{r.station}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{r.count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmtSeconds(r.avg_seconds)}</td>
                    <td className="px-5 py-3 text-right text-emerald-600">{fmtSeconds(r.min_seconds)}</td>
                    <td className="px-5 py-3 text-right text-red-500">{fmtSeconds(r.max_seconds)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No completed tickets in this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ── VOIDS ── */}
      {tab === "voids" && (() => {
        const rows: { at: string; voided_by: string; quantity: number; unit_price: number; reason: string; orderId: string }[] = voidsQ.data?.rows ?? [];

        return (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">Void / Comp Log</h3>
              <p className="text-xs text-gray-400 mt-0.5">{rows.length} void{rows.length !== 1 ? "s" : ""} in this period</p>
            </div>
            {rows.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400">No voids in this period. Great job!</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Time</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Qty</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Value</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Reason</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(r.at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">{r.quantity}</td>
                      <td className="px-5 py-3 text-right text-red-600 font-medium">
                        -{formatCurrency(r.unit_price * r.quantity)}
                      </td>
                      <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{r.reason}</td>
                      <td className="px-5 py-3 text-gray-500">{r.voided_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}
    </div>
  );
}
