import { createServerFn } from "@tanstack/react-start";
import { env } from "@/lib/env.server";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  summary: string | null;
  publishedAt: string | null;
  image: string | null;
  origin: "finnhub" | "rss";
};

export type NewsSnapshot = {
  items: NewsItem[];
  fetchedAt: string;
  providers: string[];
  errors: string[];
};

const RSS_FEEDS: { source: string; url: string }[] = [
  {
    source: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  {
    source: "BBC Russian",
    url: "https://feeds.bbci.co.uk/russian/rss.xml",
  },
];

async function fetchText(url: string, timeoutMs = 12_000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/json",
        "User-Agent": "FinTracker/1.0 (market-news)",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(block: string, re: RegExp): string | null {
  const m = block.match(re);
  if (!m) return null;
  const raw = (m[1] ?? m[2] ?? "").trim();
  return raw ? stripTags(raw) : null;
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const parts = xml.split(/<item[\s>]/i).slice(1);
  for (const block of parts.slice(0, 10)) {
    const title = firstMatch(
      block,
      /<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/title>/i,
    );
    const link = firstMatch(block, /<link[^>]*>([^<]*)<\/link>/i);
    const pub = firstMatch(block, /<pubDate[^>]*>([^<]*)<\/pubDate>/i);
    const desc = firstMatch(
      block,
      /<description[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/description>/i,
    );
    if (!title || !link) continue;
    const id = `rss:${source}:${link}`;
    items.push({
      id,
      title,
      link,
      source,
      summary: desc ? desc.slice(0, 220) : null,
      publishedAt: pub,
      image: null,
      origin: "rss",
    });
  }
  return items;
}

type FinnhubNewsRow = {
  id?: number;
  headline?: string;
  summary?: string;
  source?: string;
  url?: string;
  image?: string;
  datetime?: number;
  category?: string;
};

async function fetchFinnhub(apiKey: string): Promise<NewsItem[]> {
  const url = `https://finnhub.io/api/v1/news?category=general&token=${encodeURIComponent(apiKey)}`;
  const text = await fetchText(url);
  const rows = JSON.parse(text) as FinnhubNewsRow[];
  if (!Array.isArray(rows)) throw new Error("Finnhub: unexpected payload");
  return rows.slice(0, 20).map((r, i) => {
    const title = (r.headline || "").trim();
    const link = (r.url || "").trim();
    const publishedAt =
      typeof r.datetime === "number"
        ? new Date(r.datetime * 1000).toISOString()
        : null;
    return {
      id: `fh:${r.id ?? i}:${link || title}`,
      title: title || "Без заголовка",
      link: link || "#",
      source: (r.source || "Finnhub").trim(),
      summary: r.summary ? stripTags(r.summary).slice(0, 220) : null,
      publishedAt,
      image: r.image || null,
      origin: "finnhub" as const,
    };
  }).filter((n) => n.title && n.link && n.link !== "#");
}

async function fetchAllRss(): Promise<{ items: NewsItem[]; errors: string[] }> {
  const errors: string[] = [];
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(async (f) => {
      const xml = await fetchText(f.url);
      return parseRss(xml, f.source);
    }),
  );
  const items: NewsItem[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(...r.value);
    else
      errors.push(
        `${RSS_FEEDS[i].source}: ${r.reason instanceof Error ? r.reason.message : "fail"}`,
      );
  });
  return { items, errors };
}

function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const it of items) {
    const key = it.link || it.title;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * Server-only news aggregator:
 * 1) Finnhub general news if FINNHUB_API_KEY is set
 * 2) RSS fallbacks (CoinDesk, BBC Russian)
 */
export const fetchNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsSnapshot> => {
    const providers: string[] = [];
    const errors: string[] = [];
    const collected: NewsItem[] = [];

    const apiKey = env("FINNHUB_API_KEY");
    if (apiKey) {
      try {
        const fh = await fetchFinnhub(apiKey);
        collected.push(...fh);
        providers.push("Finnhub");
      } catch (e) {
        errors.push(
          `Finnhub: ${e instanceof Error ? e.message : "request failed"}`,
        );
      }
    }

    try {
      const { items, errors: rssErrors } = await fetchAllRss();
      collected.push(...items);
      errors.push(...rssErrors);
      if (items.some((i) => i.source === "CoinDesk")) providers.push("CoinDesk RSS");
      if (items.some((i) => i.source === "BBC Russian"))
        providers.push("BBC Russian RSS");
    } catch (e) {
      errors.push(`RSS: ${e instanceof Error ? e.message : "fail"}`);
    }

    // Prefer Finnhub first, then RSS; cap list
    const items = dedupe(collected).slice(0, 18);

    return {
      items,
      fetchedAt: new Date().toISOString(),
      providers: [...new Set(providers)],
      errors,
    };
  },
);
