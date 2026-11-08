"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { SortKey } from "./types";

export const DEFAULT_DAYS = 45;

export interface Filters {
  q: string;
  source: string[];
  kind: string[];
  tag: string[];
  days: number | null; // null = all time
  sort: SortKey;
  page: number;
}

type ListKey = "source" | "kind" | "tag";

function csv(value: string | null): string[] {
  return (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

/** Filter state lives in the URL so any view can be shared or bookmarked. */
export function useFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo<Filters>(() => {
    const daysRaw = searchParams.get("days");
    let days: number | null = DEFAULT_DAYS;
    if (daysRaw === "all") days = null;
    else if (daysRaw && Number(daysRaw) > 0) days = Number(daysRaw);
    const sort = searchParams.get("sort") as SortKey | null;
    return {
      q: searchParams.get("q") ?? "",
      source: csv(searchParams.get("source")),
      kind: csv(searchParams.get("kind")),
      tag: csv(searchParams.get("tag")),
      days,
      sort: sort && ["score", "newest", "stars", "updated"].includes(sort) ? sort : "score",
      page: Math.max(1, Number(searchParams.get("page")) || 1),
    };
  }, [searchParams]);

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next: Filters = { ...filters, ...patch };
      if (!("page" in patch)) next.page = 1;
      const out = new URLSearchParams();
      if (next.q) out.set("q", next.q);
      if (next.source.length) out.set("source", next.source.join(","));
      if (next.kind.length) out.set("kind", next.kind.join(","));
      if (next.tag.length) out.set("tag", next.tag.join(","));
      if (next.days === null) out.set("days", "all");
      else if (next.days !== DEFAULT_DAYS) out.set("days", String(next.days));
      if (next.sort !== "score") out.set("sort", next.sort);
      if (next.page > 1) out.set("page", String(next.page));
      const query = out.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const toggle = useCallback(
    (key: ListKey, value: string) => {
      const list = filters[key];
      update({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
    },
    [filters, update],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const isDefault =
    !filters.q &&
    !filters.source.length &&
    !filters.kind.length &&
    !filters.tag.length &&
    filters.days === DEFAULT_DAYS &&
    filters.sort === "score";

  return { filters, update, toggle, reset, isDefault };
}
