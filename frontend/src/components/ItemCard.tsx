"use client";

import type { KeyboardEvent } from "react";
import { compact, KIND_LABEL, popularityLabel, SOURCE_LABEL, timeAgo } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Chip } from "./Chip";
import { DownloadIcon, ExternalIcon, HeartIcon, KIND_ICON, SOURCE_ICON, StarIcon } from "./Icons";

export const SOURCE_BADGE: Record<Item["source"], string> = {
  github: "bg-github/10 text-github ring-github/20",
  huggingface: "bg-hf/12 text-hf ring-hf/25",
  arxiv: "bg-arxiv/12 text-arxiv ring-arxiv/25",
};

const SOURCE_BAR: Record<Item["source"], string> = {
  github: "from-github/70 to-github/0",
  huggingface: "from-hf to-hf/0",
  arxiv: "from-arxiv to-arxiv/0",
};

const TWO_DAYS = 48 * 3600 * 1000;

export function isFresh(item: Item): boolean {
  return Date.now() - new Date(item.published_at).getTime() < TWO_DAYS;
}

export function SourceBadge({ source, small = false }: { source: Item["source"]; small?: boolean }) {
  const Icon = SOURCE_ICON[source];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold ring-1 ring-inset ${SOURCE_BADGE[source]} ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <Icon size={small ? 11 : 12} />
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function Popularity({ item, className = "" }: { item: Item; className?: string }) {
  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {item.stars > 0 && (
        <span className="inline-flex items-center gap-1 tabular-nums" title={popularityLabel(item.source)}>
          {item.source === "github" ? <StarIcon size={12} /> : <HeartIcon size={12} />}
          {compact(item.stars)}
        </span>
      )}
      {item.downloads > 0 && (
        <span className="inline-flex items-center gap-1 tabular-nums" title="downloads">
          <DownloadIcon size={12} />
          {compact(item.downloads)}
        </span>
      )}
      {item.language && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-2/80" />
          {item.language}
        </span>
      )}
    </span>
  );
}

interface ItemCardProps {
  item: Item;
  view: "grid" | "list";
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onOpen: (item: Item) => void;
  maxScore: number;
  index: number;
}

export function ItemCard({ item, view, activeTags, onToggleTag, onOpen, maxScore, index }: ItemCardProps) {
  const KindIcon = KIND_ICON[item.kind];
  const shownTags = item.tags.slice(0, view === "list" ? 5 : 6);
  const hidden = item.tags.length - shownTags.length;
  const fresh = isFresh(item);
  const scorePct = Math.max(6, Math.round((item.score / Math.max(maxScore, 0.01)) * 100));

  const open = () => onOpen(item);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };

  const header = (
    <header className="flex items-center gap-2 text-xs text-muted">
      <SourceBadge source={item.source} />
      <span className="inline-flex items-center gap-1 capitalize">
        <KindIcon size={12} />
        {KIND_LABEL[item.kind]}
      </span>
      {fresh && (
        <span className="rounded-md bg-accent-2/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-2">New</span>
      )}
      <time dateTime={item.published_at} title={new Date(item.published_at).toLocaleString()} className="ml-auto tabular-nums">
        {timeAgo(item.published_at)}
      </time>
    </header>
  );

  const title = (
    <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex max-w-full items-start gap-1 break-words text-fg hover:text-accent"
      >
        <span className="min-w-0">{item.title}</span>
        <ExternalIcon size={12} className="mt-1 shrink-0 opacity-0 transition group-hover:opacity-70" />
      </a>
    </h3>
  );

  const tags = shownTags.length > 0 && (
    <ul className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {shownTags.map((tag) => (
        <li key={tag}>
          <Chip size="sm" active={activeTags.includes(tag)} onClick={() => onToggleTag(tag)} title={`Filter by ${tag}`}>
            {tag}
          </Chip>
        </li>
      ))}
      {hidden > 0 && <li className="self-center text-[11px] text-muted">+{hidden}</li>}
    </ul>
  );

  const score = (
    <span className="ml-auto inline-flex items-center gap-2" title={`Trending score ${item.score.toFixed(2)}`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-3">
        <span className="block h-full rounded-full bg-gradient-brand" style={{ width: `${scorePct}%` }} />
      </span>
      <span className="tabular-nums">{item.score.toFixed(1)}</span>
    </span>
  );

  const base =
    "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-card outline-none transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-float focus-visible:ring-2 focus-visible:ring-accent/60 animate-rise";
  const style = { animationDelay: `${Math.min(index, 12) * 30}ms` };

  if (view === "list") {
    return (
      <article className={`${base} p-4`} style={style} onClick={open} onKeyDown={onKey} tabIndex={0} role="button" aria-label={`Open ${item.title}`}>
        <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${SOURCE_BAR[item.source]}`} aria-hidden="true" />
        <div className="flex flex-col gap-2 pl-2">
          {header}
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="min-w-0 flex-1">
              {title}
              {item.authors && <p className="mt-0.5 truncate text-xs text-muted">{item.authors}</p>}
              <p className="mt-1.5 line-clamp-2 text-sm text-fg-2">{item.summary || "No description provided."}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:w-64 md:items-end">
              {tags}
              <footer className="flex w-full items-center gap-3 text-xs text-muted md:justify-end">
                <Popularity item={item} />
                {score}
              </footer>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`${base} flex h-full flex-col gap-3 p-4`} style={style} onClick={open} onKeyDown={onKey} tabIndex={0} role="button" aria-label={`Open ${item.title}`}>
      <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${SOURCE_BAR[item.source]}`} aria-hidden="true" />
      {header}
      <div>
        {title}
        {item.authors && <p className="mt-0.5 truncate text-xs text-muted">{item.authors}</p>}
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-fg-2">{item.summary || "No description provided."}</p>
      {tags}
      <footer className="mt-auto flex items-center gap-3 border-t border-border pt-3 text-xs text-muted">
        <Popularity item={item} />
        {score}
      </footer>
    </article>
  );
}
