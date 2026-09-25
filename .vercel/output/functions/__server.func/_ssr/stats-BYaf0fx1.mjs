import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { o as formatRub } from "./utils-2ReNRrU5.mjs";
import { a as useFinance, i as ThemeSync, n as AuthGuard, r as Card, t as AppShell } from "./use-finance-DgeZ3jhZ.mjs";
import { t as CategoryIcon } from "./icons-BldSz5FI.mjs";
import { a as Line, c as Cell, i as XAxis, l as ResponsiveContainer, n as LineChart, o as ReferenceLine, r as YAxis, s as Pie, t as PieChart, u as Tooltip } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stats-BYaf0fx1.js
var import_jsx_runtime = require_jsx_runtime();
function StatsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsInner, {}) });
}
function StatsInner() {
	const { snapshot, computed, isPending } = useFinance();
	if (isPending || !snapshot || !computed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Статистика",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 animate-pulse rounded-[28px] bg-surface" })
	});
	const total = computed.categoryBreakdown.reduce((s, c) => s + c.amount, 0);
	const pie = computed.categoryBreakdown.map((c) => ({
		name: c.category.name,
		value: c.amount,
		color: c.category.color
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Статистика",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSync, { snapshot }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "По категориям"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: ["Всего ", formatRub(total)]
					}),
					pie.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-muted",
						children: "Пока нет расходов за период."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-52",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PieChart, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pie, {
								data: pie,
								dataKey: "value",
								nameKey: "name",
								innerRadius: 48,
								outerRadius: 72,
								stroke: "none",
								children: pie.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: p.color }, p.name))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => formatRub(Number(v)) })] })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: computed.categoryBreakdown.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-2.5 rounded-full",
									style: { background: c.category.color }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
									name: c.category.icon,
									className: "size-4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1",
									children: c.category.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono tabular-nums",
									children: formatRub(c.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-10 text-right text-xs text-muted",
									children: [c.percent.toFixed(0), "%"]
								})
							]
						}, c.category.id))
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "Прогноз баланса"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "До конца периода, с учётом лимита и фиксированных событий"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-48",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
								data: computed.projection,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "date",
										hide: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { hide: true }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { formatter: (v) => formatRub(Number(v)) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReferenceLine, {
										y: snapshot.settings.finalTarget,
										stroke: "var(--color-muted)",
										strokeDasharray: "4 4"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										type: "monotone",
										dataKey: "projectedBalance",
										stroke: "var(--color-accent)",
										strokeWidth: 2,
										dot: false
									})
								]
							})
						})
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg",
					children: "Достижения"
				}), snapshot.achievements.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Пока пусто — держите дневной лимит несколько дней подряд."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2",
					children: snapshot.achievements.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 rounded-[16px] bg-elevated px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
							name: a.icon,
							className: "size-5"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: a.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: a.description
						})] })]
					}, a.id))
				})] })
			]
		})]
	});
}
//#endregion
export { StatsPage as component };
