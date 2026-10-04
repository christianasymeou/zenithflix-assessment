import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

describe("Home page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the ZenithFlix heading", () => {
    // Never resolves: this test only checks the static shell
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "ZenithFlix" }),
    ).toBeInTheDocument();
  });
});
