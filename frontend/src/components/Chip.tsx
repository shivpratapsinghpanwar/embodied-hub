"use client";

import type { ReactNode } from "react";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md";
}

export function Chip({ active = false, onClick, children, title, size = "md" }: ChipProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full border font-medium transition select-none whitespace-nowrap";
  const sizing = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const tone = active
    ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400 dark:text-zinc-950"
    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500";
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={active} className={`${base} ${sizing} ${tone}`}>
      {children}
    </button>
  );
}
