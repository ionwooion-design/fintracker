import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as Button } from "./router-CQ_Rpc8n.mjs";
import { t as useCurrentUser } from "./use-current-user-DG6UNzh9.mjs";
import { a as useFinance, i as ThemeSync, n as AuthGuard, o as useFinanceMutations, r as Card, t as AppShell } from "./use-finance-DgeZ3jhZ.mjs";
import { n as Label, t as Input } from "./input-P21tvurh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-j8E2v8CY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, {}) });
}
function Inner() {
	const user = useCurrentUser();
	const { snapshot, isPending } = useFinance();
	const mut = useFinanceMutations();
	const [userName, setUserName] = (0, import_react.useState)("");
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [endDate, setEndDate] = (0, import_react.useState)("");
	const [initial, setInitial] = (0, import_react.useState)("");
	const [target, setTarget] = (0, import_react.useState)("");
	const [dark, setDark] = (0, import_react.useState)(false);
	const [eventDesc, setEventDesc] = (0, import_react.useState)("");
	const [eventAmt, setEventAmt] = (0, import_react.useState)("");
	const [eventDate, setEventDate] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	(0, import_react.useEffect)(() => {
		if (!snapshot) return;
		setUserName(snapshot.settings.userName || user?.displayName || "");
		setStartDate(snapshot.settings.startDate);
		setEndDate(snapshot.settings.endDate);
		setInitial(String(snapshot.settings.initialBalance));
		setTarget(String(snapshot.settings.finalTarget));
		setDark(snapshot.settings.darkTheme);
	}, [snapshot, user?.displayName]);
	if (isPending || !snapshot) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Настройки",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-[28px] bg-surface" })
	});
	const events = snapshot.fixedEvents.filter((e) => {
		if (filter === "in") return e.amount > 0;
		if (filter === "out") return e.amount < 0;
		return true;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Настройки",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSync, { snapshot }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "Профиль"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: user?.primaryEmail
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Имя" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: userName,
							onChange: (e) => setUserName(e.target.value)
						})]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "Бюджетный период"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Начало" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: startDate,
								onChange: (e) => setStartDate(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Конец" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "date",
								value: endDate,
								onChange: (e) => setEndDate(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Стартовый баланс" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								inputMode: "decimal",
								value: initial,
								onChange: (e) => setInitial(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Целевой баланс" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								inputMode: "decimal",
								value: target,
								onChange: (e) => setTarget(e.target.value)
							})] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 flex min-h-11 items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: "Тёмная тема"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: dark,
							onChange: (e) => setDark(e.target.checked),
							className: "size-5 accent-[var(--color-accent)]"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4 w-full",
						disabled: mut.saveSettings.isPending,
						onClick: () => mut.saveSettings.mutate({
							userName,
							startDate,
							endDate,
							initialBalance: Number(initial.replace(",", ".")),
							finalTarget: Number(target.replace(",", ".")),
							darkTheme: dark,
							privacyAccepted: true
						}),
						children: "Сохранить все настройки"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "Фиксированные события"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex gap-1",
						children: [
							"all",
							"in",
							"out"
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFilter(f),
							className: `h-9 rounded-full px-3 text-xs ${filter === f ? "bg-accent text-accent-fg" : "bg-elevated text-muted"}`,
							children: f === "all" ? "Все" : f === "in" ? "Доходы" : "Расходы"
						}, f))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-3 space-y-2",
						children: events.map((ev) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								ev.eventDate,
								" · ",
								ev.description
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-2 font-mono tabular-nums",
								children: [
									ev.amount,
									" ₽",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "text-danger",
										onClick: () => mut.deleteEvent.mutate({ id: ev.id }),
										children: "Удалить"
									})
								]
							})]
						}, ev.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 space-y-2",
						onSubmit: (e) => {
							e.preventDefault();
							const n = Number(eventAmt.replace(",", "."));
							if (!Number.isFinite(n) || !eventDesc.trim() || !eventDate) return;
							mut.saveEvent.mutate({
								amount: n,
								description: eventDesc.trim(),
								eventDate
							});
							setEventAmt("");
							setEventDesc("");
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Новое событие (минус = расход)" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: eventDesc,
								onChange: (e) => setEventDesc(e.target.value),
								placeholder: "Зарплата / аренда"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									inputMode: "decimal",
									value: eventAmt,
									onChange: (e) => setEventAmt(e.target.value),
									placeholder: "Сумма"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: eventDate,
									onChange: (e) => setEventDate(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								variant: "secondary",
								className: "w-full",
								children: "Добавить событие"
							})
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg",
						children: "Опасная зона"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Сбросит операции, конверты, события и достижения. Профиль входа сохранится."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						className: "mt-3 w-full",
						onClick: () => {
							if (confirm("Точно сбросить все финансовые данные?")) mut.reset.mutate(void 0);
						},
						children: "Сбросить данные"
					})
				] })
			]
		})]
	});
}
//#endregion
export { Page as component };
