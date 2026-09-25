import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { o as formatRub } from "./utils-2ReNRrU5.mjs";
import { n as Button } from "./router-CQ_Rpc8n.mjs";
import { a as useFinance, i as ThemeSync, n as AuthGuard, o as useFinanceMutations, r as Card, t as AppShell } from "./use-finance-DgeZ3jhZ.mjs";
import { t as EnvelopeCircle } from "./envelope-circle-Bsj9cP_7.mjs";
import { n as Label, t as Input } from "./input-P21tvurh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/envelopes-D4iX7RJ1.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Page() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inner, {}) });
}
function Inner() {
	const { snapshot, computed, isPending } = useFinance();
	const mut = useFinanceMutations();
	const [name, setName] = (0, import_react.useState)("");
	const [budget, setBudget] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(null);
	if (isPending || !snapshot || !computed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Конверты",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-[28px] bg-surface" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Конверты",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSync, { snapshot }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-3",
					children: computed.envelopes.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnvelopeCircle, {
						item: e,
						onClick: () => setEditing(e)
					}, e.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: computed.envelopes.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between rounded-[18px] bg-surface px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: e.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								formatRub(e.spent),
								" / ",
								formatRub(e.budget),
								e.isOverBudget ? " · перерасход" : ""
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: () => setEditing(e),
								children: "Изменить"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => {
									if (confirm("Удалить конверт? Операции сохранятся.")) mut.deleteEnv.mutate({ id: e.id });
								},
								children: "Удалить"
							})]
						})]
					}, e.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg",
					children: editing ? "Редактировать конверт" : "Новый конверт"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 space-y-2",
					onSubmit: (e) => {
						e.preventDefault();
						const b = Number((editing ? budget || String(editing.budget) : budget).replace(",", "."));
						if (!Number.isFinite(b) || b < 0) return;
						mut.saveEnv.mutate({
							id: editing?.id,
							name: (editing ? name || editing.name : name).trim(),
							budget: b,
							color: editing?.color ?? "#3F6B5C",
							icon: editing?.icon ?? "wallet"
						});
						setName("");
						setBudget("");
						setEditing(null);
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Название" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: editing ? name || editing.name : name,
							onChange: (e) => setName(e.target.value),
							required: !editing
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Лимит" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							inputMode: "decimal",
							value: editing ? budget || String(editing.budget) : budget,
							onChange: (e) => setBudget(e.target.value),
							required: !editing
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [editing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "secondary",
								className: "flex-1",
								onClick: () => setEditing(null),
								children: "Отмена"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "flex-1",
								children: "Сохранить"
							})]
						})
					]
				})] })
			]
		})]
	});
}
//#endregion
export { Page as component };
