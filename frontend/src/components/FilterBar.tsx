"use client";

import { useEffect, useState } from "react";
import type { Filters } from "@/lib/useFilters";
import { DAY_OPTIONS, KINDS, SORTS, SOURCES, type SortKey } from "@/lib/types";
import { Chip } from "./Chip";

interface FilterBarProps {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  toggle: (key: "source" | "kind" | "tag", value: string) => void;
  reset: () => void;
  isDefault: boolean;
}

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function FilterBar({ filters, update, toggle, reset, isDefault }: FilterBarProps) {
  const [draft, setDraft] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);

  // Keep the input in sync when the URL changes from elsewhere (back button, reset).
  // Adjusting state during render is React's recommended pattern for this.
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    setDraft(filters.q);
  }

  // Debounce typing before it hits the URL and the API.
  useEffect(() => {
    if (draft === filters.q) return;
    const handle = setTimeout(() => update({ q: draft.trim() }), 300);
    return () => clearTimeout(handle);
  }, [draft, filters.q, update]);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search titles, descriptions, authors, tags…"
          aria-label="Search"
          className="w-full flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex gap-2">
          <select
            aria-label="Time window"
            value={filters.days === null ? "all" : String(filters.days)}
            onChange={(e) => update({ days: e.target.value === "all" ? null : Number(e.target.value) })}
            className={selectClass}
          >
            {DAY_OPTIONS.map((o) => (
              <option key={o.label} value={o.value === null ? "all" : o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortKey })}
            className={selectClass}
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-zinc-500">Source</span>
        {SOURCES.map((s) => (
          <Chip key={s.value} active={filters.source.includes(s.value)} onClick={() => toggle("source", s.value)}>
            {s.label}
          </Chip>
        ))}
        <span className="ml-2 text-xs uppercase tracking-wide text-zinc-500">Type</span>
        {KINDS.map((k) => (
          <Chip key={k.value} active={filters.kind.includes(k.value)} onClick={() => toggle("kind", k.value)}>
            {k.label}
          </Chip>
        ))}
        {!isDefault && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
