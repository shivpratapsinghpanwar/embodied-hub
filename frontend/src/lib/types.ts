export type Source = "github" | "huggingface" | "arxiv";
export type Kind = "repo" | "model" | "dataset" | "space" | "paper";
export type SortKey = "score" | "newest" | "stars" | "updated";

export interface Item {
  id: number;
  source: Source;
  external_id: string;
  kind: Kind;
  title: string;
  summary: string;
  url: string;
  authors: string;
  tags: string[];
  stars: number;
  downloads: number;
  language: string;
  published_at: string;
  updated_at: string;
  score: number;
}

export interface ItemPage {
  items: Item[];
  total: number;
  page: number;
  page_size: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface Stats {
  total: number;
  by_source: Record<string, number>;
  by_kind: Record<string, number>;
  last_ingest: string | null;
  is_running: boolean;
}

export interface IngestRun {
  id: number;
  source: string;
  started_at: string;
  finished_at: string | null;
  fetched: number;
  added: number;
  updated: number;
  error: string | null;
}

export const SOURCES: { value: Source; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "huggingface", label: "Hugging Face" },
  { value: "arxiv", label: "arXiv" },
];

export const KINDS: { value: Kind; label: string }[] = [
  { value: "repo", label: "Repos" },
  { value: "model", label: "Models" },
  { value: "dataset", label: "Datasets" },
  { value: "space", label: "Spaces" },
  { value: "paper", label: "Papers" },
];

export const SORTS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "stars", label: "Most starred" },
  { value: "updated", label: "Recently updated" },
];

export const DAY_OPTIONS: { value: number | null; label: string }[] = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 45, label: "Last 45 days" },
  { value: 90, label: "Last 90 days" },
  { value: null, label: "All time" },
];
