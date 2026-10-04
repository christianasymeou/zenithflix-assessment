import { useEffect, useEffectEvent, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

// Native HTML5 <video> was chosen over a YouTube/Vimeo embed because it fires
// playback events (timeupdate, pause, ended) directly in our code. Watch
// history needs the current position; a cross-origin iframe would hide it
// behind each provider's own player API. It also brings keyboard-accessible
// controls, no third-party scripts and no tracking cookies.

// timeupdate fires roughly 4 times a second; report progress at most once per
// interval so consumers (e.g. a localStorage write) aren't called on every tick
const PROGRESS_INTERVAL_MS = 1000;

// At or past this point a title counts as finished, so it starts over
// instead of resuming in the last seconds of the credits
const FINISHED_PERCENT = 98;

/** Percentage watched, or null while the duration is unknown */
function percentWatched(video: HTMLVideoElement): number | null {
  const { currentTime, duration } = video;
  // duration is NaN before metadata loads and Infinity for live streams
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return Math.min(100, (currentTime / duration) * 100);
}

interface VideoPlayerProps {
  src: string;
  poster: string;
  /** Accessible name for the video element */
  label: string;
  /** Called with the percentage watched (0–100), throttled */
  onProgress?: (percent: number) => void;
  /** Percentage to resume from (0–100); 0 or a finished title starts at the beginning */
  startAt?: number;
}

export function VideoPlayer({ src, poster, label, onProgress, startAt = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportRef = useRef(0);
  const [failed, setFailed] = useState(false);
  // Read once, on mount: startAt keeps changing while the video plays (the
  // history updates every second) and must not make the player jump around
  const [resumeAt] = useState(startAt);

  // The duration is unknown until metadata loads, so the jump happens here
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    if (resumeAt > 0 && resumeAt < FINISHED_PERCENT) {
      video.currentTime = (video.duration * resumeAt) / 100;
    }
  };

  // Reads the latest onProgress without making it an effect dependency
  const reportFinalProgress = useEffectEvent((video: HTMLVideoElement) => {
    const percent = percentWatched(video);
    if (percent !== null) onProgress?.(percent);
  });

  // When the player unmounts (e.g. the modal closes): save the exact final
  // position, which the throttle may not have reported yet, then stop playback
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video) return;
      reportFinalProgress(video);
      video.pause();
    };
  }, []);

  // `force` bypasses the throttle for pause/ended, so the final position
  // is never lost between ticks
  const reportProgress = (force: boolean) => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const percent = percentWatched(video);
    if (percent === null) return;

    const now = Date.now();
    if (!force && now - lastReportRef.current < PROGRESS_INTERVAL_MS) return;
    lastReportRef.current = now;

    onProgress(percent);
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
        onLoadedMetadata={handleLoadedMetadata}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
