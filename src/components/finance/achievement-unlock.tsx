"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CategoryIcon } from "@/lib/finance/icons";
import {
  ACHIEVEMENT_DEFS,
  RARITY_COLORS,
  RARITY_LABELS,
  titleForLevel,
  type AchievementRarity,
} from "@/lib/finance/gamification";
import type { FinanceSnapshot } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const SEEN_KEY = "fintracker:seen-achievements";
const SEEN_LEVEL_KEY = "fintracker:seen-level";

type UnlockItem =
  | {
      kind: "achievement";
      code: string;
      name: string;
      description: string;
      icon: string;
      rarity: AchievementRarity;
      xpReward: number;
    }
  | {
      kind: "level";
      level: number;
      title: string;
      totalXp: number;
    };

function loadSeenCodes(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenCodes(codes: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...codes]));
  } catch {
    /* ignore */
  }
}

function loadSeenLevel(): number {
  try {
    const v = localStorage.getItem(SEEN_LEVEL_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

function saveSeenLevel(level: number) {
  try {
    localStorage.setItem(SEEN_LEVEL_KEY, String(level));
  } catch {
    /* ignore */
  }
}

/** Lightweight canvas confetti — no external deps */
function useConfetti(active: boolean, color: string, intensity: number) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      color,
      "#fff",
      "#FBBF24",
      "#A78BFA",
      "#60A5FA",
      "#34D399",
      "#F472B6",
    ];
    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
      rot: number;
      vr: number;
      color: string;
      life: number;
      shape: "rect" | "circle" | "strip";
    };

    const count = Math.min(180, 40 + intensity * 30);
    const particles: Particle[] = [];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.38;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 4 + Math.random() * 10 + intensity * 2;
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed * (0.6 + Math.random()),
        vy: Math.sin(angle) * speed * 0.5 - 6 - Math.random() * 6,
        w: 4 + Math.random() * 8,
        h: 3 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        shape: (["rect", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
      });
    }

    let start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = 0;
      for (const p of particles) {
        p.vy += 0.18;
        p.vx *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - t / 2.8);
        if (p.life <= 0) continue;
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "strip") {
          ctx.fillRect(-p.w / 2, -1, p.w * 1.6, 2.5);
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (alive > 0 && t < 3) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, color, intensity]);

  return canvasRef;
}

function rarityIntensity(r: AchievementRarity): number {
  switch (r) {
    case "common":
      return 1;
    case "uncommon":
      return 1.5;
    case "rare":
      return 2;
    case "epic":
      return 2.8;
    case "legendary":
      return 3.5;
    default:
      return 1;
  }
}

function AchievementCard({ item }: { item: Extract<UnlockItem, { kind: "achievement" }> }) {
  const color = RARITY_COLORS[item.rarity];
  return (
    <div
      className="ach-unlock-card relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center"
      style={
        {
          "--ach-color": color,
          boxShadow: `0 0 0 1px ${color}44, 0 20px 60px ${color}33, 0 0 80px ${color}22`,
        } as CSSProperties
      }
    >
      <div className="ach-unlock-shine pointer-events-none absolute inset-0" />
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color }}
      >
        {RARITY_LABELS[item.rarity]}
      </p>
      <div
        className="ach-unlock-icon mx-auto mt-4 flex size-20 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${color}55, ${color}18)`,
          color,
          boxShadow: `0 0 40px ${color}55, inset 0 0 20px ${color}22`,
        }}
      >
        <CategoryIcon name={item.icon} className="size-10" />
      </div>
      <h2 className="mt-5 font-display text-2xl tracking-tight text-fg">{item.name}</h2>
      <p className="mt-2 text-sm text-muted">{item.description}</p>
      <div
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums"
        style={{ background: `${color}22`, color }}
      >
        +{item.xpReward} XP
      </div>
    </div>
  );
}

function LevelCard({ item }: { item: Extract<UnlockItem, { kind: "level" }> }) {
  return (
    <div
      className="ach-unlock-card relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center"
      style={
        {
          "--ach-color": "#FBBF24",
          boxShadow:
            "0 0 0 1px #FBBF2444, 0 20px 60px #FBBF2433, 0 0 80px #FBBF2422",
        } as CSSProperties
      }
    >
      <div className="ach-unlock-shine pointer-events-none absolute inset-0" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
        Новый уровень
      </p>
      <div
        className="ach-unlock-icon mx-auto mt-4 flex size-20 items-center justify-center rounded-full text-3xl font-display font-semibold tabular-nums"
        style={{
          background: "radial-gradient(circle at 30% 30%, #FBBF2455, #FBBF2418)",
          color: "#FBBF24",
          boxShadow: "0 0 40px #FBBF2455, inset 0 0 20px #FBBF2422",
        }}
      >
        {item.level}
      </div>
      <h2 className="mt-5 font-display text-2xl tracking-tight text-fg">{item.title}</h2>
      <p className="mt-2 text-sm text-muted">Всего {item.totalXp} XP · продолжайте в том же духе!</p>
    </div>
  );
}

