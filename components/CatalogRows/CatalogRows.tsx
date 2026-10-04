"use client";

import { useMemo } from "react";
import { useCatalog } from "@/components/CatalogProvider/CatalogProvider";
import { ContentRow } from "@/components/ContentRow/ContentRow";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import type { ContentItem } from "@/types/content";

interface CatalogRowProps {
  /** "grid" with headingLevel 1 when the row is a page of its own */
  layout?: "row" | "grid";
  headingLevel?: 1 | 2;
}

export function TrendingRow({ layout, headingLevel }: CatalogRowProps) {
  const { items, loading, error, retry, openItem } = useCatalog();
  const { getProgress } = useWatchHistory();

  return (
    <ContentRow
      title="Trending Now"
      items={items}
      loading={loading}
      error={error}
      onRetry={retry}
      onSelect={openItem}
      getProgress={getProgress}
      layout={layout}
      headingLevel={headingLevel}
      skeletonCount={layout === "grid" ? 10 : 6}
    />
  );
}

interface ContinueWatchingRowProps extends CatalogRowProps {
  /** On Home, the Trending row already shows the error, so this row hides */
  hideOnError?: boolean;
}

export function ContinueWatchingRow({
  layout,
  headingLevel,
  hideOnError = false,
}: ContinueWatchingRowProps) {
  const { items, loading, error, retry, openItem } = useCatalog();
  const { entries, getProgress } = useWatchHistory();

  // History stores only ids and progress; titles and images come from the
  // catalog, so a title removed from the catalog simply drops out of history
  const watched = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]));
    return entries
      .map((entry) => byId.get(entry.id))
      .filter((item): item is ContentItem => item !== undefined);
  }, [entries, items]);

  if (error && hideOnError) return null;

  return (
    <ContentRow
      title="Continue Watching"
      items={watched}
      loading={loading}
      error={error}
      onRetry={retry}
      onSelect={openItem}
      getProgress={getProgress}
      emptyMessage="Titles you start watching will appear here."
      layout={layout}
      headingLevel={headingLevel}
      skeletonCount={3}
    />
  );
}
