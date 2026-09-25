import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { d as useRouterState, v as Link, y as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { n as cn } from "./utils-2ReNRrU5.mjs";
import { i as computeDashboard, t as authMiddleware } from "./calc-dMaYSQ5y.mjs";
import { i as signOut } from "./client-B40BzJxt.mjs";
import { a as hasGateSessionMarker } from "./server-B3wPcFRL.mjs";
import { b as ChartColumn, l as Settings, p as House, t as Wallet } from "../_libs/lucide-react.mjs";
import { n as useCurrentUserState, t as useCurrentUser } from "./use-current-user-DG6UNzh9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-finance-DgeZ3jhZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var TABS = [
	{
		to: "/",
		label: "Главная",
		icon: House
	},
	{
		to: "/stats",
		label: "Статистика",
		icon: ChartColumn
	},
	{
		to: "/envelopes",
		label: "Конверты",
		icon: Wallet
	},
	{
		to: "/settings",
		label: "Настройки",
		icon: Settings
	}
];
function AppShell({ children, title }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { isPending } = useCurrentUserState();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col bg-bg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium uppercase tracking-[0.18em] text-muted",
					children: "FinTracker PRO"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-xl text-fg",
					children: title
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2",
					children: isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-9 animate-pulse rounded-full bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 px-4 pb-28 pt-4",
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg border-t border-border bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-4",
					children: TABS.map((tab) => {
						const active = pathname === tab.to;
						const Icon = tab.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: tab.to,
							className: cn("flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[12px] text-[11px] font-medium", active ? "text-accent" : "text-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-5",
								strokeWidth: active ? 2.2 : 1.7
							}), tab.label]
						}) }, tab.to);
					})
				})
			})
		]
	});
}
function AuthGuard({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col gap-3 bg-bg px-4 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 w-40 animate-pulse rounded-[12px] bg-elevated" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36 animate-pulse rounded-[28px] bg-surface" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-24 animate-pulse rounded-[28px] bg-surface" })
		]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, { to: "/login" });
	return children;
}
function ThemeSync({ snapshot }) {
	(0, import_react.useEffect)(() => {
		const dark = snapshot?.settings.darkTheme ?? false;
		document.documentElement.classList.toggle("dark", dark);
	}, [snapshot?.settings.darkTheme]);
	return null;
}
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-[28px] border border-border bg-surface p-4 shadow-[0_1px_0_color-mix(in_oklab,var(--color-fg)_6%,transparent)]", className),
		...props
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getFinanceData = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("62009874ffb659f4ec352f5cd9491d7edf439d801ac330b483b777f97e783cae"));
var saveSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("5a5de5bed95f9fd0aa0e01140a7575f5d76b4f17da0a66183cddaefcea2727f3"));
var addTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("aa39e7ae95c039307079762f43cb3611ac1b6cf18862e5adc26f6867049102a8"));
var updateTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("6173cd1fe22e758b0c8f197a294e71218a1b15abcc3054acc772a54f961047db"));
var deleteTransaction = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("adecb127843d819258aff832faaa7f44cab4268eee6fb8192dfcd1febc450dc3"));
var bulkDeleteTransactions = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("9f91d2566ba9e12efd063aa6816c1aa7d81cb3e07fbf298c6167e15daebb45e5"));
var saveEnvelope = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("56dac13fd12534949759f79a39aae9a8b279f8fd715559519571407308d2013d"));
var deleteEnvelope = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("163e3b9cf65a7e66b040bcaa5614702dd089b4a2d83078f15fc47ab73c012be7"));
var saveCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("eb24a76cee1c19d9eb55f66766a428a086e43c6725512386687e224953f2e64e"));
var saveFixedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("633de36a343e9ea144854cfc1b88aac8c33833bdca69b72879391ce2ac340b04"));
var deleteFixedEvent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("b9a04221f011407ac32070c7729854129aa28ada1bf08a142820cf1c906d6191"));
var importSms = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(createSsrRpc("8da3844c212504bec68c663e83e6c0e846efbcb32efc35cca179f63081d9b78c"));
var resetFinanceData = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("cd4b2a153d1394a2fdb9cb6cb999f6b3e068a3937a00d1d9c7642feb255640d2"));
var askAdvisor = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("0442f5a5cd6cdc5a610ab5f87e9ddf4e87cfefaf5afeacec6c51c6f7bffd4041"));
var KEY = ["finance"];
function useFinance() {
	const query = useQuery({
		queryKey: KEY,
		queryFn: () => getFinanceData()
	});
	const computed = query.data ? computeDashboard(query.data) : null;
	return {
		...query,
		snapshot: query.data,
		computed
	};
}
function wrap(fn) {
	return (data) => fn({ data });
}
function useFinanceMutations() {
	const qc = useQueryClient();
	const setSnap = (data) => qc.setQueryData(KEY, data);
	return {
		addTx: useMutation({
			mutationFn: wrap(addTransaction),
			onSuccess: setSnap
		}),
		updateTx: useMutation({
			mutationFn: wrap(updateTransaction),
			onSuccess: setSnap
		}),
		deleteTx: useMutation({
			mutationFn: wrap(deleteTransaction),
			onSuccess: setSnap
		}),
		bulkDelete: useMutation({
			mutationFn: wrap(bulkDeleteTransactions),
			onSuccess: setSnap
		}),
		saveEnv: useMutation({
			mutationFn: wrap(saveEnvelope),
			onSuccess: setSnap
		}),
		deleteEnv: useMutation({
			mutationFn: wrap(deleteEnvelope),
			onSuccess: setSnap
		}),
		saveCat: useMutation({
			mutationFn: wrap(saveCategory),
			onSuccess: setSnap
		}),
		saveEvent: useMutation({
			mutationFn: wrap(saveFixedEvent),
			onSuccess: setSnap
		}),
		deleteEvent: useMutation({
			mutationFn: wrap(deleteFixedEvent),
			onSuccess: setSnap
		}),
		saveSettings: useMutation({
			mutationFn: wrap(saveSettings),
			onSuccess: setSnap
		}),
		reset: useMutation({
			mutationFn: () => resetFinanceData(),
			onSuccess: setSnap
		}),
		importSms: useMutation({
			mutationFn: (text) => importSms({ data: text }),
			onSuccess: (res) => qc.setQueryData(KEY, res.snap)
		}),
		askAi: useMutation({ mutationFn: () => askAdvisor() })
	};
}
//#endregion
export { useFinance as a, ThemeSync as i, AuthGuard as n, useFinanceMutations as o, Card as r, AppShell as t };
