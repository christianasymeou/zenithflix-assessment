import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library can't register this automatically:
// unmount rendered components after each test so they don't leak between tests.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement media playback and logs an error for every call.
// Components only need these to exist; tests that care about them spy on them.
HTMLMediaElement.prototype.pause = () => {};
HTMLMediaElement.prototype.play = () => Promise.resolve();
