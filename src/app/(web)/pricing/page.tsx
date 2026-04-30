"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_tables: number | null;
  max_users: number | null;
  features: Record<string, boolean>;
}

interface Subscription {
  id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  plan: Plan;
}

async function fetchSubscription() {
  const res = await fetch("/api/subscription");
  if (!res.ok) throw new Error("Failed to load plans");
  return res.json().then((j) => j.data as { plans: Plan[]; current: Subscription | null });
}

const FEATURE_LABELS: Record<string, string> = {
  basic_kds: "Kitchen Display System",
  reports: "Sales Reports",
  multi_station: "Multiple Stations",
  advanced_reports: "Advanced Analytics",
  prep_time_analytics: "Prep Time Analytics",
  void_log: "Void / Comp Log",
  multi_branch: "Multi-Branch Support",
  api_access: "API Access",
  dedicated_support: "Dedicated Support",
  sla_99_9: "99.9% SLA",
  custom_integrations: "Custom Integrations",
  white_label: "White-Label Option",
};

const PLAN_COLORS: Record<string, string> = {
  Basic: "border-gray-200",
  Premium: "border-blue-500 ring-2 ring-blue-500",
  Enterprise: "border-gray-800",
};

const PLAN_BADGE: Record<string, string> = {
  Basic: "",
  Premium: "Most Popular",
  Enterprise: "Best Value",
};

export default function PricingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-400">Loading plans...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          Failed to load subscription plans.
        </div>
      </div>
    );
  }

  const { plans, current } = data;
  const currentPlanId = current?.plan?.id;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Subscription Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose the right plan for your restaurant
        </p>
      </div>

      {/* Current subscription banner */}
      {current && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900">
              Current plan: <span className="text-blue-700">{current.plan.name}</span>
            </p>
            <p className="text-sm text-blue-600">
              {current.status === "TRIALING" && current.trial_ends_at
                ? `Trial ends ${new Date(current.trial_ends_at).toLocaleDateString()}`
                : current.status === "ACTIVE" && current.current_period_end
                ? `Renews ${new Date(current.current_period_end).toLocaleDateString()}`
                : `Status: ${current.status}`}
            </p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
            {current.status}
          </span>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const features = plan.features ?? {};

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 p-6 flex flex-col relative ${
                PLAN_COLORS[plan.name] ?? "border-gray-200"
              }`}
            >
              {PLAN_BADGE[plan.name] && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {PLAN_BADGE[plan.name]}
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
                <div className="mt-2">
                  <span className="text-4xl font-black text-gray-900">
                    {formatCurrency(plan.price_monthly)}
                  </span>
                  <span className="text-gray-400 text-sm">/mo</span>
                </div>
              </div>

              <div className="space-y-1 text-sm mb-4">
                <div className="text-gray-500">
                  {plan.max_tables ? `Up to ${plan.max_tables} tables` : "Unlimited tables"}
                </div>
                <div className="text-gray-500">
                  {plan.max_users ? `Up to ${plan.max_users} staff` : "Unlimited staff"}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                  const included = features[key] === true;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {included ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-200 shrink-0" />
                      )}
                      <span className={included ? "text-gray-700" : "text-gray-300"}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6">
                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-center text-sm">
                    ✓ Current Plan
                  </div>
                ) : plan.name === "Enterprise" ? (
                  <button
                    onClick={() => toast.info("Contact us at sales@restaurant-os.com for Enterprise pricing.")}
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-bold text-sm transition-colors"
                  >
                    Contact Sales
                  </button>
                ) : (
                  <button
                    onClick={() => toast.info("Billing integration coming soon. Contact support to upgrade.")}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
                  >
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison footer */}
      <div className="bg-gray-50 rounded-2xl p-6 text-sm text-gray-500 space-y-1">
        <p className="font-medium text-gray-700 mb-2">All plans include</p>
        <p>✓ Unlimited orders per day</p>
        <p>✓ Kitchen Display System (KDS)</p>
        <p>✓ Rush Order Mode</p>
        <p>✓ Pass/Expo screen</p>
        <p>✓ Cashier & payments</p>
        <p>✓ 99% uptime SLA</p>
        <p className="pt-2 text-xs">
          Prices shown in USD. Billed monthly. Annual billing available — contact sales.
        </p>
      </div>
    </div>
  );
}
