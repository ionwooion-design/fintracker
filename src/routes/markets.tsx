import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  Newspaper,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { ThemeSync } from "@/components/theme-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFinance } from "@/lib/finance/use-finance";
import {
  formatPct,
  formatRate,
  useMarkets,
  type CryptoQuote,
  type FiatRate,
} from "@/lib/finance/markets";
import { fetchNews, type NewsItem } from "@/lib/finance/news";
import { formatMoney, cn } from "@/lib/utils";
import type { CurrencyCode } from "@/lib/finance/types";
import { CURRENCIES } from "@/lib/finance/types";

export const Route = createFileRoute("/markets")({ component: Page });

function Page() {
  return (
    <AuthGuard>
      <Inner />
    </AuthGuard>
  );
}

function Inner() {
  const { snapshot } = useFinance();
  const base = (snapshot?.settings.currency ?? "RUB") as CurrencyCode;
  const {
    data,
    isPending,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useMarkets(base);

  const newsQuery = useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNews(),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
    retry: 1,
  });

  const baseSymbol =
    CURRENCIES.find((c) => c.code === base)?.symbol ?? base;

  const refreshAll = () => {
    void refetch();
    void newsQuery.refetch();
  };

  return (
    <AppShell title="Рынок">
      {snapshot && <ThemeSync snapshot={snapshot} />}
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                База
              </p>
              <p className="mt-0.5 font-display text-xl text-fg">
                {base} · {baseSymbol}
              </p>
              <p className="mt-1 text-xs text-muted">
                Курсы относительно валюты из настроек. Котировки ~5 мин, новости
                ~10 мин.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isFetching || newsQuery.isFetching}
              onClick={refreshAll}
              aria-label="Обновить"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  (isFetching || newsQuery.isFetching) && "animate-spin",
                )}
              />
              Обновить
            </Button>
          </div>
          {dataUpdatedAt > 0 && (
            <p className="mt-2 text-[11px] text-subtle">
              Котировки:{" "}
              {new Date(dataUpdatedAt).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {data?.fxUpdatedAt
                ? ` · FX: ${data.fxUpdatedAt.replace(" +0000", " UTC")}`
                : null}
            </p>
          )}
        </Card>

        {isPending && !data && (
          <div className="space-y-2">
            <div className="h-28 animate-pulse rounded-[14px] bg-surface" />
            <div className="h-40 animate-pulse rounded-[14px] bg-surface" />
          </div>
        )}

        {isError && !data && (
          <Card className="p-4">
            <p className="text-sm text-danger">
              Не удалось загрузить котировки. Проверьте сеть и нажмите
              «Обновить».
            </p>
          </Card>
        )}

        {data && (
          <>
            <Card>
              <h2 className="font-display text-lg">Валюты</h2>
              <p className="mt-0.5 text-xs text-muted">
                Сколько единиц валюты за 1 {base}
              </p>
              {data.againstBase.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Нет данных по FX</p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {data.againstBase.map((row) => (
                    <FiatRow key={row.code} row={row} base={base} />
                  ))}
                </ul>
              )}
              {data.fiat.length > 0 && base !== "USD" && (
                <details className="mt-3 border-t border-border pt-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted">
                    Также: 1 USD → …
                  </summary>
                  <ul className="mt-2 divide-y divide-border">
                    {data.fiat.map((row) => (
                      <li
                        key={row.code}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="font-medium tabular-nums">
                          {row.code}
                        </span>
                        <span className="font-mono tabular-nums text-muted">
                          {formatRate(row.rate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-lg">Криптовалюты</h2>
              <p className="mt-0.5 text-xs text-muted">
                Цена и изменение за 24 ч (CoinGecko)
              </p>
              {data.crypto.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Нет данных по крипте</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.crypto.map((c) => (
                    <CryptoRow key={c.id} quote={c} preferRub={base === "RUB"} />
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        <NewsSection
          items={newsQuery.data?.items ?? []}
          providers={newsQuery.data?.providers ?? []}
          errors={newsQuery.data?.errors ?? []}
          isPending={newsQuery.isPending && !newsQuery.data}
          isError={newsQuery.isError && !newsQuery.data}
          fetchedAt={newsQuery.data?.fetchedAt}
        />

        <Card className="p-4">
          <h2 className="text-sm font-medium text-fg">Источники</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {data?.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {s.name}
                </a>
              </li>
            ))}
            <li>Finnhub (если задан FINNHUB_API_KEY) · RSS CoinDesk / BBC</li>
          </ul>
          <p className="mt-2 text-[11px] text-subtle">
            Котировки и заголовки справочные, не являются инвестиционной
            рекомендацией.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function NewsSection({
  items,
  providers,
  errors,
  isPending,
  isError,
  fetchedAt,
}: {
  items: NewsItem[];
  providers: string[];
  errors: string[];
  isPending: boolean;
  isError: boolean;
  fetchedAt?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Newspaper className="size-4 text-accent" />
        <h2 className="font-display text-lg">Новости</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {providers.length > 0
          ? providers.join(" · ")
          : "Finnhub и/или RSS (CoinDesk, BBC Russian)"}
        {fetchedAt
          ? ` · ${new Date(fetchedAt).toLocaleString("ru-RU", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}`
          : null}
      </p>

      {isPending && (
        <div className="mt-3 space-y-2">
          <div className="h-14 animate-pulse rounded-[12px] bg-elevated" />
          <div className="h-14 animate-pulse rounded-[12px] bg-elevated" />
        </div>
      )}

      {isError && (
        <p className="mt-3 text-sm text-danger">
          Не удалось загрузить новости. Проверьте сеть и ключ Finnhub.
        </p>
      )}

      {!isPending && items.length === 0 && !isError && (
        <p className="mt-3 text-sm text-muted">
          Пока нет заголовков.
          {errors.length > 0 ? ` (${errors[0]})` : null}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((n) => (
            <NewsRow key={n.id} item={n} />
          ))}
        </ul>
      )}

      {errors.length > 0 && items.length > 0 && (
        <p className="mt-2 text-[11px] text-subtle">
          Часть источников недоступна: {errors.slice(0, 2).join("; ")}
        </p>
      )}
    </Card>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  let when = "";
  if (item.publishedAt) {
    const d = new Date(item.publishedAt);
    if (!Number.isNaN(d.getTime())) {
      when = d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return (
    <li>
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer noopener"
        className="block rounded-[12px] border border-border bg-elevated/60 px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-elevated"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-fg">
            {item.title}
          </p>
          <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-subtle" />
        </div>
        {item.summary && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.summary}</p>
        )}
        <p className="mt-1.5 text-[11px] text-subtle">
          {item.source}
          {item.origin === "finnhub" ? " · Finnhub" : " · RSS"}
          {when ? ` · ${when}` : null}
        </p>
      </a>
    </li>
  );
}

function FiatRow({ row, base }: { row: FiatRate; base: string }) {
  const inv = row.rate > 0 ? 1 / row.rate : NaN;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div>
        <p className="text-sm font-medium tabular-nums">{row.code}</p>
        <p className="text-[11px] text-subtle">
          1 {row.code} ≈ {formatRate(inv)} {base}
        </p>
      </div>
      <p className="font-mono text-sm tabular-nums text-fg">
        {formatRate(row.rate)}
      </p>
    </li>
  );
}

function CryptoRow({
  quote,
  preferRub,
}: {
  quote: CryptoQuote;
  preferRub: boolean;
}) {
  const change = preferRub ? quote.change24hRub : quote.change24hUsd;
  const up = change != null && change > 0;
  const down = change != null && change < 0;
  const pricePrimary = preferRub
    ? Number.isFinite(quote.rub)
      ? formatMoney(quote.rub, "RUB")
      : "—"
    : Number.isFinite(quote.usd)
      ? formatMoney(quote.usd, "USD")
      : "—";
  const priceSecondary = preferRub
    ? Number.isFinite(quote.usd)
      ? formatMoney(quote.usd, "USD")
      : null
    : Number.isFinite(quote.rub)
      ? formatMoney(quote.rub, "RUB")
      : null;

  return (
    <li className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-elevated/60 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          <span className="tabular-nums">{quote.symbol}</span>
          <span className="ml-1.5 text-xs font-normal text-muted">
            {quote.name}
          </span>
        </p>
        <p className="mt-0.5 font-mono text-sm tabular-nums text-fg">
          {pricePrimary}
        </p>
        {priceSecondary && (
          <p className="text-[11px] tabular-nums text-subtle">{priceSecondary}</p>
        )}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium tabular-nums",
          up && "bg-ok/15 text-ok",
          down && "bg-danger/15 text-danger",
          !up && !down && "bg-elevated text-muted",
        )}
      >
        {up && <TrendingUp className="size-3.5" />}
        {down && <TrendingDown className="size-3.5" />}
        {formatPct(change)}
      </div>
    </li>
  );
}
