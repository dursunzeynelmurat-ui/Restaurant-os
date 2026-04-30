"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROLE_HOME } from "@/lib/permissions";
import type { UserRole } from "@/types";

const BRANCH_ID = "branch_main";

const TABLET_ROLES = [
  { role: "WAITER" as UserRole, label: "Waiter", icon: "🍽️", pin: "" },
  { role: "KITCHEN" as UserRole, label: "Kitchen", icon: "👨‍🍳", pin: "" },
  { role: "BAR" as UserRole, label: "Bar", icon: "🍺", pin: "" },
  { role: "RUNNER" as UserRole, label: "Runner", icon: "🏃", pin: "" },
  { role: "CASHIER" as UserRole, label: "Cashier", icon: "💳", pin: "" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"web" | "pin">("web");
  const [pinInput, setPinInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleWebLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("email-password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid credentials");
      } else {
        // Fetch session to get role for redirect
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const home = ROLE_HOME[session?.user?.role as UserRole] ?? "/dashboard";
        router.push(home);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePinLogin(digit: string) {
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      setLoading(true);
      try {
        const result = await signIn("pin", {
          pin: next,
          branchId: BRANCH_ID,
          redirect: false,
        });
        if (result?.error) {
          toast.error("Invalid PIN");
          setPinInput("");
        } else {
          const res = await fetch("/api/auth/session");
          const session = await res.json();
          const home =
            ROLE_HOME[session?.user?.role as UserRole] ?? "/waiter";
          router.push(home);
          router.refresh();
        }
      } finally {
        setLoading(false);
        setPinInput("");
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            🍋 Lemon Garden
          </h1>
          <p className="text-gray-400 mt-2">Restaurant Operating System</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex rounded-lg overflow-hidden mb-6 border border-gray-700">
          <button
            onClick={() => setMode("web")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "web"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Manager / Owner
          </button>
          <button
            onClick={() => setMode("pin")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === "pin"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Staff PIN
          </button>
        </div>

        {mode === "web" ? (
          <form onSubmit={handleWebLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="owner@lemongarden.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="demo1234"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <p className="text-center text-xs text-gray-500">
              Demo: owner@lemongarden.com / demo1234
            </p>
          </form>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="mb-4">
              <p className="text-gray-400 text-sm text-center mb-3">
                Enter your 4-digit PIN
              </p>
              <div className="flex justify-center gap-3 mb-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-colors ${
                      i < pinInput.length
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-600 text-transparent"
                    }`}
                  >
                    •
                  </div>
                ))}
              </div>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
                (d, i) => (
                  <button
                    key={i}
                    disabled={loading || d === ""}
                    onClick={() => {
                      if (d === "⌫")
                        setPinInput((p) => p.slice(0, -1));
                      else if (d !== "") handlePinLogin(d);
                    }}
                    className={`h-16 rounded-xl text-xl font-bold transition-all ${
                      d === ""
                        ? "invisible"
                        : d === "⌫"
                        ? "bg-gray-700 text-red-400 hover:bg-gray-600 active:scale-95"
                        : "bg-gray-700 text-white hover:bg-gray-600 active:scale-95"
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Waiter: 1234 · Kitchen: 2345 · Bar: 3456 · Runner: 4567 · Cashier: 5678
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
