"use client";

import { useCallback, useSyncExternalStore } from "react";

/* Tiny per-browser preferences (theme, view mode) backed by localStorage and read
 * through useSyncExternalStore so the server render and first client render agree. */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function usePref<T extends string>(key: string, fallback: T, allowed?: readonly T[]): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const raw = read(key) as T | null;
      if (raw === null) return fallback;
      return allowed && !allowed.includes(raw) ? fallback : raw;
    },
    () => fallback,
  );
  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* private mode: keep the in-memory value only */
      }
      notify();
    },
    [key],
  );
  return [value, set];
}

export type Theme = "light" | "dark";

/** Theme lives on <html data-theme> (set pre-hydration by layout.tsx) and in localStorage. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => "dark",
  );
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem("hub-theme", t);
    } catch {
      /* ignore */
    }
    notify();
  }, []);
  return [theme, setTheme];
}
