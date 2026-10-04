"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ContentModal } from "@/components/ContentModal/ContentModal";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { fetchContent } from "@/lib/fetchContent";
import type { ContentItem } from "@/types/content";

interface CatalogContextValue {
  items: ContentItem[];
  loading: boolean;
  error: string | null;
  retry: () => void;
  openItem: (item: ContentItem) => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return context;
}

/**
 * Lives in the root layout, so the catalog is fetched once and survives
 * navigation between Home, Trending and Continue Watching. It also renders
 * the content modal, so any page can open a title.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  // Starts true: the first fetch begins as soon as the app mounts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Incrementing this re-runs the fetch effect (used by Retry)
  const [requestId, setRequestId] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const { getProgress, recordProgress } = useWatchHistory();

  useEffect(() => {
    const controller = new AbortController();

    fetchContent(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setItems(result);
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
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRequestId((id) => id + 1);
  }, []);

  // Stable identity: the modal's focus-trap effect depends on it, and a new
  // function each render would re-run that effect and steal focus
  const handleClose = useCallback(() => setSelectedItem(null), []);

  const handleProgress = useCallback(
    (percent: number) => {
      if (selectedItem) recordProgress(selectedItem.id, percent);
    },
    [selectedItem, recordProgress],
  );

  const value = useMemo(
    () => ({ items, loading, error, retry, openItem: setSelectedItem }),
    [items, loading, error, retry],
  );

  return (
    <CatalogContext.Provider value={value}>
      {/* Always rendered so screen readers register it before its text changes */}
      <p className="visually-hidden" aria-live="polite">
        {loading ? "Loading content…" : ""}
      </p>

      {children}

      {selectedItem && (
        // key: a fresh modal (and video player state) for each title
        <ContentModal
          key={selectedItem.id}
          item={selectedItem}
          onClose={handleClose}
          onProgress={handleProgress}
          progress={getProgress(selectedItem.id)}
        />
      )}
    </CatalogContext.Provider>
  );
}
