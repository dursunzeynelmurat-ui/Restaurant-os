import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export function elapsedDisplay(dateStr: string): string {
  const totalSecs = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function orderItemTotal(
  unitPrice: number,
  quantity: number,
  modifierDeltas: number[]
): number {
  const modTotal = modifierDeltas.reduce((acc, d) => acc + d, 0);
  return (unitPrice + modTotal) * quantity;
}
