import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CurrencyCode } from "@/lib/finance/types";
import { CURRENCIES } from "@/lib/finance/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Format money with exactly 2 decimal places and selected currency.
 * Example: 1234.5 → "1 234,50 ₽"
 */
export function formatMoney(
  amount: number,
  currency: CurrencyCode = "RUB",
  digits = 2,
): string {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(n);
  } catch {
    // Fallback if currency code is unknown to Intl
    const sym = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
    const formatted = new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(n);
    return `${formatted} ${sym}`;
  }
}

/** @deprecated Use formatMoney(amount, currency) */
export function formatRub(amount: number, digits = 2): string {
  return formatMoney(amount, "RUB", digits);
}

export function formatDateRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDayShort(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function currencySymbol(code: CurrencyCode = "RUB"): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
