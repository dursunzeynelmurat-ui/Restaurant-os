"use client";
import { signOut } from "next-auth/react";
import { LogOut, UtensilsCrossed } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  WAITER: "Waiter Station",
  KITCHEN: "Kitchen Display",
  BAR: "Bar Display",
  RUNNER: "Pass / Expo",
  CASHIER: "Cashier",
  OWNER: "Manager View",
  MANAGER: "Manager View",
};

export default function TabletHeader({
  user,
}: {
  user: { name?: string | null; role: string };
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="h-5 w-5 text-amber-400" />
        <span className="font-semibold text-white">
          {ROLE_LABELS[user.role] ?? "Restaurant OS"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{user.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
