import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useWatchHistory } from "./useWatchHistory";

// A separate file because the hook switches to its in-memory fallback for the
// rest of the session once storage fails; Vitest isolates each test file, so
// this doesn't leak into the other history tests.
it("keeps working in memory when localStorage is blocked", () => {
  const blocked = () => {
    throw new DOMException("Storage is disabled", "SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);

  const { result } = renderHook(() => useWatchHistory());

  expect(result.current.entries).toEqual([]);
  act(() => result.current.recordProgress(2, 25));

  expect(result.current.getProgress(2)).toBe(25);
  expect(result.current.entries.map((entry) => entry.id)).toEqual([2]);
});
