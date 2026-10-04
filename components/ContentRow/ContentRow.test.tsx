import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/types/content";
import { ContentRow } from "./ContentRow";

const makeItem = (id: number): ContentItem => ({
  id,
  title: `Movie ${id}`,
  year: 2020,
  genre: ["Drama"],
  rating: 7,
  thumbnail: `https://example.com/${id}.jpg`,
  video_url: `https://example.com/${id}.mp4`,
  duration: 120,
  description: "A movie.",
  cast: [],
  watchProgress: 0,
});

const items = Array.from({ length: 8 }, (_, index) => makeItem(index + 1));

type RowProps = Parameters<typeof ContentRow>[0];

function renderRow(props: Partial<RowProps> = {}) {
  const onSelect = vi.fn();
  render(
    <ContentRow title="Trending Now" items={items} loading={false} onSelect={onSelect} {...props} />,
  );
  return { onSelect };
}

/** The tile buttons in the row's list */
const tiles = () => within(screen.getByRole("list")).queryAllByRole("button");

describe("ContentRow", () => {
  it("is a region named by its heading", () => {
    renderRow();

    expect(screen.getByRole("region", { name: "Trending Now" })).toBeInTheDocument();
  });

  it("opens a title with the keyboard (tiles are real buttons)", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderRow();

    await user.tab(); // "Show all" comes first, next to the heading
    await user.tab();
    expect(screen.getByRole("button", { name: "Movie 1" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("shows skeletons while loading, hidden from screen readers", () => {
    renderRow({ loading: true, items: [] });

    // No accessible list or tiles yet: the skeleton list is aria-hidden
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trending Now" })).toBeInTheDocument();
  });

  it("shows an empty-state message when there are no titles", () => {
    renderRow({ items: [], emptyMessage: "Titles you start watching will appear here." });

    expect(screen.getByText("Titles you start watching will appear here.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the error and moves focus to the heading after Retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderRow({ error: "We couldn't load content.", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load content.");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    // The Retry button is about to disappear; focus must not fall to <body>
    expect(screen.getByRole("heading", { name: "Trending Now" })).toHaveFocus();
  });

  it("shows 5 titles, then all of them after Show all", async () => {
    const user = userEvent.setup();
    renderRow();
    const toggle = screen.getByRole("button", { name: /show all/i });

    expect(tiles()).toHaveLength(5);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // The row's title is hidden visually but read out, for context
    expect(toggle).toHaveAccessibleName("Show all Trending Now (8)");

    await user.click(toggle);

    expect(tiles()).toHaveLength(8);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Show less Trending Now");
    // Focus stays on the toggle so keyboard users don't lose their place
    expect(toggle).toHaveFocus();
  });

  it("has no Show all button when every title already fits", () => {
    renderRow({ items: items.slice(0, 5) });

    expect(screen.queryByRole("button", { name: /show all/i })).not.toBeInTheDocument();
  });

  it("shows every title with no toggle in the grid layout", () => {
    renderRow({ layout: "grid", headingLevel: 1 });

    expect(tiles()).toHaveLength(8);
    expect(screen.queryByRole("button", { name: /show all/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Trending Now" })).toBeInTheDocument();
  });

  it("includes watch progress in a tile's accessible name", () => {
    renderRow({ getProgress: (id) => (id === 1 ? 30 : id === 2 ? 0.4 : 0) });

    expect(screen.getByRole("button", { name: "Movie 1, 30% watched" })).toBeInTheDocument();
    // A few seconds of viewing still counts, shown as 1% rather than 0%
    expect(screen.getByRole("button", { name: "Movie 2, 1% watched" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movie 3" })).toBeInTheDocument();
  });
});
