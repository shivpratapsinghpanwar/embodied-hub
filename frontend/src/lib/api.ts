import type { IngestRun, ItemPage, Stats, TagCount } from "./types";

// Empty by default: requests go to this Next.js server, which rewrites /api/* to the backend.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Params = Record<string, string | number | null | undefined>;

function qs(params?: Params): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body}` : ""}`);
  }
  return (await res.json()) as T;
}

export interface ItemsQuery extends Params {
  q?: string;
  source?: string;
  kind?: string;
  tag?: string;
  days?: number | null;
  sort?: string;
  page?: number;
  page_size?: number;
}

export const api = {
  items: (query: ItemsQuery) => request<ItemPage>(`/api/items${qs(query)}`),
  tags: (query: { days?: number | null; source?: string; limit?: number }) =>
    request<TagCount[]>(`/api/tags${qs(query)}`),
  stats: () => request<Stats>("/api/stats"),
  triggerIngest: (source?: string) =>
    request<{ status: string; sources?: string[] }>(`/api/ingest${qs({ source })}`, { method: "POST" }),
  ingestStatus: () => request<{ running: boolean; sources: string[] }>("/api/ingest/status"),
  runs: (limit = 10) => request<IngestRun[]>(`/api/ingest/runs${qs({ limit })}`),
};
