"use client";

import { useEffect, useState } from "react";
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

  const handleSelect = (item: ContentItem) => {
    // Placeholder until the modal is built
    console.log("Selected:", item.title);
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>ZenithFlix</h1>

      {/* Always rendered so screen readers register it before its text changes */}
      <p className={styles.visuallyHidden} aria-live="polite">
        {loading ? "Loading content…" : ""}
      </p>

      {error ? (
        <div className={styles.error}>
          <p role="alert">{error}</p>
          <button type="button" className={styles.retry} onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : (
        <ContentRow
          title="Trending Now"
          items={trending}
          loading={loading}
          onSelect={handleSelect}
        />
      )}
    </main>
  );
}
