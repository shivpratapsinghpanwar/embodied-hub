"use client";

import { compact, KIND_LABEL, popularityLabel, SOURCE_CLASS, SOURCE_LABEL, timeAgo } from "@/lib/format";
import type { Item } from "@/lib/types";
import { Chip } from "./Chip";

interface ItemCardProps {
  item: Item;
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

export function ItemCard({ item, activeTags, onToggleTag }: ItemCardProps) {
  const shownTags = item.tags.slice(0, 6);
  const hidden = item.tags.length - shownTags.length;
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${SOURCE_CLASS[item.source]}`}>
            {SOURCE_LABEL[item.source]}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">{KIND_LABEL[item.kind]}</span>
        </div>
        <time dateTime={item.published_at} title={new Date(item.published_at).toLocaleString()} className="text-zinc-500 dark:text-zinc-400">
          {timeAgo(item.published_at)}
        </time>
      </header>

      <div>
        <h3 className="text-sm font-semibold leading-snug">
          <a href={item.url} target="_blank" rel="noreferrer" className="break-words hover:underline">
            {item.title}
          </a>
        </h3>
        {item.authors && <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{item.authors}</p>}
      </div>

      <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{item.summary || "No description provided."}</p>

      {shownTags.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {shownTags.map((tag) => (
            <li key={tag}>
              <Chip size="sm" active={activeTags.includes(tag)} onClick={() => onToggleTag(tag)} title={`Filter by ${tag}`}>
                {tag}
              </Chip>
            </li>
          ))}
          {hidden > 0 && <li className="self-center text-[11px] text-zinc-500">+{hidden}</li>}
        </ul>
      )}

      <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {item.stars > 0 && (
          <span title={popularityLabel(item.source)}>
            ★ {compact(item.stars)}
          </span>
        )}
        {item.downloads > 0 && <span title="downloads">⬇ {compact(item.downloads)}</span>}
        {item.language && <span>{item.language}</span>}
        <span className="ml-auto" title="trending score">
          {item.score.toFixed(1)}
        </span>
      </footer>
    </article>
  );
}
