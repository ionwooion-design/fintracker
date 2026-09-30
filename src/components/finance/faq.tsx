import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is",
    question: "Что такое FinTracker PRO?",
    answer:
      "Это персональный трекер бюджета с «конвертами», дневным лимитом и геймификацией. Вы задаёте период, стартовый баланс и цель — приложение считает, сколько можно тратить каждый день, и помогает не выходить за рамки.",
  },
  {
    id: "envelopes",
    question: "Что такое конверты?",
    answer:
      "Конверты — категории бюджета с фиксированной суммой на период (например, «Продукты 15 000 ₽»). Расходы, привязанные к конверту, уменьшают его остаток. Деньги вне конвертов — «свободные»; их можно распределить или оставить как резерв.",
  },
  {
    id: "daily-limit",
    question: "Как считается дневной лимит?",
    answer:
      "Лимит = (текущий баланс − целевой остаток − зарезервированные конверты − будущие фиксированные расходы) ÷ число оставшихся дней. При добавлении расхода «Осталось на сегодня» уменьшается. Серия (streak) растёт, если вы не превышаете лимит.",
  },
  {
    id: "xp-levels",
    question: "Как работают уровни и XP?",
    answer:
      "За операции, дни в лимите, конверты, цели и достижения начисляется опыт. Уровни 1–100 с растущей кривой XP. Титул меняется с уровнем (Новичок → … → Бессмертный). На вкладке «Стат.» видно прогресс и галерею ачивок.",
  },
  {
    id: "achievements",
    question: "Как открыть достижения?",
    answer:
      "Автоматически: серия дней в лимите, число операций, конверты, цели, импорт SMS и др. Секретные ачивки скрыты до открытия. При разблокировке показывается анимация с конфетти.",
  },
  {
    id: "sms",
    question: "Как импортировать SMS из банка?",
    answer:
      "На главной откройте блок SMS, вставьте текст уведомлений банка и нажмите «Разобрать». Приложение попробует извлечь суммы и описания. Проверьте результат перед сохранением — распознавание эвристическое.",
  },
  {
    id: "recurring",
    question: "Что такое регулярные операции?",
    answer:
      "Подписки и зарплата, которые повторяются (ежедневно / еженедельно / ежемесячно). Настраиваются в «Ещё» → Регулярные. Их можно поставить на паузу. Фиксированные события — разовые платежи на конкретную дату.",
  },
  {
    id: "period",
    question: "Как начать новый бюджетный период?",
    answer:
      "В настройках задайте даты начала и конца. За 3 дня до окончания и в день конца на главной появится баннер. Можно сбросить только операции или продолжить с текущим балансом — в зависимости от выбранного действия.",
  },
  {
    id: "currency",
    question: "Можно ли сменить валюту?",
    answer:
      "Да, в «Ещё» → Блок периода / валюта. Отображение сумм переключится (₽, $, € и др.). Сами цифры в базе не конвертируются — меняется только формат.",
  },
  {
    id: "privacy",
    question: "Где хранятся мои данные?",
    answer:
      "Данные привязаны к вашему аккаунту и серверу приложения. Сброс в «Опасной зоне» удаляет операции, конверты, события и прогресс достижений, но не профиль входа.",
  },
];

function FaqRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 py-3 text-left"
      >
        <span className="mt-0.5 flex-1 text-sm font-medium text-fg">{item.question}</span>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={1.8}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-3 pr-6 text-sm leading-relaxed text-muted">{item.answer}</p>
        </div>
      </div>
    </div>
  );
}

export function FaqPanel({ className }: { className?: string }) {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <Card className={className}>
      <div className="mb-1 flex items-center gap-2">
        <HelpCircle className="size-5 text-accent" strokeWidth={1.8} />
        <h2 className="font-display text-lg">FAQ</h2>
      </div>
      <p className="mb-2 text-xs text-muted">Частые вопросы о бюджете, конвертах и прогрессе</p>
      <div>
        {FAQ_ITEMS.map((item) => (
          <FaqRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
          />
        ))}
      </div>
    </Card>
  );
}