function UnlockOverlay({
  queue,
  onDone,
}: {
  queue: UnlockItem[];
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const item = queue[index];

  const rarity: AchievementRarity =
    item?.kind === "achievement" ? item.rarity : "legendary";
  const color = item?.kind === "achievement" ? RARITY_COLORS[item.rarity] : "#FBBF24";
  const intensity = item?.kind === "achievement" ? rarityIntensity(item.rarity) : 3;
  const canvasRef = useConfetti(phase === "show" || phase === "enter", color, intensity);

  useEffect(() => {
    setPhase("enter");
    const t1 = window.setTimeout(() => setPhase("show"), 50);
    return () => clearTimeout(t1);
  }, [index]);

  // Auto-advance after long pause (user can also dismiss)
  useEffect(() => {
    if (phase !== "show") return;
    const t = window.setTimeout(() => {
      setPhase("exit");
    }, 4200);
    return () => clearTimeout(t);
  }, [phase, index]);

  useEffect(() => {
    if (phase !== "exit") return;
    const t = window.setTimeout(() => {
      if (index + 1 < queue.length) {
        setIndex((i) => i + 1);
      } else {
        onDone();
      }
    }, 320);
    return () => clearTimeout(t);
  }, [phase, index, queue.length, onDone]);

  if (!item) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center p-4",
        phase === "exit" && "ach-unlock-fade-out",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={item.kind === "level" ? "Новый уровень" : "Достижение открыто"}
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => setPhase("exit")}
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
      />
      <div
        className={cn(
          "relative z-[2] w-full max-w-sm",
          phase === "enter" && "ach-unlock-pop-in",
          phase === "show" && "ach-unlock-idle",
          phase === "exit" && "ach-unlock-pop-out",
        )}
      >
        {item.kind === "achievement" ? (
          <AchievementCard item={item} />
        ) : (
          <LevelCard item={item} />
        )}
        <button
          type="button"
          onClick={() => setPhase("exit")}
          className="mt-4 w-full rounded-xl bg-elevated/90 px-4 py-2.5 text-sm font-medium text-fg backdrop-blur transition hover:bg-elevated"
        >
          {index + 1 < queue.length ? "Далее" : "Отлично!"}
          {queue.length > 1 && (
            <span className="ml-2 text-muted">
              {index + 1}/{queue.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Watches finance snapshot for newly unlocked achievements & level-ups.
 * Shows celebratory overlay with confetti. Mount once in AppShell.
 */
export function AchievementUnlockWatcher({
  snapshot,
}: {
  snapshot: FinanceSnapshot | undefined;
}) {
  const [queue, setQueue] = useState<UnlockItem[]>([]);
  const primed = useRef(false);
  const prevCodes = useRef<Set<string>>(new Set());
  const prevLevel = useRef(0);

  // Seed seen set on first snapshot so we don't replay old unlocks
  useEffect(() => {
    if (!snapshot || primed.current) return;
    primed.current = true;

    const existing = loadSeenCodes();
    for (const a of snapshot.achievements) existing.add(a.code);
    saveSeenCodes(existing);
    prevCodes.current = new Set(snapshot.achievements.map((a) => a.code));

    const lvl = snapshot.settings.level ?? 1;
    const seenLvl = loadSeenLevel();
    if (seenLvl < lvl) saveSeenLevel(lvl);
    prevLevel.current = Math.max(seenLvl, lvl);
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot || !primed.current) return;

    const next: UnlockItem[] = [];
    const seen = loadSeenCodes();
    const defsByCode = new Map(ACHIEVEMENT_DEFS.map((d) => [d.code, d]));

    for (const a of snapshot.achievements) {
      if (seen.has(a.code) || prevCodes.current.has(a.code)) continue;
      const def = defsByCode.get(a.code);
      next.push({
        kind: "achievement",
        code: a.code,
        name: a.name,
        description: a.description,
        icon: a.icon,
        rarity: (a.rarity as AchievementRarity) || def?.rarity || "common",
        xpReward: a.xpReward ?? def?.xpReward ?? 0,
      });
      seen.add(a.code);
    }

    const level = snapshot.settings.level ?? 1;
    if (level > prevLevel.current) {
      next.push({
        kind: "level",
        level,
        title: snapshot.settings.title || titleForLevel(level),
        totalXp: snapshot.settings.totalXp ?? 0,
      });
      saveSeenLevel(level);
      prevLevel.current = level;
    }

    if (next.length) {
      // Legendary / epic first for drama
      next.sort((a, b) => {
        const rank = (x: UnlockItem) => {
          if (x.kind === "level") return 100;
          const order: Record<AchievementRarity, number> = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5,
          };
          return order[x.rarity] ?? 0;
        };
        return rank(b) - rank(a);
      });
      saveSeenCodes(seen);
      prevCodes.current = new Set(snapshot.achievements.map((a) => a.code));
      setQueue((q) => [...q, ...next]);
    } else {
      prevCodes.current = new Set(snapshot.achievements.map((a) => a.code));
    }
  }, [snapshot]);

  const onDone = useCallback(() => setQueue([]), []);

  // Soft toast strip for when queue is processing — optional secondary
  const active = queue[0];

  return (
    <>
      {queue.length > 0 && <UnlockOverlay queue={queue} onDone={onDone} />}
      {/* Tiny corner pulse when something just unlocked but overlay not yet — skipped, overlay is enough */}
      {active && active.kind === "achievement" && null}
    </>
  );
}

/** Compact inline toast for stats page when clicking a locked card — optional future */
export function achievementRarityGlow(rarity: AchievementRarity): string {
  return RARITY_COLORS[rarity];
}
