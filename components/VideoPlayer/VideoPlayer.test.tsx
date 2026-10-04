import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "./VideoPlayer";

/**
 * jsdom has no media engine, so the video's duration and position are set
 * by hand. Returns the <video> element.
 */
function renderPlayer(props: Partial<Parameters<typeof VideoPlayer>[0]> = {}) {
  const view = render(
    <VideoPlayer src="https://example.com/film.mp4" poster="poster.jpg" label="Dune preview" {...props} />,
  );
  const video = view.container.querySelector("video") as HTMLVideoElement;
  Object.defineProperty(video, "duration", { configurable: true, value: 600 });
  Object.defineProperty(video, "currentTime", { configurable: true, writable: true, value: 0 });
  return { ...view, video };
}

describe("VideoPlayer", () => {
  it("resumes from the saved position once the video's length is known", () => {
    const { video } = renderPlayer({ startAt: 40 });

    fireEvent.loadedMetadata(video);

    expect(video.currentTime).toBe(240); // 40% of 600 seconds
  });

  it("starts a finished title from the beginning instead of the credits", () => {
    const { video } = renderPlayer({ startAt: 99 });

    fireEvent.loadedMetadata(video);

    expect(video.currentTime).toBe(0);
  });

  it("reports the exact position when paused", () => {
    const onProgress = vi.fn();
    const { video } = renderPlayer({ onProgress });

    video.currentTime = 150;
    fireEvent.pause(video);

    expect(onProgress).toHaveBeenCalledWith(25);
  });

  it("reports the final position when it closes, even between throttled updates", () => {
    const onProgress = vi.fn();
    const { video, unmount } = renderPlayer({ onProgress });

    video.currentTime = 60;
    fireEvent.timeUpdate(video); // first update: reported (10%)
    video.currentTime = 63;
    fireEvent.timeUpdate(video); // within the 1s throttle: skipped
    expect(onProgress).toHaveBeenLastCalledWith(10);

    unmount();

    expect(onProgress).toHaveBeenLastCalledWith(10.5);
  });

  it("doesn't report progress before the video's length is known", () => {
    const onProgress = vi.fn();
    const { video } = renderPlayer({ onProgress });
    Object.defineProperty(video, "duration", { configurable: true, value: Number.NaN });

    fireEvent.pause(video);

    expect(onProgress).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the video fails to load", () => {
    const { video } = renderPlayer();

    fireEvent.error(video);

    expect(screen.getByRole("status")).toHaveTextContent("Video unavailable");
  });
});
