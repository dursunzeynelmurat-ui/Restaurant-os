import { UserRole } from "@/types";

export const ROLE_HOME: Record<UserRole, string> = {
  OWNER: "/dashboard",
  MANAGER: "/dashboard",
  WAITER: "/waiter",
  KITCHEN: "/kitchen",
  BAR: "/bar",
  RUNNER: "/pass",
  CASHIER: "/cashier",
};

export const ROLE_ALLOWED_PATHS: Record<UserRole, string[]> = {
  OWNER: ["/dashboard", "/reports", "/waiter", "/kitchen", "/bar", "/pass", "/cashier"],
  MANAGER: ["/dashboard", "/reports", "/waiter", "/kitchen", "/bar", "/pass", "/cashier"],
  WAITER: ["/waiter"],
  KITCHEN: ["/kitchen"],
  BAR: ["/bar"],
  RUNNER: ["/pass"],
  CASHIER: ["/cashier"],
};

export function canAccess(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_PATHS[role] ?? [];
  return allowed.some((p) => pathname.startsWith(p));
}
