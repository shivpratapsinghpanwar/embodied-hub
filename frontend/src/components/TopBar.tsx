"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/prefs";
import { LogoMark, MoonIcon, RefreshIcon, SearchIcon, SunIcon, XIcon } from "./Icons";

interface TopBarProps {
  q: string;
  onSearch: (q: string) => void;
  onRefresh: () => void;
  running: boolean;
}

export function TopBar({ q, onSearch, onRefresh, running }: TopBarProps) {
  const [theme, setTheme] = useTheme();
  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the box in sync when the URL changes elsewhere (back button, clear filters).
  if (q !== syncedQ) {
    setSyncedQ(q);
    setDraft(q);
  }

  // Debounce typing before it hits the URL and the API.
  useEffect(() => {
    if (draft === q) return;
    const handle = setTimeout(() => onSearch(draft.trim()), 300);
    return () => clearTimeout(handle);
  }, [draft, q, onSearch]);

  // "/" focuses search from anywhere; Escape clears it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg-elevated backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Embodied Hub home">
          <LogoMark />
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">Embodied Hub</span>
        </Link>

        <div className="relative mx-auto w-full max-w-2xl">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            ref={inputRef}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft("");
                onSearch("");
                inputRef.current?.blur();
              }
            }}
            placeholder="Search repos, models, datasets, papers, authors…"
            aria-label="Search"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-20 text-sm text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] placeholder:text-muted transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {draft ? (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  onSearch("");
                }}
                className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Clear search"
              >
                <XIcon size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline">/</kbd>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-fg-2 transition hover:border-border-strong hover:text-fg"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={running}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-brand px-3.5 text-sm font-medium text-white shadow-[0_8px_20px_-10px_var(--accent)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80"
            title="Fetch the newest items from GitHub, Hugging Face and arXiv"
          >
            <RefreshIcon size={15} className={running ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{running ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
