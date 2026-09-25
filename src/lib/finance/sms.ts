const LINE_RE =
  /(оплата|покупка|списание).{0,24}?(\d+[.,]?\d*)\s*(RUB|RUR|₽)/i;

export type ParsedSms = {
  amount: number;
  description: string;
  date: string;
};

export function parseSmsText(text: string, today: string): ParsedSms[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: ParsedSms[] = [];
  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (!m) continue;
    const amount = Number.parseFloat(m[2].replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const dateMatch = line.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
    let date = today;
    if (dateMatch) {
      const dd = dateMatch[1];
      const mm = dateMatch[2];
      let yyyy = dateMatch[3];
      if (yyyy.length === 2) yyyy = `20${yyyy}`;
      date = `${yyyy}-${mm}-${dd}`;
    }
    const desc = line
      .replace(LINE_RE, "")
      .replace(/\d{2}[./]\d{2}[./]\d{2,4}/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    out.push({
      amount,
      description: desc || "Операция по SMS",
      date,
    });
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
