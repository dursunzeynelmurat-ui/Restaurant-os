"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  return res.json().then((j) => j.data);
}

export default function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Reports</h1>
      <p className="text-gray-500 text-sm mb-6">Today&apos;s snapshot</p>

      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Revenue Today</p>
            <p className="text-2xl font-black text-gray-900">
              {data ? formatCurrency(data.revenueToday) : "—"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Orders in Flight</p>
            <p className="text-2xl font-black text-gray-900">
              {data?.ordersInFlight ?? "—"}
            </p>
          </div>
        </div>

        {data?.methodSplit && Object.keys(data.methodSplit).length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Payment Methods</h3>
            <div className="space-y-1">
              {Object.entries(data.methodSplit as Record<string, number>).map(
                ([method, amount]) => (
                  <div key={method} className="flex justify-between py-1">
                    <span className="text-gray-600">{method}</span>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-400 pt-2">
          Full reports — sales by waiter, product, category, shift — are on the roadmap.
        </p>
      </div>
    </div>
  );
}
