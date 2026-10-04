import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library can't register this automatically:
// unmount rendered components after each test so they don't leak between tests.
afterEach(() => {
  cleanup();
});
