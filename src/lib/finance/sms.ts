/**
 * SMS transaction parser.
 * Supports:
 *  - Belarus bank style (Prior/Belarusbank etc.):
 *    "Karta 4***3597 26-09-26 12:04:40. Oplata 21.80 BYN. BLR SHOP SOSEDI. Balance: 555.88 BYN Tel. 7299090"
 *    "Karta 4***3597 26-09-26 09:36:39. Oplata 1.99 USD. USA GOOGLE *G1SK002M. Balance: 577.68 BYN Tel. 7299090"
 *  - Russian bank style:
 *    "Покупка 1250.00 RUB Пятёрочка", "Оплата 500 ₽ ...", "Списание ..."
 *  - Mixed multi-line paste
 */

const CURRENCIES =
  "BYN|USD|EUR|RUB|RUR|GBP|UAH|KZT|CNY|PLN|CZK|CHF|TRY|JPY|SEK|NOK|DKK|AED|GEL|AMD|AZN";

/** Belarus-style: Oplata / Pokupka / Spisanie / Zachislenie + amount + currency */
const BY_OP_RE = new RegExp(
  `(оплата|покупка|списание|зачисление|oplata|pokupka|spisanie|zachislenie)\\s+(\\d+[.,]\\d{1,2}|\\d+)\\s*(${CURRENCIES})\\b`,
  "i",
);

/** Russian-style: keyword + amount + RUB/₽ (currency optional after amount) */
const RU_OP_RE = new RegExp(
  `(оплата|покупка|списание|зачисление).{0,40}?(\\d+[.,]?\\d*)\\s*(${CURRENCIES}|₽)?`,
  "i",
);

/** Date: DD-MM-YY, DD.MM.YYYY, DD/MM/YY, optionally with time */
const DATE_RE =
  /(\d{2})[.\-/](\d{2})[.\-/](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/;

/** Card mask e.g. 4***3597 or *3597 */
const CARD_RE = /(?:karta|карта)\s*[\d*]+/i;

/** Balance / Tel trailer to strip from description */
const TRAILER_RE =
  /\b(?:balance|остаток|доступно)[:\s].*$/i;

export type ParsedSms = {
  amount: number;
  description: string;
  date: string;
  /** Original currency from SMS if detected */
  currency?: string;
  /** expense | income */
  type?: "expense" | "income";
};

function normalizeAmount(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."));
}

function parseDate(match: RegExpMatchArray | null, today: string): string {
  if (!match) return today;
  const dd = match[1];
  const mm = match[2];
  let yyyy = match[3];
  if (yyyy.length === 2) {
    const yy = Number.parseInt(yyyy, 10);
    // 00–69 → 2000–2069, 70–99 → 1970–1999
    yyyy = yy >= 70 ? `19${yyyy}` : `20${yyyy}`;
  }
  // Basic sanity
  const d = Number.parseInt(dd, 10);
  const m = Number.parseInt(mm, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12) return today;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

function isIncomeKeyword(kw: string): boolean {
  const k = kw.toLowerCase();
  return k.includes("зачисл") || k.includes("zachisl");
}

function cleanDescription(
  line: string,
  amountStr: string,
  currency: string | undefined,
  dateMatch: RegExpMatchArray | null,
): string {
  let desc = line;

  // Drop card prefix
  desc = desc.replace(CARD_RE, " ");

  // Drop full datetime if present
  if (dateMatch) {
    desc = desc.replace(dateMatch[0], " ");
  } else {
    desc = desc.replace(/\d{2}[.\-/]\d{2}[.\-/]\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/g, " ");
  }

  // Drop operation keyword + amount + currency
  const amountPattern = amountStr.replace(".", "[.,]");
  desc = desc.replace(
    new RegExp(
      `(оплата|покупка|списание|зачисление|oplata|pokupka|spisanie|zachislenie)\\s*${amountPattern}\\s*(${CURRENCIES}|₽)?\\.?`,
      "ig",
    ),
    " ",
  );

  // Drop balance / tel trailer
  desc = desc.replace(TRAILER_RE, " ");
  desc = desc.replace(/\bTel\.?\s*\d+\b/gi, " ");
  desc = desc.replace(/\bтел\.?\s*\d+\b/gi, " ");

  // Drop leftover currency codes and punctuation noise
  desc = desc
    .replace(new RegExp(`\\b(${CURRENCIES})\\b`, "gi"), " ")
    .replace(/[.]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:]+|[\s.,;:]+$/g, "")
    .trim();

  // If foreign currency, keep it visible in description
  if (currency && !/^(BYN|RUB|RUR)$/i.test(currency)) {
    const suffix = ` (${amountStr} ${currency})`;
    if (!desc.toLowerCase().includes(currency.toLowerCase())) {
      desc = (desc || "Операция по SMS") + suffix;
    }
  }

  return (desc || "Операция по SMS").slice(0, 120);
}

function parseOneLine(line: string, today: string): ParsedSms | null {
  // Prefer Belarus-style match (explicit currency after amount)
  let m = line.match(BY_OP_RE);
  let amountStr: string | undefined;
  let currency: string | undefined;
  let keyword: string | undefined;

  if (m) {
    keyword = m[1];
    amountStr = m[2];
    currency = (m[3] || "").toUpperCase().replace("RUR", "RUB");
  } else {
    m = line.match(RU_OP_RE);
    if (!m) return null;
    keyword = m[1];
    amountStr = m[2];
    currency = (m[3] || "RUB").toUpperCase().replace("₽", "RUB").replace("RUR", "RUB");
  }

  const amount = normalizeAmount(amountStr!);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const dateMatch = line.match(DATE_RE);
  const date = parseDate(dateMatch, today);
  const type: "expense" | "income" = isIncomeKeyword(keyword!) ? "income" : "expense";
  const description = cleanDescription(line, amountStr!, currency, dateMatch);

  return { amount, description, date, currency, type };
}

/**
 * Split pasted text into candidate SMS messages.
 * Belarus SMS are usually one message per line; also split on double newlines.
 */
function splitMessages(text: string): string[] {
  // Normalize: treat sequences of blank lines as separators
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const lines: string[] = [];
  for (const block of blocks) {
    // If block has multiple lines that each look like a full SMS (contain "Oplata"/"Karta"), split them
    const sub = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (sub.length > 1 && sub.filter((l) => /oplata|karta|оплата|покупка/i.test(l)).length > 1) {
      lines.push(...sub);
    } else {
      // Join multi-line single SMS into one string
      lines.push(sub.join(" "));
    }
  }
  return lines;
}

export function parseSmsText(text: string, today: string): ParsedSms[] {
  if (!text || !text.trim()) return [];

  const messages = splitMessages(text);
  const out: ParsedSms[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    const parsed = parseOneLine(msg, today);
    if (!parsed) continue;

    // Deduplicate identical amount+date+description within one paste
    const key = `${parsed.date}|${parsed.amount}|${parsed.description}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(parsed);
  }

  return out;
}

export function matchRule(
  description: string,
  rules: { pattern: string; categoryId: number | null; envelopeId: number | null }[],
): { categoryId: number | null; envelopeId: number | null } {
  const hay = description.toLowerCase();
  const sorted = [...rules].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const r of sorted) {
    if (r.pattern && hay.includes(r.pattern.toLowerCase())) {
      return { categoryId: r.categoryId, envelopeId: r.envelopeId };
    }
  }
  return { categoryId: null, envelopeId: null };
}
