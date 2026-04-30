"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatTime } from "@/lib/utils";

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  OPEN:            { color: "bg-gray-700 text-gray-300", label: "Open" },
  SENT:            { color: "bg-blue-700 text-blue-100", label: "Sent" },
  PARTIALLY_READY: { color: "bg-amber-700 text-amber-100", label: "Partial" },
  READY:           { color: "bg-emerald-700 text-emerald-100", label: "Ready" },
  SERVED:          { color: "bg-teal-700 text-teal-100", label: "Served" },
  CLOSED:          { color: "bg-gray-800 text-gray-400", label: "Closed" },
  VOIDED:          { color: "bg-red-900 text-red-300", label: "Voided" },
};

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  const json = await res.json();
  return json.data as {
    openTables: number;
    ordersInFlight: number;
    revenueToday: number;
    methodSplit: Record<string, number>;
    readyItemsAtPass: number;
    recentOrders: Array<{
      id: string;
      status: string;
      created_at: string;
      table: { number: string };
      waiter: { name: string };
    }>;
  };
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${color ?? "bg-white"}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Live Dashboard</h1>
        <p className="text-gray-500 text-sm">Auto-refreshes every 10 seconds</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Open Tables"
          value={data.openTables}
          color="bg-amber-50"
        />
        <StatCard
          label="Orders in Flight"
          value={data.ordersInFlight}
          color="bg-blue-50"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(data.revenueToday)}
          color="bg-emerald-50"
        />
        <StatCard
          label="Ready at Pass"
          value={data.readyItemsAtPass}
          sub="items waiting for pickup"
          color={data.readyItemsAtPass > 0 ? "bg-orange-50" : "bg-gray-50"}
        />
      </div>

      {/* Payment Split */}
      {Object.keys(data.methodSplit).length > 0 && (
        <div className="bg-white rounded-2xl p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Payment Split (Today)
          </h2>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(data.methodSplit).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">{method}:</span>
                <span className="font-bold text-gray-900">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Recent Orders
        </h2>
        <div className="space-y-2">
          {data.recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders today</p>
          ) : (
            data.recentOrders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.OPEN;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-semibold">
                      Table {order.table?.number}
                    </span>
                    <span className="text-gray-500 text-sm">{order.waiter?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs">
                      {formatTime(order.created_at)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
