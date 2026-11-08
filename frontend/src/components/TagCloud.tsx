"use client";

import type { TagCount } from "@/lib/types";
import { Chip } from "./Chip";

interface TagCloudProps {
  tags: TagCount[];
  active: string[];
  onToggle: (tag: string) => void;
}

export function TagCloud({ tags, active, onToggle }: TagCloudProps) {
  if (!tags.length && !active.length) return null;
  // Always show selected tags even if they fell out of the top list.
  const known = new Set(tags.map((t) => t.tag));
  const extras = active.filter((t) => !known.has(t)).map((tag) => ({ tag, count: 0 }));
  return (
    <section aria-label="Tags" className="flex flex-wrap gap-1.5">
      {[...extras, ...tags].map(({ tag, count }) => (
        <Chip key={tag} size="sm" active={active.includes(tag)} onClick={() => onToggle(tag)}>
          {tag}
          {count > 0 && <span className="opacity-60">{count}</span>}
        </Chip>
      ))}
    </section>
  );
}
