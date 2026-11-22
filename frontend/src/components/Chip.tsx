"use client";

import type { ReactNode } from "react";

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

export function Chip({ active = false, onClick, children, title, size = "md", className = "" }: ChipProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";
  const sizing = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const tone = active
    ? "border-transparent bg-accent text-white shadow-[0_0_0_3px_var(--accent-soft)]"
    : "border-border bg-surface text-fg-2 hover:border-border-strong hover:text-fg";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`${base} ${sizing} ${tone} ${className}`}
    >
      {children}
    </button>
  );
}
