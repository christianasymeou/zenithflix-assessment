import { useId } from "react";
import { ContentTile } from "@/components/ContentTile/ContentTile";
import { SkeletonTile } from "@/components/SkeletonTile/SkeletonTile";
import type { ContentItem } from "@/types/content";
import styles from "./ContentRow.module.css";

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  loading: boolean;
  onSelect: (item: ContentItem) => void;
  skeletonCount?: number;
}

export function ContentRow({
  title,
  items,
  loading,
  onSelect,
  skeletonCount = 6,
}: ContentRowProps) {
  // Unique per instance, so several rows on one page never share an id
  const headingId = useId();

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {title}
      </h2>

      {loading ? (
        <ul className={styles.list} aria-hidden="true">
          {Array.from({ length: skeletonCount }, (_, index) => (
            <SkeletonTile key={index} />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Nothing to show here right now. Check back soon.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <ContentTile key={item.id} item={item} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}
