"use client";

import type { ReactNode } from "react";
import { compact, timeAgo } from "@/lib/format";
import type { Stats } from "@/lib/types";
import { ClockIcon, FileTextIcon, GithubIcon, SmileIcon, ZapIcon } from "./Icons";

interface HeroProps {
  stats: Stats | null;
  newThisWeek: number | null;
  running: boolean;
}

interface Tile {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent: string;
}

export function Hero({ stats, newThisWeek, running }: HeroProps) {
  const tiles: Tile[] = [
    {
      label: "New this week",
      value: newThisWeek === null ? "—" : compact(newThisWeek),
      hint: "published in the last 7 days",
      icon: <ZapIcon size={15} />,
      accent: "text-accent-2",
    },
    {
      label: "GitHub repos",
      value: stats ? compact(stats.by_source.github ?? 0) : "—",
      icon: <GithubIcon size={15} />,
      accent: "text-github",
    },
    {
      label: "Hugging Face",
      value: stats ? compact(stats.by_source.huggingface ?? 0) : "—",
      hint: stats
        ? `${compact(stats.by_kind.model ?? 0)} models · ${compact(stats.by_kind.dataset ?? 0)} datasets · ${compact(stats.by_kind.space ?? 0)} spaces`
        : undefined,
      icon: <SmileIcon size={15} />,
      accent: "text-hf",
    },
    {
      label: "arXiv papers",
      value: stats ? compact(stats.by_source.arxiv ?? 0) : "—",
      icon: <FileTextIcon size={15} />,
      accent: "text-arxiv",
    },
    {
      label: running ? "Refreshing now" : "Last refresh",
      value: stats ? (running ? "live" : timeAgo(stats.last_ingest)) : "—",
      hint: stats ? `${compact(stats.total)} items indexed` : undefined,
      icon: <ClockIcon size={15} />,
      accent: "text-accent",
    },
  ];

  return (
    <section className="pt-10 pb-2 sm:pt-14">
      <div className="max-w-3xl animate-rise">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          <span className={`h-1.5 w-1.5 rounded-full bg-accent-2 ${running ? "animate-pulse-dot" : ""}`} />
          Robotics · Computer vision · Embodied AI
        </p>
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          What&apos;s new in <span className="text-gradient">embodied intelligence</span>
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-fg-2 sm:text-base">
          One feed for new repositories, models, datasets, demo spaces and papers from GitHub, Hugging Face
          and arXiv. Everything is tagged with a shared taxonomy and ranked by freshness and traction.
        </p>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t, i) => (
          <div
            key={t.label}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 shadow-card backdrop-blur-sm transition hover:border-border-strong animate-rise"
            style={{ animationDelay: `${60 + i * 50}ms` }}
          >
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
              <span className={t.accent}>{t.icon}</span>
              {t.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{t.value}</dd>
            {t.hint && <dd className="mt-0.5 truncate text-[11px] text-muted">{t.hint}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
