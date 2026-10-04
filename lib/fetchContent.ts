import type { ContentItem } from "@/types/content";

// Minimal runtime check for the fields the UI needs to render a tile.
// TypeScript types are erased at runtime, so the response shape must be
// verified here rather than trusted (Code Review Issue 1).
function isContentItem(value: unknown): value is ContentItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" && typeof item.title === "string";
}

export async function fetchContent(signal?: AbortSignal): Promise<ContentItem[]> {
  const response = await fetch("/api/content", { signal });
  if (!response.ok) {
    throw new Error(`Failed to load content (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();
  const trending = (data as { categories?: { trending?: unknown } } | null)
    ?.categories?.trending;

  // A missing or malformed list degrades to an empty row instead of crashing
  if (!Array.isArray(trending)) return [];
  return trending.filter(isContentItem);
}
