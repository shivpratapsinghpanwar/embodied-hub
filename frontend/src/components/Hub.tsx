"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { usePref } from "@/lib/prefs";
import type { Item, ItemPage, Stats, TagCount } from "@/lib/types";
import { useFilters } from "@/lib/useFilters";
import { EmptyState } from "./EmptyState";
import { Hero } from "./Hero";
import { ItemCard } from "./ItemCard";
import { ItemDrawer } from "./ItemDrawer";
import { Pagination } from "./Pagination";
import { ResultsToolbar, type ViewMode } from "./ResultsToolbar";
import { Sidebar } from "./Sidebar";
import { CardSkeleton } from "./Skeleton";
import { TopBar } from "./TopBar";

const PAGE_SIZE = 24;
const POLL_MS = 5000;
const VIEW_MODES = ["grid", "list"] as const;

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function Hub() {
  const { filters, update, toggle, reset, isDefault } = useFilters();
  const [result, setResult] = useState<{ key: string; page: ItemPage } | null>(null);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [newThisWeek, setNewThisWeek] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selected, setSelected] = useState<Item | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = usePref<ViewMode>("hub-view", "grid", VIEW_MODES);
  const wasRunning = useRef(false);

  const { q, days, sort, page: pageNumber } = filters;
  const sourceCsv = filters.source.join(",");
  const kindCsv = filters.kind.join(",");
  const tagCsv = filters.tag.join(",");

  // Identifies the query the current result belongs to; a mismatch means we are loading.
  const queryKey = JSON.stringify([q, sourceCsv, kindCsv, tagCsv, days, sort, pageNumber, reloadNonce]);
  const page = result?.page ?? null;
  const loading = result?.key !== queryKey;

  useEffect(() => {
    let cancelled = false;
    api
      .items({ q, source: sourceCsv, kind: kindCsv, tag: tagCsv, days, sort, page: pageNumber, page_size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: queryKey, page: data });
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(message(e));
      });
    return () => {
      cancelled = true;
    };
  }, [q, sourceCsv, kindCsv, tagCsv, days, sort, pageNumber, queryKey]);

  useEffect(() => {
    let cancelled = false;
    api
      .tags({ days, source: sourceCsv, limit: 40 })
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(() => {
        /* decorative; the items error is already surfaced */
      });
    return () => {
      cancelled = true;
    };
  }, [days, sourceCsv, reloadNonce]);

  useEffect(() => {
    let cancelled = false;
    api
      .items({ days: 7, page: 1, page_size: 1 })
      .then((data) => {
        if (!cancelled) setNewThisWeek(data.total);
      })
      .catch(() => {
        /* the tile shows a dash */
      });
    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  // Poll stats; when an ingest run finishes, reload items and tags.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      let next: Stats | null = null;
      try {
        next = await api.stats();
      } catch (e) {
        if (!cancelled) setError(message(e));
      }
      if (cancelled) return;
      if (next) setStats(next);
      const running = next?.is_running ?? false;
      if (wasRunning.current && !running) {
        setRefreshing(false);
        setReloadNonce((n) => n + 1);
      }
      wasRunning.current = running;
      timer = setTimeout(tick, running ? POLL_MS : POLL_MS * 6);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await api.triggerIngest();
      wasRunning.current = true;
      setStats((s) => (s ? { ...s, is_running: true } : s));
    } catch (e) {
      setRefreshing(false);
      setError(message(e));
    }
  }, []);

  const onSearch = useCallback((value: string) => update({ q: value }), [update]);
  const onToggleTag = useCallback((tag: string) => toggle("tag", tag), [toggle]);
  const closeDrawer = useCallback(() => setSelected(null), []);

  const running = refreshing || stats?.is_running === true;
  const items = page?.items ?? [];
  const maxScore = items.reduce((m, i) => Math.max(m, i.score), 0);
  const showSkeleton = loading && !page;
  const gridClass = view === "grid" ? "grid gap-4 sm:grid-cols-2 2xl:grid-cols-3" : "flex flex-col gap-3";

  return (
    <>
      <TopBar q={filters.q} onSearch={onSearch} onRefresh={onRefresh} running={running} />

      <div className="bg-aurora">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6">
          <Hero stats={stats} newThisWeek={newThisWeek} running={running} />

          <div className="grid gap-8 py-8 lg:grid-cols-[256px_minmax(0,1fr)]">
            <Sidebar
              filters={filters}
              update={update}
              toggle={toggle}
              reset={reset}
              isDefault={isDefault}
              stats={stats}
              tags={tags}
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
            />

            <section className="flex min-w-0 flex-col gap-4" aria-live="polite">
              <ResultsToolbar
                filters={filters}
                update={update}
                toggle={toggle}
                total={page ? page.total : null}
                loading={loading}
                view={view}
                onView={setView}
                onOpenFilters={() => setFiltersOpen(true)}
              />

              {error && (
                <div className="rounded-xl border border-arxiv/40 bg-arxiv/10 px-4 py-3 text-sm text-fg">
                  <strong className="font-semibold">Could not reach the API.</strong> {error}. Is the backend running on
                  port 8000?
                </div>
              )}

              {showSkeleton && (
                <div className={gridClass}>
                  {Array.from({ length: 9 }, (_, i) => (
                    <CardSkeleton key={i} view={view} />
                  ))}
                </div>
              )}

              {page && items.length === 0 && !loading && (
                <EmptyState nothingIndexed={stats?.total === 0} running={running} onReset={reset} onRefresh={onRefresh} />
              )}

              {items.length > 0 && (
                <div className={`${gridClass} transition-opacity ${loading ? "opacity-60" : ""}`}>
                  {items.map((item, index) => (
                    <ItemCard
                      key={`${item.source}-${item.id}`}
                      item={item}
                      view={view}
                      index={index}
                      activeTags={filters.tag}
                      onToggleTag={onToggleTag}
                      onOpen={setSelected}
                      maxScore={maxScore}
                    />
                  ))}
                </div>
              )}

              {page && (
                <Pagination page={page.page} pageSize={page.page_size} total={page.total} onPage={(p) => update({ page: p })} />
              )}
            </section>
          </div>

          <footer className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-xs text-muted sm:flex-row">
            <span>Embodied Hub · aggregates public listings from GitHub, Hugging Face and arXiv.</span>
            <span>
              Press <kbd>/</kbd> to search · <kbd>Esc</kbd> to close
            </span>
          </footer>
        </div>
      </div>

      <ItemDrawer item={selected} activeTags={filters.tag} onToggleTag={onToggleTag} onClose={closeDrawer} />
    </>
  );
}
