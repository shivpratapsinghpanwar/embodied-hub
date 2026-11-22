"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

/** Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 42 */
function range(page: number, pages: number): (number | "gap")[] {
  const set = new Set<number>([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("gap");
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({ page, pageSize, total, onPage }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const go = (p: number) => {
    onPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const button =
    "grid h-9 min-w-9 place-items-center rounded-lg border border-border bg-surface px-2 text-sm tabular-nums transition hover:border-border-strong hover:text-fg disabled:opacity-40 disabled:hover:border-border";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-fg-2">
      <button type="button" className={button} disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">
        <ChevronLeftIcon size={16} />
      </button>
      {range(page, pages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? `${button} border-transparent bg-accent text-white hover:text-white` : button}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={button} disabled={page >= pages} onClick={() => go(page + 1)} aria-label="Next page">
        <ChevronRightIcon size={16} />
      </button>
    </nav>
  );
}
