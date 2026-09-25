import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatDayShort, n as cn, o as formatRub, u as todayISO } from "./utils-2ReNRrU5.mjs";
import { S as Bot, d as Pencil, f as MessageSquareText, i as Trash2, o as Sparkles } from "../_libs/lucide-react.mjs";
import { n as Button } from "./router-CQ_Rpc8n.mjs";
import { a as useFinance, i as ThemeSync, n as AuthGuard, o as useFinanceMutations, r as Card, t as AppShell } from "./use-finance-DgeZ3jhZ.mjs";
import { t as CategoryIcon } from "./icons-BldSz5FI.mjs";
import { t as EnvelopeCircle } from "./envelope-circle-Bsj9cP_7.mjs";
import { n as Label, r as Textarea, t as Input } from "./input-P21tvurh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DIdujlm_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AddExpenseForm({ categories, envelopes, pending, onAdd }) {
	const [amount, setAmount] = (0, import_react.useState)("");
	const [comment, setComment] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)(todayISO());
	const [categoryId, setCategoryId] = (0, import_react.useState)(categories[0]?.id ?? null);
	const [envelopeId, setEnvelopeId] = (0, import_react.useState)(null);
	const [kind, setKind] = (0, import_react.useState)("expense");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-3",
		onSubmit: (e) => {
			e.preventDefault();
			const n = Number(amount.replace(",", "."));
			if (!Number.isFinite(n) || n <= 0) return;
			onAdd({
				amount: n,
				type: kind,
				description: comment.trim() || "Без названия",
				transactionDate: date,
				categoryId: kind === "expense" ? categoryId : null,
				envelopeId: kind === "expense" ? envelopeId : null
			});
			setAmount("");
			setComment("");
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setKind("expense"),
					className: cn("h-9 flex-1 rounded-[10px] text-sm font-medium", kind === "expense" ? "bg-accent text-accent-fg" : "bg-elevated text-muted"),
					children: "Расход"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setKind("income"),
					className: cn("h-9 flex-1 rounded-[10px] text-sm font-medium", kind === "income" ? "bg-accent text-accent-fg" : "bg-elevated text-muted"),
					children: "Доход"
				})]
			}),
			kind === "expense" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "-mx-1 flex gap-2 overflow-x-auto pb-1",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						setCategoryId(c.id);
						setEnvelopeId(null);
					},
					className: cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium", categoryId === c.id && envelopeId == null ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated text-fg"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
						name: c.icon,
						className: "size-3.5"
					}), c.name]
				}, c.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "-mx-1 flex gap-2 overflow-x-auto pb-1",
				children: envelopes.map((env) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setEnvelopeId(env.id);
						setCategoryId(null);
					},
					className: cn("flex size-11 shrink-0 items-center justify-center rounded-full border", envelopeId === env.id ? "border-accent bg-accent text-accent-fg" : "border-border bg-elevated"),
					title: env.name,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
						name: env.icon,
						className: "size-4"
					})
				}, env.id))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "amt",
					children: "Сумма"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "amt",
					inputMode: "decimal",
					value: amount,
					onChange: (e) => setAmount(e.target.value),
					placeholder: "0",
					required: true
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "dt",
					children: "Дата"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "dt",
					type: "date",
					value: date,
					onChange: (e) => setDate(e.target.value)
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "cm",
				children: "Комментарий"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: "cm",
				value: comment,
				onChange: (e) => setComment(e.target.value),
				placeholder: "Без названия"
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "w-full",
				disabled: pending,
				children: kind === "expense" ? "Добавить расход" : "Добавить доход"
			})
		]
	});
}
function ExpenseHeatmap({ days }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [tip, setTip] = (0, import_react.useState)(null);
	const max = (0, import_react.useMemo)(() => Math.max(1, ...days.map((d) => d.amount)), [days]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "flex w-full items-center justify-between text-sm font-medium",
		onClick: () => setOpen((v) => !v),
		children: ["Тепловая карта (90 дней)", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: open ? "Скрыть" : "Показать"
		})]
	}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-10 gap-1",
			children: days.map((d) => {
				const t = d.amount / max;
				const opacity = d.amount === 0 ? .08 : .2 + t * .8;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					title: `${d.date}: ${formatRub(d.amount)}`,
					onClick: () => setTip(d),
					className: "aspect-square rounded-[4px] bg-accent",
					style: { opacity }
				}, d.date);
			})
		}), tip && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-xs text-muted",
			children: [
				tip.date,
				": ",
				formatRub(tip.amount)
			]
		})]
	})] });
}
function TransactionList({ groups, categories, envelopes, onEdit, onDelete, onBulkDay }) {
	const [open, setOpen] = (0, import_react.useState)({});
	const [limit, setLimit] = (0, import_react.useState)(3);
	const visible = groups.slice(0, limit);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Операций пока нет."
			}),
			visible.map((g) => {
				const expanded = open[g.date] !== false;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex w-full items-center justify-between py-1 text-left",
					onClick: () => setOpen((s) => ({
						...s,
						[g.date]: !expanded
					})),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium",
						children: formatDayShort(g.date)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: g.items.length
					})]
				}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-1",
					children: [g.items.map((t) => {
						const cat = categories.find((c) => c.id === t.categoryId);
						const env = envelopes.find((e) => e.id === t.envelopeId);
						const icon = env?.icon ?? cat?.icon ?? "ellipsis";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2 rounded-[16px] bg-elevated px-3 py-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid size-9 place-items-center rounded-full bg-surface",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryIcon, {
										name: icon,
										className: "size-4"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-medium",
										children: t.description
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[11px] text-muted",
										children: env?.name ?? cat?.name ?? "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: `font-mono text-sm tabular-nums ${t.type === "income" ? "text-ok" : "text-fg"}`,
									children: [t.type === "income" ? "+" : "−", formatRub(t.amount)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "p-1 text-muted",
									onClick: () => onEdit(t),
									"aria-label": "Изменить",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "p-1 text-muted",
									onClick: () => onDelete(t.id),
									"aria-label": "Удалить",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						}, t.id);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-xs text-danger",
						onClick: () => {
							if (confirm("Удалить все операции за этот день?")) onBulkDay(g.date);
						},
						children: "Удалить день"
					}) })]
				})] }, g.date);
			}),
			groups.length > limit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				className: "w-full",
				onClick: () => setLimit(groups.length),
				children: "Показать все операции"
			})
		]
	});
}
function EditTxDialog({ tx, onClose, onSave }) {
	const [amount, setAmount] = (0, import_react.useState)(tx ? String(tx.amount) : "");
	const [desc, setDesc] = (0, import_react.useState)(tx?.description ?? "");
	const [date, setDate] = (0, import_react.useState)(tx?.transactionDate ?? "");
	if (!tx) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-end bg-fg/40 p-4 sm:place-items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-[28px] bg-surface p-5",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg",
					children: "Редактировать"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: amount,
							onChange: (e) => setAmount(e.target.value),
							inputMode: "decimal"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: desc,
							onChange: (e) => setDesc(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "flex-1",
						onClick: onClose,
						children: "Отмена"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						onClick: () => onSave({
							...tx,
							amount: Number(amount.replace(",", ".")),
							description: desc,
							transactionDate: date
						}),
						children: "Сохранить"
					})]
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthGuard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, {}) });
}
function Dashboard() {
	const { snapshot, computed, isPending, error } = useFinance();
	const mut = useFinanceMutations();
	const [edit, setEdit] = (0, import_react.useState)(null);
	const [smsOpen, setSmsOpen] = (0, import_react.useState)(false);
	const [aiOpen, setAiOpen] = (0, import_react.useState)(false);
	const [smsText, setSmsText] = (0, import_react.useState)("");
	const [smsReport, setSmsReport] = (0, import_react.useState)(null);
	if (isPending || !snapshot || !computed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Сегодня",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-[28px] bg-surface" })
	});
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Сегодня",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-danger",
			children: "Не удалось загрузить данные."
		})
	});
	const bar = Math.min(100, computed.progressPercent) / 100;
	const barColor = computed.progressTone === "green" ? "var(--color-ok)" : computed.progressTone === "yellow" ? "var(--color-warn)" : "var(--color-danger)";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Сегодня",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSync, { snapshot }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-wide text-muted",
								children: "Осталось на сегодня"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 font-display text-4xl tabular-nums tracking-tight",
								children: formatRub(computed.remainingToday)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 h-2 overflow-hidden rounded-full bg-elevated",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full rounded-full transition-[width] duration-300",
									style: {
										width: `${bar * 100}%`,
										background: barColor
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs text-muted",
								children: [
									"Лимит ",
									formatRub(computed.dailyLimit),
									" · потрачено ",
									formatRub(computed.spentToday)
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Дневной план",
								value: formatRub(computed.dailyLimit)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Потрачено",
								value: formatRub(computed.spentToday)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Баланс",
								value: formatRub(computed.currentBalance)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Дней осталось",
								value: String(computed.daysRemaining)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Цель",
								value: formatRub(snapshot.settings.finalTarget)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Серия",
								value: `${computed.currentStreak} дн.`
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "Совет"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: computed.aiTip
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg",
								children: "Конверты"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/envelopes",
								className: "text-xs font-medium text-accent",
								children: "Управление"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto pb-1",
							children: computed.envelopes.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnvelopeCircle, { item: e }, e.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-xs text-muted",
							children: ["Свободные: ", formatRub(computed.freeMoney)]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 font-display text-lg",
						children: "Быстрый расход"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddExpenseForm, {
						categories: snapshot.categories,
						envelopes: snapshot.envelopes,
						pending: mut.addTx.isPending,
						onAdd: (d) => mut.addTx.mutate(d)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: () => setSmsOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquareText, { className: "size-4" }), " SMS"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: () => setAiOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), " AI-совет"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/stats",
								className: "col-span-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "secondary",
									className: "w-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), " Статистика"]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/settings",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									className: "w-full",
									children: "Настройки"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-3 font-display text-lg",
						children: "История"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionList, {
						groups: computed.transactionsByDay,
						categories: snapshot.categories,
						envelopes: snapshot.envelopes,
						onEdit: setEdit,
						onDelete: (id) => mut.deleteTx.mutate({ id }),
						onBulkDay: (day) => mut.bulkDelete.mutate({ day })
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExpenseHeatmap, { days: computed.heatmap }) })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditTxDialog, {
				tx: edit,
				onClose: () => setEdit(null),
				onSave: (t) => {
					mut.updateTx.mutate({
						id: t.id,
						amount: t.amount,
						description: t.description,
						transactionDate: t.transactionDate,
						categoryId: t.categoryId,
						envelopeId: t.envelopeId
					});
					setEdit(null);
				}
			}, edit?.id ?? "none"),
			smsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Импорт SMS",
				onClose: () => setSmsOpen(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-sm text-muted",
						children: "Вставьте текст сообщений банка. Сумма ищется по словам «оплата», «покупка», «списание»."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: smsText,
						onChange: (e) => setSmsText(e.target.value),
						placeholder: "Покупка 1250.00 RUB Пятёрочка"
					}),
					smsReport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm",
						children: smsReport
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						disabled: mut.importSms.isPending,
						onClick: async () => {
							const res = await mut.importSms.mutateAsync({ text: smsText });
							setSmsReport(`Успешно добавлено операций: ${res.successCount}`);
							setSmsText("");
						},
						children: "Разобрать и добавить"
					})
				]
			}),
			aiOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Modal, {
				title: "Финансовый советник",
				onClose: () => setAiOpen(false),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Анализ расходов за 30 дней. Запрос выполняется только по кнопке."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						disabled: mut.askAi.isPending,
						onClick: () => mut.askAi.mutate(),
						children: "Получить 3 совета"
					}),
					mut.askAi.data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 whitespace-pre-wrap text-sm leading-relaxed",
						children: mut.askAi.data.ok ? mut.askAi.data.text : mut.askAi.data.error
					})
				]
			})
		]
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] uppercase tracking-wide text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-mono text-sm tabular-nums",
			children: value
		})]
	});
}
function Modal({ title, children, onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 grid place-items-end bg-fg/40 p-4 sm:place-items-center",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-[28px] bg-surface p-5",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-lg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children
			})]
		})
	});
}
//#endregion
export { Home as component };
