import { useId, useRef, useState } from "react";
import { ContentTile } from "@/components/ContentTile/ContentTile";
import { SkeletonTile } from "@/components/SkeletonTile/SkeletonTile";
import type { ContentItem } from "@/types/content";
import styles from "./ContentRow.module.css";

// Titles shown before "Show all". Matches --tiles-per-view on desktop in
// ContentRow.module.css, so the collapsed row exactly fills the screen.
const COLLAPSED_COUNT = 5;

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  loading: boolean;
  onSelect: (item: ContentItem) => void;
  /** When set, the row shows this message and a Retry button instead of tiles */
  error?: string | null;
  onRetry?: () => void;
  /** Watch progress per title (0–100), shown as a bar on each tile */
  getProgress?: (id: number) => number;
  emptyMessage?: string;
  skeletonCount?: number;
  /** "row": collapsed row with a Show all toggle. "grid": every title, always. */
  layout?: "row" | "grid";
  /** 1 when the row is the page's main content (its own page), otherwise 2 */
  headingLevel?: 1 | 2;
}

export function ContentRow({
  title,
  items,
  loading,
  onSelect,
  error = null,
  onRetry,
  getProgress,
  emptyMessage = "Nothing to show here right now. Check back soon.",
  skeletonCount = 6,
  layout = "row",
  headingLevel = 2,
}: ContentRowProps) {
  // Unique per instance, so several rows on one page never share an id
  const headingId = useId();
  const listId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [expanded, setExpanded] = useState(false);

  const Heading = headingLevel === 1 ? "h1" : "h2";
  const showGrid = layout === "grid" || expanded;
  const canExpand = layout === "row" && !loading && !error && items.length > COLLAPSED_COUNT;
  const visibleItems = showGrid ? items : items.slice(0, COLLAPSED_COUNT);

  // The Retry button disappears once clicked; without this, focus would fall
  // back to <body> and keyboard users would restart from the top of the page
  const handleRetry = () => {
    onRetry?.();
    headingRef.current?.focus();
  };

  let content;
  if (error) {
    content = (
      <div className={styles.error}>
        <p role="alert">{error}</p>
        {onRetry && (
          <button type="button" className={styles.retry} onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    );
  } else if (loading) {
    content = (
      <ul className={layout === "grid" ? styles.grid : styles.list} aria-hidden="true">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <SkeletonTile key={index} />
        ))}
      </ul>
    );
  } else if (items.length === 0) {
    content = <p className={styles.empty}>{emptyMessage}</p>;
  } else {
    // Collapsed: the first few titles in a horizontal row (it scrolls on
    // smaller screens). Expanded: every title in a wrapping grid.
    content = (
      <ul id={listId} className={showGrid ? styles.grid : styles.list}>
        {visibleItems.map((item) => (
          <ContentTile
            key={item.id}
            item={item}
            onSelect={onSelect}
            progress={getProgress?.(item.id)}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        {/* tabIndex -1: focusable from code (after Retry), not a Tab stop */}
        <Heading id={headingId} ref={headingRef} tabIndex={-1} className={styles.heading}>
          {title}
        </Heading>

        {/* Next to the heading, so keyboard users reach it before the tiles */}
        {canExpand && (
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <>
                Show less{" "}
                <span className="visually-hidden">{title}</span>
              </>
            ) : (
              <>
                Show all{" "}
                <span className="visually-hidden">{title}</span> ({items.length})
              </>
            )}
          </button>
        )}
      </div>

      {content}
    </section>
  );
}
