import type { Kind, Source } from "./types";

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function compact(n: number): string {
  return compactFormatter.format(n);
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.345, "w"],
    [12, "mo"],
  ];
  let value = seconds;
  let label = "s";
  for (const [step, unit] of units) {
    if (value < step) break;
    value = value / step;
    label = unit;
  }
  if (label === "mo" && value >= 12) return `${Math.round(value / 12)}y ago`;
  return `${Math.round(value)}${label} ago`;
}

export const SOURCE_LABEL: Record<Source, string> = {
  github: "GitHub",
  huggingface: "Hugging Face",
  arxiv: "arXiv",
};

export const SOURCE_CLASS: Record<Source, string> = {
  github: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900",
  huggingface: "bg-amber-400 text-amber-950",
  arxiv: "bg-rose-600 text-white",
};

export const KIND_LABEL: Record<Kind, string> = {
  repo: "repo",
  model: "model",
  dataset: "dataset",
  space: "space",
  paper: "paper",
};

export function popularityLabel(source: Source): string {
  return source === "github" ? "stars" : "likes";
}
