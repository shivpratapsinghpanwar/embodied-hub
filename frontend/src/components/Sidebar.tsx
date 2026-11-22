"use client";

import { useState, type ReactNode } from "react";
import { compact } from "@/lib/format";
import type { Filters } from "@/lib/useFilters";
import { DAY_OPTIONS, KINDS, SORTS, SOURCES, type SortKey, type Stats, type TagCount } from "@/lib/types";
import { CheckIcon, KIND_ICON, SOURCE_ICON, XIcon } from "./Icons";

interface SidebarProps {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  toggle: (key: "source" | "kind" | "tag", value: string) => void;
  reset: () => void;
  isDefault: boolean;
  stats: Stats | null;
  tags: TagCount[];
  open: boolean;
  onClose: () => void;
}

const SOURCE_TONE: Record<string, string> = {
  github: "text-github",
  huggingface: "text-hf",
  arxiv: "text-arxiv",
};

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function CheckRow({
  active,
  onClick,
  icon,
  label,
  count,
  tone = "",
}: {
  active: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  count?: number;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
        active ? "bg-accent-soft text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
      }`}
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition ${
          active ? "border-accent bg-accent text-white" : "border-border-strong bg-surface group-hover:border-muted"
        }`}
      >
        {active && <CheckIcon size={11} strokeWidth={3} />}
      </span>
      {icon && <span className={`shrink-0 ${tone}`}>{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums text-muted">{compact(count)}</span>}
    </button>
  );
}

export function Sidebar({ filters, update, toggle, reset, isDefault, stats, tags, open, onClose }: SidebarProps) {
  const [tagQuery, setTagQuery] = useState("");

  const known = new Set(tags.map((t) => t.tag));
  const extras = filters.tag.filter((t) => !known.has(t)).map((tag) => ({ tag, count: 0 }));
  const allTags = [...extras, ...tags];
  const maxCount = Math.max(1, ...tags.map((t) => t.count));
  const visibleTags = tagQuery ? allTags.filter((t) => t.tag.includes(tagQuery.toLowerCase())) : allTags;

  const body = (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between lg:hidden">
        <h2 className="text-base font-semibold">Filters</h2>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close filters">
          <XIcon size={18} />
        </button>
      </div>

      <Section
        title="Time window"
        action={
          !isDefault && (
            <button type="button" onClick={reset} className="text-[11px] font-medium text-accent hover:underline">
              Clear all
            </button>
          )
        }
      >
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-2 p-1">
          {DAY_OPTIONS.map((o) => {
            const active = filters.days === o.value;
            return (
              <button
                key={o.label}
                type="button"
                onClick={() => update({ days: o.value })}
                aria-pressed={active}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  active ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg"
                }`}
              >
                {o.value === null ? "All" : `${o.value}d`}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Sort by">
        <div className="flex flex-col gap-0.5">
          {SORTS.map((s) => (
            <CheckRow
              key={s.value}
              active={filters.sort === s.value}
              onClick={() => update({ sort: s.value as SortKey })}
              label={s.label}
            />
          ))}
        </div>
      </Section>

      <Section title="Source">
        <div className="flex flex-col gap-0.5">
          {SOURCES.map((s) => {
            const Icon = SOURCE_ICON[s.value];
            return (
              <CheckRow
                key={s.value}
                active={filters.source.includes(s.value)}
                onClick={() => toggle("source", s.value)}
                icon={<Icon size={14} />}
                tone={SOURCE_TONE[s.value]}
                label={s.label}
                count={stats?.by_source[s.value]}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-0.5">
          {KINDS.map((k) => {
            const Icon = KIND_ICON[k.value];
            return (
              <CheckRow
                key={k.value}
                active={filters.kind.includes(k.value)}
                onClick={() => toggle("kind", k.value)}
                icon={<Icon size={14} />}
                label={k.label}
                count={stats?.by_kind[k.value]}
              />
            );
          })}
        </div>
      </Section>

      <Section title="Topics">
        <input
          type="search"
          value={tagQuery}
          onChange={(e) => setTagQuery(e.target.value)}
          placeholder="Filter topics…"
          aria-label="Filter topics"
          className="h-8 w-full rounded-lg border border-border bg-surface px-2.5 text-xs placeholder:text-muted focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <ul className="scroll-thin -mx-1 flex max-h-[360px] flex-col gap-0.5 overflow-y-auto px-1">
          {visibleTags.map(({ tag, count }) => {
            const active = filters.tag.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggle("tag", tag)}
                  aria-pressed={active}
                  className={`relative flex w-full items-center justify-between overflow-hidden rounded-lg px-2 py-1.5 text-left text-xs transition ${
                    active ? "bg-accent-soft text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-accent/10"
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                    aria-hidden="true"
                  />
                  <span className="relative truncate font-medium">{tag}</span>
                  {count > 0 && <span className="relative tabular-nums text-muted">{compact(count)}</span>}
                </button>
              </li>
            );
          })}
          {visibleTags.length === 0 && <li className="px-2 py-1.5 text-xs text-muted">No matching topics.</li>}
        </ul>
      </Section>
    </div>
  );

  return (
    <>
      {/* Desktop: sticky column. */}
      <aside className="hidden lg:block">
        <div className="scroll-thin sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto pr-2">{body}</div>
      </aside>

      {/* Mobile: slide-over drawer. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close filters" />
          <div className="scroll-thin absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto border-r border-border bg-bg p-5 shadow-float animate-slide-in-left">
            {body}
          </div>
        </div>
      )}
    </>
  );
}
