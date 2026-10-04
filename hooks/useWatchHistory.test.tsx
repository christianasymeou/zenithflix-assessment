import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseHistory, STORAGE_KEY, useWatchHistory } from "./useWatchHistory";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("parseHistory", () => {
  it.each([
    ["missing", null],
    ["empty", ""],
    ["invalid JSON", "{not json"],
    ["an array", "[1, 2, 3]"],
    ["a string", '"history"'],
  ])("returns an empty history when stored data is %s", (_case, raw) => {
    expect(parseHistory(raw)).toEqual({});
  });

  it("keeps valid entries, drops invalid ones and clamps progress to 0–100", () => {
    const raw = JSON.stringify({
      1: { progress: 40, updatedAt: 10 },
      2: "garbage",
      3: { progress: "50", updatedAt: 1 },
      4: { progress: 400, updatedAt: 5 },
      5: { progress: -3, updatedAt: 6 },
    });

    expect(parseHistory(raw)).toEqual({
      1: { progress: 40, updatedAt: 10 },
      4: { progress: 100, updatedAt: 5 },
      5: { progress: 0, updatedAt: 6 },
    });
  });
});

describe("useWatchHistory", () => {
  it("records progress, saves it and lists the most recently watched first", () => {
    const now = vi.spyOn(Date, "now");
    const { result } = renderHook(() => useWatchHistory());

    now.mockReturnValue(1000);
    act(() => result.current.recordProgress(4, 30));
    now.mockReturnValue(2000);
    act(() => result.current.recordProgress(3, 72.46));

    expect(result.current.entries.map((entry) => entry.id)).toEqual([3, 4]);
    expect(result.current.getProgress(3)).toBe(72.5);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "")).toEqual({
      4: { progress: 30, updatedAt: 1000 },
      3: { progress: 72.5, updatedAt: 2000 },
    });
  });

  it("keeps a few seconds of a long film instead of rounding it to 0", () => {
    const { result } = renderHook(() => useWatchHistory());

    // 2.5 seconds of an 11-minute film
    act(() => result.current.recordProgress(5, 0.42));

    expect(result.current.getProgress(5)).toBe(0.4);
    expect(result.current.entries).toHaveLength(1);
  });

  it.each([
    ["0 (opened but never played)", 0],
    ["too small to register", 0.01],
    ["not a number", Number.NaN],
  ])("ignores progress that is %s", (_case, percent) => {
    const { result } = renderHook(() => useWatchHistory());

    act(() => result.current.recordProgress(1, percent));

    expect(result.current.entries).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns 0 for titles that haven't been watched", () => {
    const { result } = renderHook(() => useWatchHistory());

    expect(result.current.getProgress(999)).toBe(0);
  });

  it("starts from an empty history when stored data is corrupted", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useWatchHistory());

    expect(result.current.entries).toEqual([]);
  });

  it("keeps every component using the hook in sync", () => {
    const first = renderHook(() => useWatchHistory());
    const second = renderHook(() => useWatchHistory());

    act(() => first.result.current.recordProgress(8, 55));

    expect(second.result.current.getProgress(8)).toBe(55);
  });

  it("updates when another browser tab changes the history", () => {
    const { result } = renderHook(() => useWatchHistory());

    // Simulates another tab: it writes to localStorage and the browser
    // fires a "storage" event in this tab
    act(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 7: { progress: 50, updatedAt: 1 } }));
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });

    expect(result.current.getProgress(7)).toBe(50);
  });
});
