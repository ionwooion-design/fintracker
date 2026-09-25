import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { o as formatRub } from "./utils-2ReNRrU5.mjs";
import { t as CategoryIcon } from "./icons-BldSz5FI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/envelope-circle-Bsj9cP_7.js
var import_jsx_runtime = require_jsx_runtime();
function EnvelopeCircle({ item, onClick }) {
	const r = 18;
	const c = 2 * Math.PI * r;
	const dash = c * (1 - Math.min(100, item.usagePercent) / 100);
	const tone = item.isOverBudget ? "var(--color-danger)" : "var(--color-ok)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex w-[88px] shrink-0 flex-col items-center gap-1 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative grid size-[72px] place-items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 48 48",
					className: "absolute inset-0 size-full -rotate-90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "24",
						cy: "24",
						r,
						fill: "none",
						stroke: "var(--color-border)",
						strokeWidth: "4"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "24",
						cy: "24",
						r,
						fill: "none",
						stroke: tone,
						strokeWidth: "4",
						strokeDasharray: `${c}`,
						strokeDashoffset: dash,
						strokeLinecap: "round"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
					name: item.icon,
					className: "size-5 text-fg"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "line-clamp-1 text-xs font-medium",
				children: item.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] tabular-nums text-muted",
				children: formatRub(item.remaining)
			})
		]
	});
}
//#endregion
export { EnvelopeCircle as t };
