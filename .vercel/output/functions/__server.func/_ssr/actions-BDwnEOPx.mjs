import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { c as getSql, l as num, u as todayISO } from "./utils-2ReNRrU5.mjs";
import { a as nextStreak, n as calcCurrentBalance, r as calcDailyLimit, t as authMiddleware } from "./calc-dMaYSQ5y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/actions-BDwnEOPx.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var DEFAULT_CATEGORIES = [
	{
		name: "Еда",
		color: "#5C6B5A",
		icon: "utensils"
	},
	{
		name: "Транспорт",
		color: "#4A5C6A",
		icon: "bus"
	},
	{
		name: "Развлечения",
		color: "#5A5366",
		icon: "gamepad-2"
	},
	{
		name: "Коммунальные",
		color: "#6A5E4A",
		icon: "house"
	},
	{
		name: "Связь",
		color: "#4A6566",
		icon: "phone"
	},
	{
		name: "Здоровье",
		color: "#6A4A4A",
		icon: "heart-pulse"
	},
	{
		name: "Одежда",
		color: "#5A4A5C",
		icon: "shirt"
	},
	{
		name: "Подарки",
		color: "#4A4F66",
		icon: "gift"
	},
	{
		name: "Другое",
		color: "#5C5C58",
		icon: "ellipsis"
	}
];
var DEFAULT_ENVELOPES = [
	{
		name: "Еда",
		budget: 15e3,
		color: "#5C6B5A",
		icon: "utensils"
	},
	{
		name: "Транспорт",
		budget: 5e3,
		color: "#4A5C6A",
		icon: "bus"
	},
	{
		name: "Развлечения",
		budget: 8e3,
		color: "#5A5366",
		icon: "gamepad-2"
	},
	{
		name: "Свободные деньги",
		budget: 1e4,
		color: "#3F6B5C",
		icon: "wallet"
	}
];
var ACHIEVEMENT_DEFS = [
	{
		code: "first_step",
		name: "Первый шаг",
		description: "Добавлена первая операция",
		icon: "flag",
		minStreak: 0
	},
	{
		code: "beginner_saver",
		name: "Начинающий эконом",
		description: "3 дня подряд в бюджете",
		icon: "sprout",
		minStreak: 3
	},
	{
		code: "budget_master",
		name: "Мастер бюджета",
		description: "7 дней подряд в бюджете",
		icon: "award",
		minStreak: 7
	},
	{
		code: "iron_will",
		name: "Железная воля",
		description: "14 дней подряд в бюджете",
		icon: "shield",
		minStreak: 14
	},
	{
		code: "month_legend",
		name: "Легенда месяца",
		description: "30 дней подряд в бюджете",
		icon: "crown",
		minStreak: 30
	}
];
var LINE_RE = /(оплата|покупка|списание).{0,24}?(\d+[.,]?\d*)\s*(RUB|RUR|₽)/i;
function parseSmsText(text, today) {
	const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
	const out = [];
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
		const desc = line.replace(LINE_RE, "").replace(/\d{2}[./]\d{2}[./]\d{2,4}/, "").replace(/\s+/g, " ").trim().slice(0, 80);
		out.push({
			amount,
			description: desc || "Операция по SMS",
			date
		});
	}
	return out;
}
function matchRule(description, rules) {
	const hay = description.toLowerCase();
	const sorted = [...rules].sort((a, b) => b.pattern.length - a.pattern.length);
	for (const r of sorted) if (r.pattern && hay.includes(r.pattern.toLowerCase())) return {
		categoryId: r.categoryId,
		envelopeId: r.envelopeId
	};
	return {
		categoryId: null,
		envelopeId: null
	};
}
function mapSettings(row, userId) {
	return {
		userId,
		userName: String(row.user_name ?? ""),
		startDate: String(row.start_date),
		initialBalance: num(row.initial_balance),
		endDate: String(row.end_date),
		finalTarget: num(row.final_target),
		currentStreak: num(row.current_streak),
		lastStreakDate: row.last_streak_date ? String(row.last_streak_date) : null,
		lastBudgetDay: row.last_budget_day ? String(row.last_budget_day) : null,
		privacyAccepted: Boolean(row.privacy_accepted),
		darkTheme: Boolean(row.dark_theme)
	};
}
async function ensureSeeded(userId, displayName) {
	const sql = await getSql();
	if ((await sql`select user_id from user_settings where user_id = ${userId}`).length) return;
	const today = todayISO();
	const end = /* @__PURE__ */ new Date();
	end.setMonth(end.getMonth() + 1);
	const endDate = todayISO(end);
	await sql`
    insert into user_settings (user_id, user_name, start_date, initial_balance, end_date, final_target)
    values (${userId}, ${displayName ?? ""}, ${today}, 50000, ${endDate}, 10000)
  `;
	for (const c of DEFAULT_CATEGORIES) await sql`
      insert into categories (user_id, name, color, icon)
      values (${userId}, ${c.name}, ${c.color}, ${c.icon})
      on conflict (user_id, name) do nothing
    `;
	for (const e of DEFAULT_ENVELOPES) await sql`
      insert into envelopes (user_id, name, budget, color, icon)
      values (${userId}, ${e.name}, ${e.budget}, ${e.color}, ${e.icon})
      on conflict (user_id, name) do nothing
    `;
	const cats = await sql`
    select id, name from categories where user_id = ${userId}
  `;
	const food = cats.find((c) => c.name === "Еда");
	const transport = cats.find((c) => c.name === "Транспорт");
	if (food) {
		await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"пятерочк"}, ${food.id})`;
		await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"магнит"}, ${food.id})`;
	}
	if (transport) {
		await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"яндекс.такси"}, ${transport.id})`;
		await sql`insert into categorization_rules (user_id, pattern, category_id) values (${userId}, ${"метро"}, ${transport.id})`;
	}
}
async function loadSnapshot(userId) {
	const sql = await getSql();
	const [settingsRow] = await sql`
    select * from user_settings where user_id = ${userId}
  `;
	const categories = await sql`
    select id, name, color, icon from categories where user_id = ${userId} order by name
  `;
	const envelopes = await sql`
    select id, name, budget, color, icon from envelopes where user_id = ${userId} order by name
  `;
	const transactions = await sql`
    select id, amount, type, description, transaction_date, category_id, envelope_id
    from transactions where user_id = ${userId}
    order by transaction_date desc, id desc
  `;
	const fixedEvents = await sql`
    select id, amount, description, event_date from fixed_events
    where user_id = ${userId} order by event_date
  `;
	const achievements = await sql`
    select id, code, name, description, icon, unlocked_at from achievements
    where user_id = ${userId} order by unlocked_at desc
  `;
	return {
		settings: mapSettings(settingsRow, userId),
		categories,
		envelopes: envelopes.map((e) => ({
			id: e.id,
			name: e.name,
			budget: num(e.budget),
			color: e.color,
			icon: e.icon
		})),
		transactions: transactions.map((t) => ({
			id: t.id,
			amount: num(t.amount),
			type: t.type,
			description: t.description,
			transactionDate: String(t.transaction_date),
			categoryId: t.category_id,
			envelopeId: t.envelope_id
		})),
		fixedEvents: fixedEvents.map((e) => ({
			id: e.id,
			amount: num(e.amount),
			description: e.description,
			eventDate: String(e.event_date)
		})),
		achievements: achievements.map((a) => ({
			id: a.id,
			code: a.code,
			name: a.name,
			description: a.description,
			icon: a.icon,
			unlockedAt: String(a.unlocked_at)
		}))
	};
}
async function unlockAchievements(userId, streak, txCount) {
	const sql = await getSql();
	for (const def of ACHIEVEMENT_DEFS) {
		if (def.code === "first_step" && txCount < 1) continue;
		if (def.minStreak > 0 && streak < def.minStreak) continue;
		if (def.code === "first_step" && txCount < 1) continue;
		await sql`
      insert into achievements (user_id, code, name, description, icon)
      values (${userId}, ${def.code}, ${def.name}, ${def.description}, ${def.icon})
      on conflict (user_id, code) do nothing
    `;
	}
}
async function refreshStreak(userId) {
	const snap = await loadSnapshot(userId);
	const today = todayISO();
	const spentToday = snap.transactions.filter((t) => t.transactionDate === today && t.type === "expense").reduce((s, t) => s + t.amount, 0);
	const balance = calcCurrentBalance(snap.settings.initialBalance, snap.transactions, snap.fixedEvents, today);
	const daysRemaining = Math.max(0, Math.round(((/* @__PURE__ */ new Date(`${snap.settings.endDate}T12:00:00`)).getTime() - (/* @__PURE__ */ new Date(`${today}T12:00:00`)).getTime()) / 864e5));
	const dailyLimit = calcDailyLimit(balance, snap.settings.finalTarget, snap.fixedEvents, daysRemaining, today);
	const next = nextStreak(snap.settings.currentStreak, snap.settings.lastBudgetDay, spentToday, dailyLimit, today);
	await (await getSql())`
    update user_settings
    set current_streak = ${next.streak},
        last_budget_day = ${next.lastBudgetDay},
        last_streak_date = ${today},
        updated_at = now()
    where user_id = ${userId}
  `;
	await unlockAchievements(userId, next.streak, snap.transactions.length);
}
var getFinanceData_createServerFn_handler = createServerRpc({
	id: "62009874ffb659f4ec352f5cd9491d7edf439d801ac330b483b777f97e783cae",
	name: "getFinanceData",
	filename: "src/lib/finance/actions.ts"
}, (opts) => getFinanceData.__executeServer(opts));
var getFinanceData = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getFinanceData_createServerFn_handler, async ({ context }) => {
	await ensureSeeded(context.userId);
	return loadSnapshot(context.userId);
});
var saveSettings_createServerFn_handler = createServerRpc({
	id: "5a5de5bed95f9fd0aa0e01140a7575f5d76b4f17da0a66183cddaefcea2727f3",
	name: "saveSettings",
	filename: "src/lib/finance/actions.ts"
}, (opts) => saveSettings.__executeServer(opts));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveSettings_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`
      update user_settings
      set user_name = ${data.userName},
          start_date = ${data.startDate},
          initial_balance = ${data.initialBalance},
          end_date = ${data.endDate},
          final_target = ${data.finalTarget},
          dark_theme = ${data.darkTheme},
          privacy_accepted = coalesce(${data.privacyAccepted ?? null}, privacy_accepted),
          updated_at = now()
      where user_id = ${context.userId}
    `;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var addTransaction_createServerFn_handler = createServerRpc({
	id: "aa39e7ae95c039307079762f43cb3611ac1b6cf18862e5adc26f6867049102a8",
	name: "addTransaction",
	filename: "src/lib/finance/actions.ts"
}, (opts) => addTransaction.__executeServer(opts));
var addTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(addTransaction_createServerFn_handler, async ({ context, data }) => {
	if (data.amount <= 0) throw new Error("Сумма должна быть больше нуля");
	await (await getSql())`
      insert into transactions (user_id, amount, type, description, transaction_date, category_id, envelope_id)
      values (
        ${context.userId},
        ${data.amount},
        ${data.type},
        ${data.description.trim() || "Без названия"},
        ${data.transactionDate},
        ${data.categoryId},
        ${data.envelopeId}
      )
    `;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var updateTransaction_createServerFn_handler = createServerRpc({
	id: "6173cd1fe22e758b0c8f197a294e71218a1b15abcc3054acc772a54f961047db",
	name: "updateTransaction",
	filename: "src/lib/finance/actions.ts"
}, (opts) => updateTransaction.__executeServer(opts));
var updateTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(updateTransaction_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`
      update transactions
      set amount = ${data.amount},
          description = ${data.description.trim() || "Без названия"},
          transaction_date = ${data.transactionDate},
          category_id = ${data.categoryId},
          envelope_id = ${data.envelopeId}
      where id = ${data.id} and user_id = ${context.userId}
    `;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var deleteTransaction_createServerFn_handler = createServerRpc({
	id: "adecb127843d819258aff832faaa7f44cab4268eee6fb8192dfcd1febc450dc3",
	name: "deleteTransaction",
	filename: "src/lib/finance/actions.ts"
}, (opts) => deleteTransaction.__executeServer(opts));
var deleteTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(deleteTransaction_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`delete from transactions where id = ${data.id} and user_id = ${context.userId}`;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var bulkDeleteTransactions_createServerFn_handler = createServerRpc({
	id: "9f91d2566ba9e12efd063aa6816c1aa7d81cb3e07fbf298c6167e15daebb45e5",
	name: "bulkDeleteTransactions",
	filename: "src/lib/finance/actions.ts"
}, (opts) => bulkDeleteTransactions.__executeServer(opts));
var bulkDeleteTransactions = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(bulkDeleteTransactions_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (data.day) await sql`delete from transactions where user_id = ${context.userId} and transaction_date = ${data.day}`;
	else if (data.month) await sql`delete from transactions where user_id = ${context.userId} and to_char(transaction_date, 'YYYY-MM') = ${data.month}`;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var saveEnvelope_createServerFn_handler = createServerRpc({
	id: "56dac13fd12534949759f79a39aae9a8b279f8fd715559519571407308d2013d",
	name: "saveEnvelope",
	filename: "src/lib/finance/actions.ts"
}, (opts) => saveEnvelope.__executeServer(opts));
var saveEnvelope = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveEnvelope_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (data.id) await sql`
        update envelopes
        set name = ${data.name.trim()}, budget = ${data.budget}, color = ${data.color}, icon = ${data.icon}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
	else await sql`
        insert into envelopes (user_id, name, budget, color, icon)
        values (${context.userId}, ${data.name.trim()}, ${data.budget}, ${data.color}, ${data.icon})
      `;
	return loadSnapshot(context.userId);
});
var deleteEnvelope_createServerFn_handler = createServerRpc({
	id: "163e3b9cf65a7e66b040bcaa5614702dd089b4a2d83078f15fc47ab73c012be7",
	name: "deleteEnvelope",
	filename: "src/lib/finance/actions.ts"
}, (opts) => deleteEnvelope.__executeServer(opts));
var deleteEnvelope = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(deleteEnvelope_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	await sql`update transactions set envelope_id = null where envelope_id = ${data.id} and user_id = ${context.userId}`;
	await sql`delete from envelopes where id = ${data.id} and user_id = ${context.userId}`;
	return loadSnapshot(context.userId);
});
var saveCategory_createServerFn_handler = createServerRpc({
	id: "eb24a76cee1c19d9eb55f66766a428a086e43c6725512386687e224953f2e64e",
	name: "saveCategory",
	filename: "src/lib/finance/actions.ts"
}, (opts) => saveCategory.__executeServer(opts));
var saveCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveCategory_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (data.id) await sql`
        update categories set name = ${data.name.trim()}, color = ${data.color}, icon = ${data.icon}
        where id = ${data.id} and user_id = ${context.userId}
      `;
	else await sql`
        insert into categories (user_id, name, color, icon)
        values (${context.userId}, ${data.name.trim()}, ${data.color}, ${data.icon})
      `;
	return loadSnapshot(context.userId);
});
var saveFixedEvent_createServerFn_handler = createServerRpc({
	id: "633de36a343e9ea144854cfc1b88aac8c33833bdca69b72879391ce2ac340b04",
	name: "saveFixedEvent",
	filename: "src/lib/finance/actions.ts"
}, (opts) => saveFixedEvent.__executeServer(opts));
var saveFixedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveFixedEvent_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	if (data.id) await sql`
        update fixed_events
        set amount = ${data.amount}, description = ${data.description.trim()}, event_date = ${data.eventDate}, updated_at = now()
        where id = ${data.id} and user_id = ${context.userId}
      `;
	else await sql`
        insert into fixed_events (user_id, amount, description, event_date)
        values (${context.userId}, ${data.amount}, ${data.description.trim()}, ${data.eventDate})
      `;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var deleteFixedEvent_createServerFn_handler = createServerRpc({
	id: "b9a04221f011407ac32070c7729854129aa28ada1bf08a142820cf1c906d6191",
	name: "deleteFixedEvent",
	filename: "src/lib/finance/actions.ts"
}, (opts) => deleteFixedEvent.__executeServer(opts));
var deleteFixedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(deleteFixedEvent_createServerFn_handler, async ({ context, data }) => {
	await (await getSql())`delete from fixed_events where id = ${data.id} and user_id = ${context.userId}`;
	await refreshStreak(context.userId);
	return loadSnapshot(context.userId);
});
var importSms_createServerFn_handler = createServerRpc({
	id: "8da3844c212504bec68c663e83e6c0e846efbcb32efc35cca179f63081d9b78c",
	name: "importSms",
	filename: "src/lib/finance/actions.ts"
}, (opts) => importSms.__executeServer(opts));
var importSms = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(importSms_createServerFn_handler, async ({ context, data }) => {
	const parsed = parseSmsText(data.text, todayISO());
	const sql = await getSql();
	const rules = await sql`
      select pattern, category_id, envelope_id from categorization_rules where user_id = ${context.userId}
    `;
	let success = 0;
	for (const p of parsed) {
		const match = matchRule(p.description, rules.map((r) => ({
			pattern: r.pattern,
			categoryId: r.category_id,
			envelopeId: r.envelope_id
		})));
		await sql`
        insert into transactions (user_id, amount, type, description, transaction_date, category_id, envelope_id)
        values (${context.userId}, ${p.amount}, ${"expense"}, ${p.description}, ${p.date}, ${match.categoryId}, ${match.envelopeId})
      `;
		success += 1;
	}
	await refreshStreak(context.userId);
	const snap = await loadSnapshot(context.userId);
	return {
		successCount: success,
		failedCount: 0,
		snap
	};
});
var resetFinanceData_createServerFn_handler = createServerRpc({
	id: "cd4b2a153d1394a2fdb9cb6cb999f6b3e068a3937a00d1d9c7642feb255640d2",
	name: "resetFinanceData",
	filename: "src/lib/finance/actions.ts"
}, (opts) => resetFinanceData.__executeServer(opts));
var resetFinanceData = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(resetFinanceData_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	await sql`delete from transactions where user_id = ${context.userId}`;
	await sql`delete from fixed_events where user_id = ${context.userId}`;
	await sql`delete from achievements where user_id = ${context.userId}`;
	await sql`delete from envelopes where user_id = ${context.userId}`;
	await sql`delete from categories where user_id = ${context.userId}`;
	await sql`delete from categorization_rules where user_id = ${context.userId}`;
	await sql`delete from user_settings where user_id = ${context.userId}`;
	await ensureSeeded(context.userId);
	return loadSnapshot(context.userId);
});
var askAdvisor_createServerFn_handler = createServerRpc({
	id: "0442f5a5cd6cdc5a610ab5f87e9ddf4e87cfefaf5afeacec6c51c6f7bffd4041",
	name: "askAdvisor",
	filename: "src/lib/finance/actions.ts"
}, (opts) => askAdvisor.__executeServer(opts));
var askAdvisor = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(askAdvisor_createServerFn_handler, async ({ context }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI-советник сейчас недоступен."
	};
	const snap = await loadSnapshot(context.userId);
	const today = todayISO();
	const monthAgo = (() => {
		const d = /* @__PURE__ */ new Date(`${today}T12:00:00`);
		d.setDate(d.getDate() - 30);
		return todayISO(d);
	})();
	const recent = snap.transactions.filter((t) => t.type === "expense" && t.transactionDate >= monthAgo);
	const byCat = /* @__PURE__ */ new Map();
	for (const t of recent) {
		const name = snap.categories.find((c) => c.id === t.categoryId)?.name ?? "Без категории";
		byCat.set(name, (byCat.get(name) ?? 0) + t.amount);
	}
	const summary = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([n, a]) => `${n}: ${Math.round(a)} ₽`).join("; ");
	const total = recent.reduce((s, t) => s + t.amount, 0);
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 500,
			temperature: .6,
			messages: [{
				role: "system",
				content: "You are an experienced financial analyst. Reply in Russian. Give exactly 3 specific, actionable saving tips as a short markdown list. No preamble."
			}, {
				role: "user",
				content: `За 30 дней расходы ${Math.round(total)} ₽. Разбивка: ${summary || "нет данных"}. Дневной лимит и конверты: ${snap.envelopes.map((e) => e.name + " " + e.budget).join(", ")}.`
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `Не удалось получить совет (${res.status})`
	};
	return {
		ok: true,
		text: (await res.json()).choices?.[0]?.message?.content ?? ""
	};
});
//#endregion
export { addTransaction_createServerFn_handler, askAdvisor_createServerFn_handler, bulkDeleteTransactions_createServerFn_handler, deleteEnvelope_createServerFn_handler, deleteFixedEvent_createServerFn_handler, deleteTransaction_createServerFn_handler, getFinanceData_createServerFn_handler, importSms_createServerFn_handler, resetFinanceData_createServerFn_handler, saveCategory_createServerFn_handler, saveEnvelope_createServerFn_handler, saveFixedEvent_createServerFn_handler, saveSettings_createServerFn_handler, updateTransaction_createServerFn_handler };
