import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as cn } from "./utils-2ReNRrU5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/input-P21tvurh.js
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-[12px] border border-border bg-elevated px-3 text-sm text-fg placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-32 w-full rounded-[12px] border border-border bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted", className),
		...props
	});
}
//#endregion
export { Label as n, Textarea as r, Input as t };
