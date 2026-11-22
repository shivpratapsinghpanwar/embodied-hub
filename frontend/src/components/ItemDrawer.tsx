"use client";

import { useEffect, useRef, useState } from "react";
import { KIND_LABEL, SOURCE_LABEL, timeAgo } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Chip } from "./Chip";
import { CheckIcon, ExternalIcon, KIND_ICON, LinkIcon, XIcon } from "./Icons";
import { Popularity, SourceBadge, isFresh } from "./ItemCard";

interface ItemDrawerProps {
  item: Item | null;
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClose: () => void;
}

const OPEN_LABEL: Record<Item["source"], string> = {
  github: "Open on GitHub",
  huggingface: "Open on Hugging Face",
  arxiv: "Read on arXiv",
};

export function ItemDrawer({ item, activeTags, onToggleTag, onClose }: ItemDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Escape closes; focus moves to the panel; the page behind stops scrolling.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [item, onClose]);

  if (!item) return null;

  const KindIcon = KIND_ICON[item.kind];
  const justCopied = copied === item.id;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(item.id);
      setTimeout(() => setCopied((c) => (c === item.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked: the link is still visible in the panel */
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-label="Close details" />
      <aside className="scroll-thin absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto border-l border-border bg-bg shadow-float animate-slide-in">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-bg-elevated px-5 py-3 backdrop-blur-xl">
          <SourceBadge source={item.source} />
          <span className="inline-flex items-center gap-1 text-xs capitalize text-muted">
            <KindIcon size={12} />
            {KIND_LABEL[item.kind]}
          </span>
          {isFresh(item) && (
            <span className="rounded-md bg-accent-2/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-2">New</span>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Close"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-5 py-6">
          <div>
            <h2 id="drawer-title" className="text-balance text-xl font-semibold leading-snug tracking-tight">
              {item.title}
            </h2>
            {item.authors && <p className="mt-1.5 text-sm text-fg-2">{item.authors}</p>}
            <p className="mt-2 text-xs text-muted">
              Published {timeAgo(item.published_at)} · updated {timeAgo(item.updated_at)} ·{" "}
              {new Date(item.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-brand px-3.5 text-sm font-medium text-white shadow-[0_8px_20px_-10px_var(--accent)] transition hover:brightness-110"
            >
              {OPEN_LABEL[item.source]}
              <ExternalIcon size={14} />
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-fg-2 transition hover:border-border-strong hover:text-fg"
            >
              {justCopied ? <CheckIcon size={14} className="text-accent-2" /> : <LinkIcon size={14} />}
              {justCopied ? "Copied" : "Copy link"}
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">Trending score</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{item.score.toFixed(2)}</dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">Traction</dt>
              <dd className="mt-1 text-sm">
                <Popularity item={item} className="text-fg-2" />
                {item.stars === 0 && item.downloads === 0 && !item.language && <span className="text-muted">—</span>}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-surface p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">Source id</dt>
              <dd className="mt-1 truncate font-mono text-xs text-fg-2" title={item.external_id}>
                {item.external_id}
              </dd>
            </div>
          </dl>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {item.kind === "paper" ? "Abstract" : "Description"}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg-2">{item.summary || "No description provided."}</p>
          </section>

          {item.tags.length > 0 && (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Topics</h3>
              <ul className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <li key={tag}>
                    <Chip active={activeTags.includes(tag)} onClick={() => onToggleTag(tag)} title={`Filter the feed by ${tag}`}>
                      {tag}
                    </Chip>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-auto text-xs text-muted">
            Indexed from {SOURCE_LABEL[item.source]}. Press <kbd>Esc</kbd> to close.
          </p>
        </div>
      </aside>
    </div>
  );
}
