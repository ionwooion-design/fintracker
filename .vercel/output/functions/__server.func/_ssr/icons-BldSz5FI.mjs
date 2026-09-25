import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { C as Award, _ as Flag, a as Sprout, c as Shield, g as Gamepad2, h as Gift, m as HeartPulse, n as Utensils, p as House, s as Shirt, t as Wallet, u as Phone, v as Ellipsis, x as Bus, y as Crown } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/icons-BldSz5FI.js
var import_jsx_runtime = require_jsx_runtime();
var MAP = {
	utensils: Utensils,
	bus: Bus,
	"gamepad-2": Gamepad2,
	house: House,
	phone: Phone,
	"heart-pulse": HeartPulse,
	shirt: Shirt,
	gift: Gift,
	ellipsis: Ellipsis,
	wallet: Wallet,
	flag: Flag,
	sprout: Sprout,
	award: Award,
	shield: Shield,
	crown: Crown
};
function CategoryIcon({ name, className }) {
	const Icon = MAP[name] ?? Ellipsis;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
		className,
		strokeWidth: 1.75
	});
}
//#endregion
export { CategoryIcon as t };
