import type { CSSProperties } from "react";
import type { ContentItem } from "@/types/content";
import styles from "./ContentTile.module.css";

interface ContentTileProps {
  item: ContentItem;
  onSelect: (item: ContentItem) => void;
  /** Percentage watched, 0–100; a progress bar shows when above 0 */
  progress?: number;
}

export function ContentTile({ item, onSelect, progress = 0 }: ContentTileProps) {
  // Whole numbers for display; anything watched shows at least 1%
  const shownPercent = Math.max(1, Math.round(progress));

  return (
    <li className={styles.item}>
      {/* Native button: focusable, Enter/Space and role for free (Code Review Issue 2) */}
      <button
        type="button"
        className={styles.tile}
        onClick={() => onSelect(item)}
        aria-haspopup="dialog"
        // Adds the progress to the name; starts with the visible title so
        // voice control ("click Dune") still matches (WCAG 2.5.3)
        aria-label={progress > 0 ? `${item.title}, ${shownPercent}% watched` : undefined}
      >
        <span className={styles.art}>
          {/* Plain <img>: hotlinked stock photos don't need next/image optimisation.
              alt="" because the caption below already names the button. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.poster}
            src={item.thumbnail}
            alt=""
            width={500}
            height={750}
            loading="lazy"
            decoding="async"
          />
          {/* Poster-style title. Hidden from screen readers so the button's
              name isn't read twice ("Dune Dune") */}
          <span className={styles.overlay} aria-hidden="true">
            <span className={styles.overlayText}>{item.title}</span>
          </span>
          {/* Visual only: content inside a <button> can't expose its own
              progressbar role, so the button's aria-label carries the percentage */}
          {progress > 0 && (
            <span
              className={styles.progress}
              style={{ "--progress": `${progress}%` } as CSSProperties}
              aria-hidden="true"
            />
          )}
        </span>
        <span className={styles.caption}>{item.title}</span>
      </button>
    </li>
  );
}
