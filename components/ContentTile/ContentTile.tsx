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
      <button type="button" className={styles.tile} onClick={() => onSelect(item)}>
        {/* Plain <img>: placeholder posters don't need next/image optimisation.
            alt="" because the visible title below already names the button. */}
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
        <span className={styles.title}>{item.title}</span>
      </button>
    </li>
  );
}
