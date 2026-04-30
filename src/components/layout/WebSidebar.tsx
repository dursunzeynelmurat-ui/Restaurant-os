"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  LogOut,
  UtensilsCrossed,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/pricing", icon: CreditCard, label: "Subscription" },
];

export default function WebSidebar({
  user,
}: {
  user: { name?: string | null; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-amber-400" />
          <span className="font-bold text-lg">Restaurant OS</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <div className="px-3 py-2 text-xs text-gray-500">
          <p className="font-medium text-gray-300">{user.name}</p>
          <p>{user.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
