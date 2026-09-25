import { n as createMiddleware } from "./ssr.mjs";
import { r as daysBetween, t as addDaysISO, u as todayISO } from "./utils-2ReNRrU5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calc-dMaYSQ5y.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-B40BzJxt.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-Bmy2L7qM.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
function computeDashboard(snap, today = todayISO()) {
	const { settings, transactions, fixedEvents, envelopes, categories } = snap;
	const currentBalance = calcCurrentBalance(settings.initialBalance, transactions, fixedEvents, today);
	const daysRemaining = Math.max(0, daysBetween(today, settings.endDate));
	const dailyLimit = calcDailyLimit(currentBalance, settings.finalTarget, fixedEvents, daysRemaining, today);
	const spentToday = transactions.filter((t) => t.transactionDate === today && t.type === "expense").reduce((s, t) => s + t.amount, 0);
	const remainingToday = dailyLimit - spentToday;
	const progressPercent = dailyLimit <= 0 ? spentToday > 0 ? 100 : 0 : Math.min(200, spentToday / dailyLimit * 100);
	const progressTone = progressPercent < 50 ? "green" : progressPercent < 85 ? "yellow" : "red";
	const envelopeRows = envelopes.map((env) => {
		const spent = transactions.filter((t) => t.type === "expense" && t.envelopeId === env.id).reduce((s, t) => s + t.amount, 0);
		const remaining = env.budget - spent;
		const usagePercent = env.budget <= 0 ? 0 : Math.min(200, spent / env.budget * 100);
		return {
			...env,
			spent,
			remaining,
			usagePercent,
			isOverBudget: spent > env.budget
		};
	});
	const freeMoney = currentBalance - envelopeRows.reduce((s, e) => s + Math.max(0, e.remaining), 0);
	const byDayMap = /* @__PURE__ */ new Map();
	for (const t of [...transactions].sort((a, b) => a.transactionDate < b.transactionDate ? 1 : a.transactionDate > b.transactionDate ? -1 : b.id - a.id)) {
		const list = byDayMap.get(t.transactionDate) ?? [];
		list.push(t);
		byDayMap.set(t.transactionDate, list);
	}
	const transactionsByDay = [...byDayMap.entries()].map(([date, items]) => ({
		date,
		items
	}));
	return {
		currentBalance,
		dailyLimit,
		spentToday,
		remainingToday,
		progressPercent,
		progressTone,
		daysRemaining,
		currentStreak: settings.currentStreak,
		envelopes: envelopeRows,
		freeMoney,
		aiTip: localTip(progressPercent, remainingToday),
		transactionsByDay,
		heatmap: buildHeatmap(transactions, today),
		categoryBreakdown: categoryBreakdown(transactions, categories, settings.startDate, today),
		projection: projectBalance(currentBalance, dailyLimit, settings.endDate, fixedEvents, today)
	};
}
function calcCurrentBalance(initial, transactions, fixedEvents, today) {
	const incomeTx = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
	const expenseTx = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
	const pastFixed = fixedEvents.filter((e) => e.eventDate <= today);
	const fixedIncome = pastFixed.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
	const fixedExpense = pastFixed.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
	return initial + incomeTx + fixedIncome - expenseTx - fixedExpense;
}
function calcDailyLimit(currentBalance, target, fixedEvents, daysRemaining, today) {
	if (daysRemaining <= 0) return 0;
	const futureNet = fixedEvents.filter((e) => e.eventDate > today).reduce((s, e) => s + e.amount, 0);
	return Math.max(0, (currentBalance - target - futureNet) / daysRemaining);
}
function nextStreak(current, lastBudgetDay, spentToday, dailyLimit, today) {
	if (!(spentToday <= dailyLimit)) return {
		streak: 0,
		lastBudgetDay
	};
	if (!lastBudgetDay) return {
		streak: 1,
		lastBudgetDay: today
	};
	if (lastBudgetDay === today) return {
		streak: current,
		lastBudgetDay
	};
	if (lastBudgetDay === addDaysISO(today, -1)) return {
		streak: current + 1,
		lastBudgetDay: today
	};
	return {
		streak: 1,
		lastBudgetDay: today
	};
}
function localTip(progress, remaining) {
	if (progress >= 100) return "Дневной лимит превышен. Завтра начните с более скромного плана.";
	if (progress >= 85) return `Вы близко к лимиту. Осталось ${Math.round(remaining)} ₽ — тратьте осознанно.`;
	if (progress >= 50) return `Хороший темп. На сегодня ещё ${Math.round(remaining)} ₽.`;
	if (progress > 0) return "Отличный контроль: потрачено меньше половины дневного лимита.";
	return "Новый день. Сначала решите, какие траты действительно нужны.";
}
function buildHeatmap(transactions, today) {
	const start = addDaysISO(today, -89);
	const map = /* @__PURE__ */ new Map();
	for (const t of transactions) {
		if (t.type !== "expense") continue;
		if (t.transactionDate < start || t.transactionDate > today) continue;
		map.set(t.transactionDate, (map.get(t.transactionDate) ?? 0) + t.amount);
	}
	const days = [];
	let cursor = start;
	while (cursor <= today) {
		days.push({
			date: cursor,
			amount: map.get(cursor) ?? 0
		});
		cursor = addDaysISO(cursor, 1);
	}
	return days;
}
function categoryBreakdown(transactions, categories, from, to) {
	const period = transactions.filter((t) => t.type === "expense" && t.transactionDate >= from && t.transactionDate <= to);
	const total = period.reduce((s, t) => s + t.amount, 0);
	if (total <= 0) return [];
	const by = /* @__PURE__ */ new Map();
	for (const t of period) {
		if (t.categoryId == null) continue;
		by.set(t.categoryId, (by.get(t.categoryId) ?? 0) + t.amount);
	}
	return [...by.entries()].map(([id, amount]) => {
		const category = categories.find((c) => c.id === id);
		if (!category) return null;
		return {
			category,
			amount,
			percent: amount / total * 100
		};
	}).filter((x) => x != null).sort((a, b) => b.amount - a.amount);
}
function projectBalance(currentBalance, dailyLimit, endDate, fixedEvents, today) {
	const points = [];
	let balance = currentBalance;
	let date = today;
	while (date <= endDate) {
		const dayNet = fixedEvents.filter((e) => e.eventDate === date).reduce((s, e) => s + e.amount, 0);
		balance += dayNet;
		if (date > today) balance -= dailyLimit;
		points.push({
			date,
			projectedBalance: balance
		});
		date = addDaysISO(date, 1);
	}
	return points;
}
//#endregion
export { nextStreak as a, computeDashboard as i, calcCurrentBalance as n, calcDailyLimit as r, authMiddleware as t };
