"use client";

import { compact, SOURCE_LABEL, timeAgo } from "@/lib/format";
import type { Source, Stats } from "@/lib/types";

interface StatsBarProps {
  stats: Stats | null;
  onRefresh: () => void;
  refreshing: boolean;
  error: string | null;
}

export function StatsBar({ stats, onRefresh, refreshing, error }: StatsBarProps) {
  const running = refreshing || stats?.is_running === true;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
      {stats ? (
        <>
          <span>
            <strong className="text-zinc-900 dark:text-zinc-100">{compact(stats.total)}</strong> items
          </span>
          {Object.entries(stats.by_source).map(([source, n]) => (
            <span key={source}>
              {SOURCE_LABEL[source as Source] ?? source} {compact(n)}
            </span>
          ))}
          <span>Last refresh {timeAgo(stats.last_ingest)}</span>
        </>
      ) : (
        <span>{error ? "Backend unreachable" : "Loading stats…"}</span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={running}
        className="ml-auto rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {running ? "Refreshing…" : "Refresh sources"}
      </button>
    </div>
  );
}
