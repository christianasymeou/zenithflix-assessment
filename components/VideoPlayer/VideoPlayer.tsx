import { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

// Native HTML5 <video> was chosen over a YouTube/Vimeo embed because it fires
// playback events (timeupdate, pause, ended) directly in our code. Watch
// history needs the current position; a cross-origin iframe would hide it
// behind each provider's own player API. It also brings keyboard-accessible
// controls, no third-party scripts and no tracking cookies.

// timeupdate fires roughly 4 times a second; report progress at most once per
// interval so consumers (e.g. a localStorage write) aren't called on every tick
const PROGRESS_INTERVAL_MS = 1000;

interface VideoPlayerProps {
  src: string;
  poster: string;
  /** Accessible name for the video element */
  label: string;
  /** Called with the percentage watched (0–100), throttled */
  onProgress?: (percent: number) => void;
}

export function VideoPlayer({ src, poster, label, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportRef = useRef(0);
  const [failed, setFailed] = useState(false);

  // Stop playback when the player unmounts (e.g. the modal closes)
  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  // `force` bypasses the throttle for pause/ended, so the final position
  // is never lost between ticks
  const reportProgress = (force: boolean) => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const { currentTime, duration } = video;
    // duration is NaN before metadata loads and Infinity for live streams
    if (!Number.isFinite(duration) || duration <= 0) return;

    const now = Date.now();
    if (!force && now - lastReportRef.current < PROGRESS_INTERVAL_MS) return;
    lastReportRef.current = now;

    onProgress(Math.min(100, Math.round((currentTime / duration) * 100)));
  };

  if (failed) {
    return (
      <div className={`${styles.frame} ${styles.fallback}`} role="status">
        <p className={styles.fallbackTitle}>Video unavailable</p>
        <p className={styles.fallbackText}>
          We couldn&apos;t load this video. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        aria-label={label}
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={() => reportProgress(false)}
        onPause={() => reportProgress(true)}
        onEnded={() => reportProgress(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
