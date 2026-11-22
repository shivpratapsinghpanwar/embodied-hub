"use client";

import { CompassIcon, RefreshIcon } from "./Icons";

interface EmptyStateProps {
  nothingIndexed: boolean;
  running: boolean;
  onReset: () => void;
  onRefresh: () => void;
}

export function EmptyState({ nothingIndexed, running, onReset, onRefresh }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center animate-rise">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <CompassIcon size={26} />
      </span>
      {nothingIndexed ? (
        <>
          <div>
            <h3 className="text-base font-semibold">Nothing indexed yet</h3>
            <p className="mt-1 max-w-md text-sm text-fg-2">
              The first fetch runs automatically when the backend starts and takes a couple of minutes. You can also
              kick it off now.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={running}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-brand px-3.5 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-80"
          >
            <RefreshIcon size={14} className={running ? "animate-spin" : ""} />
            {running ? "Fetching…" : "Fetch sources now"}
          </button>
        </>
      ) : (
        <>
          <div>
            <h3 className="text-base font-semibold">No matches</h3>
            <p className="mt-1 max-w-md text-sm text-fg-2">
              Nothing matches this combination of search, sources, types and topics. Try a wider time window or fewer
              topics.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-medium text-fg-2 hover:border-border-strong hover:text-fg"
          >
            Clear all filters
          </button>
        </>
      )}
    </div>
  );
}
