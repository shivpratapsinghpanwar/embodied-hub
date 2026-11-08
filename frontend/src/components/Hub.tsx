"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ItemPage, Stats, TagCount } from "@/lib/types";
import { useFilters } from "@/lib/useFilters";
import { FilterBar } from "./FilterBar";
import { ItemCard } from "./ItemCard";
import { Pagination } from "./Pagination";
import { StatsBar } from "./StatsBar";
import { TagCloud } from "./TagCloud";

const PAGE_SIZE = 24;
const POLL_MS = 5000;

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function Hub() {
  const { filters, update, toggle, reset, isDefault } = useFilters();
  const [result, setResult] = useState<{ key: string; page: ItemPage } | null>(null);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
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
        /* tags are decorative; the items error is already surfaced */
      });
    return () => {
      cancelled = true;
    };
  }, [days, sourceCsv, reloadNonce]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await api.triggerIngest();
      wasRunning.current = true;
      setStats((s) => (s ? { ...s, is_running: true } : s));
    } catch (e) {
      setRefreshing(false);
      setError(message(e));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Embodied Hub</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Newly launched repos, models, datasets and papers across robotics, computer vision and embodied AI.
        </p>
      </header>

      <StatsBar stats={stats} onRefresh={onRefresh} refreshing={refreshing} error={error} />
      <FilterBar filters={filters} update={update} toggle={toggle} reset={reset} isDefault={isDefault} />
      <TagCloud tags={tags} active={filters.tag} onToggle={(t) => toggle("tag", t)} />

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          Could not reach the API: {error}. Is the backend running on port 8000?
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>{page ? `${page.total.toLocaleString()} results` : loading ? "Loading…" : ""}</span>
        {loading && page && <span>Updating…</span>}
      </div>

      {page && page.items.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {stats && stats.total === 0
            ? "Nothing collected yet. The first refresh runs automatically at startup and takes a few minutes; you can also press Refresh sources."
            : "No items match these filters."}
        </div>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-70" : ""}`}>
        {page?.items.map((item) => (
          <ItemCard
            key={`${item.source}-${item.id}`}
            item={item}
            activeTags={filters.tag}
            onToggleTag={(t) => toggle("tag", t)}
          />
        ))}
      </div>

      {page && (
        <Pagination page={page.page} pageSize={page.page_size} total={page.total} onPage={(p) => update({ page: p })} />
      )}
    </div>
  );
}
