import { useCallback, useMemo, useSyncExternalStore } from "react";

// Versioned key: a future change to the stored shape can use a new key
// instead of misreading old data
export const STORAGE_KEY = "zenithflix:watch-history:v1";
const CHANGE_EVENT = "zenithflix:watch-history-change";
// Keeps localStorage bounded; the oldest entries are dropped first
const MAX_ENTRIES = 50;

export interface WatchEntry {
  /** Percentage watched, 0–100, to one decimal place */
  progress: number;
  /** Last update, ms since epoch; used to order the history */
  updatedAt: number;
}

/** Keyed by content id. Only ids are stored: titles and images come from the catalog. */
export type WatchHistory = Record<string, WatchEntry>;

const EMPTY: WatchHistory = {};

// One decimal place: a few seconds of a 10-minute film is well under 1%, and
// rounding to whole percent would turn it into 0 and drop it from history
const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Math.round(value * 10) / 10));

function isWatchEntry(value: unknown): value is WatchEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.progress === "number" &&
    Number.isFinite(entry.progress) &&
    typeof entry.updatedAt === "number" &&
    Number.isFinite(entry.updatedAt)
  );
}

/**
 * Parses stored history defensively: localStorage can hold anything (older
 * versions, manual edits, other code), so corrupted or invalid data degrades
 * to an empty or partial history instead of crashing the page.
 */
export function parseHistory(raw: string | null): WatchHistory {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return EMPTY;

    const history: WatchHistory = {};
    for (const [id, entry] of Object.entries(data)) {
      if (isWatchEntry(entry)) {
        history[id] = { progress: clampPercent(entry.progress), updatedAt: entry.updatedAt };
      }
    }
    return history;
  } catch {
    return EMPTY;
  }
}

// localStorage can be unavailable (blocked cookies, some private modes) or
// full. Then history is kept in memory, so it still works for this session.
let memoryFallback: string | null = null;
let useMemory = false;

function readRaw(): string | null {
  if (useMemory) return memoryFallback;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    useMemory = true;
    return memoryFallback;
  }
}

function writeRaw(raw: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    useMemory = true;
  }
  memoryFallback = raw;
  // The "storage" event only fires in *other* tabs; this notifies this one
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// useSyncExternalStore needs the same object back while nothing has changed,
// so the parsed value is cached against the raw string it came from
let cachedRaw: string | null | undefined;
let cachedHistory: WatchHistory = EMPTY;

function getSnapshot(): WatchHistory {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedHistory = parseHistory(raw);
  }
  return cachedHistory;
}

// No localStorage on the server: render an empty history, then React
// re-renders with the real one after hydration
const getServerSnapshot = () => EMPTY;

function subscribe(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    // key is null when another tab calls localStorage.clear()
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useWatchHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Most recently watched first */
  const entries = useMemo(
    () =>
      Object.entries(history)
        .map(([id, entry]) => ({ id: Number(id), ...entry }))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [history],
  );

  const getProgress = useCallback((id: number) => history[id]?.progress ?? 0, [history]);

  const recordProgress = useCallback((id: number, percent: number) => {
    if (!Number.isFinite(percent)) return;
    const progress = clampPercent(percent);
    // Opening a title without playing it doesn't count as watching;
    // any playback at all does
    if (progress === 0) return;

    // Read the latest stored value, not a possibly stale render value
    const current = getSnapshot();
    const next: WatchHistory = { ...current, [id]: { progress, updatedAt: Date.now() } };

    const ids = Object.keys(next);
    if (ids.length > MAX_ENTRIES) {
      ids
        .sort((a, b) => next[a].updatedAt - next[b].updatedAt)
        .slice(0, ids.length - MAX_ENTRIES)
        .forEach((oldId) => delete next[oldId]);
    }

    writeRaw(JSON.stringify(next));
  }, []);

  const clearHistory = useCallback(() => writeRaw(JSON.stringify({})), []);

  return { entries, getProgress, recordProgress, clearHistory };
}
