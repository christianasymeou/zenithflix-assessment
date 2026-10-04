import { afterEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/types/content";
import { fetchContent } from "./fetchContent";

const dune: ContentItem = {
  id: 4,
  title: "Dune",
  year: 2021,
  genre: ["Sci-Fi", "Adventure"],
  rating: 8,
  thumbnail: "https://example.com/dune.jpg",
  video_url: "https://example.com/dune.mp4",
  duration: 155,
  description: "A desert planet.",
  cast: ["Timothee Chalamet"],
  watchProgress: 0,
};

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchContent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the trending titles from a valid response", async () => {
    mockFetch({ categories: { trending: [dune] } });

    await expect(fetchContent()).resolves.toEqual([dune]);
  });

  it("passes the abort signal through, so requests can be cancelled", async () => {
    const fetchMock = mockFetch({ categories: { trending: [] } });
    const controller = new AbortController();

    await fetchContent(controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("/api/content", { signal: controller.signal });
  });

  // Code Review Issue 1: a 200 response with the wrong shape must not crash the page
  it.each([
    ["no trending key", { categories: {} }],
    ["trending is null", { categories: { trending: null } }],
    ["no categories", {}],
    ["a null body", null],
    ["trending is not an array", { categories: { trending: "Dune" } }],
  ])("returns an empty list when the response has %s", async (_case, body) => {
    mockFetch(body);

    await expect(fetchContent()).resolves.toEqual([]);
  });

  it("drops items that are missing the fields a tile needs", async () => {
    mockFetch({
      categories: { trending: [dune, null, { id: "4", title: "Dune" }, { id: 5 }, "Dune"] },
    });

    await expect(fetchContent()).resolves.toEqual([dune]);
  });

  it("throws on an HTTP error, so the UI can show its error state", async () => {
    mockFetch({ message: "Server error" }, 500);

    await expect(fetchContent()).rejects.toThrow("HTTP 500");
  });
});
