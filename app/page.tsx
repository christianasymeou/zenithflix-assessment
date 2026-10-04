"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentModal } from "@/components/ContentModal/ContentModal";
import { ContentRow } from "@/components/ContentRow/ContentRow";
import { fetchContent } from "@/lib/fetchContent";
import type { ContentItem } from "@/types/content";
import styles from "./page.module.css";

export default function Home() {
  const [trending, setTrending] = useState<ContentItem[]>([]);
  // Starts true: the first fetch begins as soon as the page mounts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incrementing this re-runs the fetch effect (used by Retry)
  const [requestId, setRequestId] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchContent(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setTrending(items);
      })
      .catch(() => {
        // Our own cancellation is not an error worth showing
        if (!controller.signal.aborted) {
          setError("We couldn't load content. Check your connection and try again.");
        }
      })
      .finally(() => {
        // A cancelled request must not end the loading state of the request
        // that replaced it (the loading race from the code review)
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestId]);

  // Loading/error are reset here, in the event that causes the change,
  // rather than synchronously inside the effect
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRequestId((id) => id + 1);
  };

  // Stable identity: the modal's focus-trap effect depends on it, and a new
  // function each render would re-run that effect and steal focus
  const handleClose = useCallback(() => setSelectedItem(null), []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ZenithFlix</h1>

      {/* Always rendered so screen readers register it before its text changes */}
      <p className="visually-hidden" aria-live="polite">
        {loading ? "Loading content…" : ""}
      </p>

      <ContentRow
        title="Trending Now"
        items={trending}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        onSelect={setSelectedItem}
      />

      {selectedItem && (
        // key: a fresh modal (and video player state) for each title
        <ContentModal key={selectedItem.id} item={selectedItem} onClose={handleClose} />
      )}
    </main>
  );
}
