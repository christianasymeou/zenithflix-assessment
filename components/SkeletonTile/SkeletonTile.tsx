import styles from "./SkeletonTile.module.css";

// Purely visual placeholder: hidden from assistive technology, which hears
// the page's "Loading content…" live region instead.
export function SkeletonTile() {
  return (
    <li className={styles.item} aria-hidden="true">
      <div className={`${styles.block} ${styles.poster}`} />
      <div className={`${styles.block} ${styles.title}`} />
    </li>
  );
}
