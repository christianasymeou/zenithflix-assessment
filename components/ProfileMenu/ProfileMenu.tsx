"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import styles from "./ProfileMenu.module.css";

// Mock account until real sign-in exists
const USER_NAME = "User";

/**
 * Account menu in the header. Built as a disclosure (a button with
 * aria-expanded that shows a list of links and buttons) rather than an ARIA
 * role="menu": for navigation-style menus the disclosure pattern works with
 * normal Tab navigation and is announced more predictably by screen readers.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const confirmId = useId();
  const { entries, clearHistory } = useWatchHistory();

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  // While open: Escape closes and returns focus to the avatar; clicking or
  // tabbing anywhere outside closes it
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirming(false);
        buttonRef.current?.focus();
      }
    };
    const closeIfOutside = (event: Event) => {
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
        setConfirming(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
    };
  }, [open]);

  // The confirm step appears below "Clear watch history"; move focus to its
  // safe choice (Cancel) so keyboard users land on it
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const handleCancel = () => {
    setConfirming(false);
    clearRef.current?.focus();
  };

  const handleConfirmClear = () => {
    clearHistory();
    setStatus("Watch history cleared");
    close();
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.avatar}
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span aria-hidden="true">{USER_NAME.charAt(0)}</span>
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          <p className={styles.user}>
            Signed in as <strong>{USER_NAME}</strong>
          </p>

          <ul className={styles.items}>
            <li>
              <Link href="/continue-watching" className={styles.item} onClick={close}>
                My watch history
              </Link>
            </li>

            <li>
              <button
                ref={clearRef}
                type="button"
                className={styles.item}
                // Nothing to clear yet: say so instead of offering a no-op
                disabled={entries.length === 0}
                aria-expanded={confirming}
                aria-controls={confirmId}
                onClick={() => setConfirming((value) => !value)}
              >
                Clear watch history
                {entries.length === 0 && <span className={styles.note}>Nothing to clear</span>}
              </button>

              {confirming && (
                <div id={confirmId} className={styles.confirm}>
                  <p>Remove progress for {entries.length === 1 ? "1 title" : `${entries.length} titles`}?</p>
                  <div className={styles.confirmActions}>
                    <button ref={cancelRef} type="button" className={styles.secondary} onClick={handleCancel}>
                      Cancel
                    </button>
                    <button type="button" className={styles.danger} onClick={handleConfirmClear}>
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </li>

            <li>
              {/* Placeholder until real accounts exist */}
              <button type="button" className={styles.item} disabled>
                Sign out
                <span className={styles.note}>Coming soon</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Confirms the result to screen readers after the menu has closed */}
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}
