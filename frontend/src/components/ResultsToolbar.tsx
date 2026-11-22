"use client";

import { KIND_LABEL, SOURCE_LABEL } from "@/lib/format";
import { SORTS, type Kind, type Source } from "@/lib/types";
import { DEFAULT_DAYS, type Filters } from "@/lib/useFilters";
import { GridIcon, ListIcon, SlidersIcon, XIcon } from "./Icons";

export type ViewMode = "grid" | "list";

interface ResultsToolbarProps {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  toggle: (key: "source" | "kind" | "tag", value: string) => void;
  total: number | null;
  loading: boolean;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onOpenFilters: () => void;
}

interface Pill {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ResultsToolbar({ filters, update, toggle, total, loading, view, onView, onOpenFilters }: ResultsToolbarProps) {
  const pills: Pill[] = [];
  if (filters.q) pills.push({ key: "q", label: `“${filters.q}”`, onRemove: () => update({ q: "" }) });
  for (const s of filters.source) pills.push({ key: `s-${s}`, label: SOURCE_LABEL[s as Source] ?? s, onRemove: () => toggle("source", s) });
  for (const k of filters.kind) pills.push({ key: `k-${k}`, label: KIND_LABEL[k as Kind] ?? k, onRemove: () => toggle("kind", k) });
  for (const t of filters.tag) pills.push({ key: `t-${t}`, label: `#${t}`, onRemove: () => toggle("tag", t) });
  if (filters.days !== DEFAULT_DAYS)
    pills.push({ key: "days", label: filters.days === null ? "all time" : `last ${filters.days} days`, onRemove: () => update({ days: DEFAULT_DAYS }) });
  if (filters.sort !== "score")
    pills.push({ key: "sort", label: SORTS.find((s) => s.value === filters.sort)?.label ?? filters.sort, onRemove: () => update({ sort: "score" }) });

  const activeCount = filters.source.length + filters.kind.length + filters.tag.length + (filters.days !== DEFAULT_DAYS ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm text-fg-2">
          {total === null ? (
            <span className="skeleton inline-block h-4 w-24 align-middle" />
          ) : (
            <>
              <span className="font-semibold tabular-nums text-fg">{total.toLocaleString()}</span> result{total === 1 ? "" : "s"}
              {loading && <span className="ml-2 text-xs text-muted">updating…</span>}
            </>
          )}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-fg-2 hover:text-fg lg:hidden"
          >
            <SlidersIcon size={14} />
            Filters
            {activeCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">{activeCount}</span>
            )}
          </button>
          <div className="flex rounded-lg border border-border bg-surface p-0.5" role="group" aria-label="Layout">
            {(
              [
                ["grid", GridIcon, "Grid"],
                ["list", ListIcon, "List"],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onView(mode)}
                aria-pressed={view === mode}
                aria-label={`${label} layout`}
                title={`${label} layout`}
                className={`grid h-7 w-7 place-items-center rounded-md transition ${
                  view === mode ? "bg-surface-3 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {pills.length > 0 && (
        <ul className="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={p.onRemove}
                className="group inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-fg transition hover:border-accent/60"
                title="Remove filter"
              >
                {p.label}
                <XIcon size={12} className="text-muted group-hover:text-fg" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
