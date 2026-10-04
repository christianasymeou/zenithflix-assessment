import type { ContentItem } from "@/types/content";
import styles from "./ContentTile.module.css";

interface ContentTileProps {
  item: ContentItem;
  onSelect: (item: ContentItem) => void;
}

export function ContentTile({ item, onSelect }: ContentTileProps) {
  return (
    <li className={styles.item}>
      {/* Native button: focusable, Enter/Space and role for free (Code Review Issue 2) */}
      <button
        type="button"
        className={styles.tile}
        onClick={() => onSelect(item)}
        aria-haspopup="dialog"
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
        </span>
        <span className={styles.caption}>{item.title}</span>
      </button>
    </li>
  );
}
