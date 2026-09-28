import { useQuery } from "@tanstack/react-query";
import type { CurrencyCode } from "./types";

/** Fiat codes we care about for FinTracker users */
export const MARKET_FIAT: CurrencyCode[] = [
  "RUB",
  "USD",
  "EUR",
  "GBP",
  "CNY",
  "KZT",
  "BYN",
  "UAH",
];

export type CryptoId = "bitcoin" | "ethereum" | "toncoin" | "solana" | "tether";

export const CRYPTO_META: {
  id: CryptoId;
  symbol: string;
  name: string;
}[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "toncoin", symbol: "TON", name: "Toncoin" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "tether", symbol: "USDT", name: "Tether" },
];

export type FiatRate = {
  code: string;
  rate: number; // 1 base = rate quote
};

export type CryptoQuote = {
  id: CryptoId;
  symbol: string;
  name: string;
  usd: number;
  rub: number;
  change24hUsd: number | null;
  change24hRub: number | null;
};

export type MarketSnapshot = {
  base: string;
  fetchedAt: string;
  fxUpdatedAt: string | null;
  fiat: FiatRate[];
  /** How many units of each currency for 1 unit of `base` */
  againstBase: FiatRate[];
  crypto: CryptoQuote[];
  sources: { name: string; url: string }[];
};

const FX_URL = "https://open.er-api.com/v6/latest/USD";
const CG_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,toncoin,solana,tether&vs_currencies=usd,rub&include_24hr_change=true";

async function fetchJson<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

type ErApiResponse = {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

type CgResponse = Record<
  string,
  {
    usd?: number;
    rub?: number;
    usd_24h_change?: number;
    rub_24h_change?: number;
  }
>;

/**
 * Fetch live FX (open.er-api, free, no key) + crypto (CoinGecko).
 * All quotes normalized so UI can show 1 BASE → X foreign.
 */
export async function fetchMarketSnapshot(
  base: CurrencyCode = "RUB",
): Promise<MarketSnapshot> {
  const [fxSettled, cgSettled] = await Promise.allSettled([
    fetchJson<ErApiResponse>(FX_URL),
    fetchJson<CgResponse>(CG_URL),
  ]);

  const fx = fxSettled.status === "fulfilled" ? fxSettled.value : null;
  const cg = cgSettled.status === "fulfilled" ? cgSettled.value : null;

  const usdRates = fx?.rates ?? {};
  // open.er-api: rates are "1 USD = X currency"
  const usdToBase = base === "USD" ? 1 : usdRates[base];
  if (usdToBase == null || !Number.isFinite(usdToBase) || usdToBase <= 0) {
    // Fallback if base missing — still show USD-centric table
  }

  const fiatCodes = MARKET_FIAT.filter((c) => c !== base);
  const againstBase: FiatRate[] = [];
  for (const code of fiatCodes) {
    const usdToCode = code === "USD" ? 1 : usdRates[code];
    if (usdToCode == null || usdToBase == null || usdToBase <= 0) continue;
    // 1 base = (usdToCode / usdToBase) code
    againstBase.push({ code, rate: usdToCode / usdToBase });
  }

  // Also keep raw USD table for reference
  const fiat: FiatRate[] = MARKET_FIAT.filter((c) => c !== "USD")
    .map((code) => ({ code, rate: usdRates[code] ?? NaN }))
    .filter((r) => Number.isFinite(r.rate));

  const crypto: CryptoQuote[] = CRYPTO_META.map((m) => {
    const row = cg?.[m.id];
    return {
      id: m.id,
      symbol: m.symbol,
      name: m.name,
      usd: row?.usd ?? NaN,
      rub: row?.rub ?? NaN,
      change24hUsd:
        row?.usd_24h_change != null && Number.isFinite(row.usd_24h_change)
          ? row.usd_24h_change
          : null,
      change24hRub:
        row?.rub_24h_change != null && Number.isFinite(row.rub_24h_change)
          ? row.rub_24h_change
          : null,
    };
  }).filter((c) => Number.isFinite(c.usd) || Number.isFinite(c.rub));

  return {
    base,
    fetchedAt: new Date().toISOString(),
    fxUpdatedAt: fx?.time_last_update_utc ?? null,
    fiat,
    againstBase,
    crypto,
    sources: [
      { name: "ExchangeRate-API", url: "https://www.exchangerate-api.com" },
      { name: "CoinGecko", url: "https://www.coingecko.com" },
    ],
  };
}

const STALE_MS = 5 * 60_000;

export function useMarkets(base: CurrencyCode = "RUB") {
  return useQuery({
    queryKey: ["markets", base],
    queryFn: () => fetchMarketSnapshot(base),
    staleTime: STALE_MS,
    refetchInterval: STALE_MS,
    retry: 1,
  });
}

export function formatRate(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) {
    return n.toLocaleString("ru-RU", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }
  if (n >= 1) {
    return n.toLocaleString("ru-RU", {
      maximumFractionDigits: Math.min(4, digits),
      minimumFractionDigits: 2,
    });
  }
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  });
}

export function formatPct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
