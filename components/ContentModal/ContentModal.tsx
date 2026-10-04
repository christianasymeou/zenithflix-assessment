import { useEffect, useId, useRef, type MouseEvent, type PointerEvent } from "react";
import { VideoPlayer } from "@/components/VideoPlayer/VideoPlayer";
import { formatDuration } from "@/lib/formatDuration";
import type { ContentItem } from "@/types/content";
import styles from "./ContentModal.module.css";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface ContentModalProps {
  item: ContentItem;
  /** Must be stable (useCallback): it is an effect dependency */
  onClose: () => void;
  onProgress?: (percent: number) => void;
}

export function ContentModal({ item, onClose, onProgress }: ContentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pointerDownOnBackdrop = useRef(false);
  const titleId = useId();

  // Focus management (Code Review Issue 3)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Remember the tile that opened the modal, so focus can return to it
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    let lastTabBackwards = false;

    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      lastTabBackwards = event.shiftKey;
      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!first) {
        event.preventDefault();
      } else if (!dialog.contains(active)) {
        // Focus escaped (e.g. the user clicked a non-focusable area inside the
        // dialog, which moves focus to <body>): pull it back in
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last && !(last instanceof HTMLVideoElement)) {
        // A <video>'s controls (play, seek, volume…) live in the browser's
        // shadow DOM, where activeElement is the <video> itself for every one
        // of them. Wrapping here would skip all but the first control, so Tab
        // moves through them natively and the focusin guard below catches it.
        event.preventDefault();
        first.focus();
      }
    };

    // Safety net: if focus lands outside the dialog by any route, pull it back
    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) {
        const focusable = getFocusable();
        (lastTabBackwards ? focusable[focusable.length - 1] : focusable[0])?.focus();
      }
    };

    // Lock background scroll, keeping whatever value was there before
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    closeButtonRef.current?.focus();

    return () => {
      // Remove the listeners before restoring focus, or the focusin guard
      // would pull focus straight back into the closing dialog
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, [onClose]);

  // Close only when both press and release happen on the backdrop, so a text
  // selection dragged out of the panel doesn't close the modal
  const handleBackdropPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = event.target === event.currentTarget;
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (pointerDownOnBackdrop.current && event.target === event.currentTarget) {
      onClose();
    }
    pointerDownOnBackdrop.current = false;
  };

  const duration = formatDuration(item.duration);

  return (
    // The backdrop's keyboard equivalent is Escape, handled above
    <div
      className={styles.backdrop}
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* First in the DOM so it is the first Tab stop; positioned top-right
            outside the scroll area so it stays visible on mobile */}
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={`Close ${item.title}`}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className={styles.scroll}>
          <VideoPlayer
            src={item.video_url}
            poster={item.thumbnail}
            label={`${item.title} preview`}
            onProgress={onProgress}
          />

          <div className={styles.body}>
            {/* Decorative: the title is right next to it */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.poster}
              src={item.thumbnail}
              alt=""
              width={500}
              height={750}
            />

            <div className={styles.info}>
              <h2 id={titleId} className={styles.title}>
                {item.title}
              </h2>

              <ul className={styles.meta}>
                <li>{item.year}</li>
                <li>
                  <span aria-hidden="true">★ </span>
                  {item.rating.toFixed(1)}
                  <span className="visually-hidden"> out of 10</span>
                </li>
                {duration && <li>{duration}</li>}
              </ul>

              {item.genre.length > 0 && (
                <ul className={styles.genres} aria-label="Genres">
                  {item.genre.map((genre) => (
                    <li key={genre} className={styles.genre}>
                      {genre}
                    </li>
                  ))}
                </ul>
              )}

              <p className={styles.description}>{item.description}</p>

              {item.cast.length > 0 && (
                <p className={styles.cast}>
                  <span className={styles.label}>Cast: </span>
                  {item.cast.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
