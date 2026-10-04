import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContentItem } from "@/types/content";
import { ContentModal } from "./ContentModal";

// The real player is tested on its own. A plain button stands in for its
// controls, giving the focus trap a known last focusable element.
vi.mock("@/components/VideoPlayer/VideoPlayer", () => ({
  VideoPlayer: () => <button type="button">Play</button>,
}));

const dune: ContentItem = {
  id: 4,
  title: "Dune",
  year: 2021,
  genre: ["Sci-Fi", "Adventure"],
  rating: 8,
  thumbnail: "https://example.com/dune.jpg",
  video_url: "https://example.com/dune.mp4",
  duration: 155,
  description: "A desert planet.",
  cast: ["Timothee Chalamet", "Rebecca Ferguson"],
  watchProgress: 0,
};

/** A tile-like trigger that opens the modal, as on the real page */
function Harness({ item = dune, onClose }: { item?: ContentItem; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    onClose();
    setOpen(false);
  }, [onClose]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {item.title} tile
      </button>
      <button type="button">Another tile</button>
      {open && <ContentModal item={item} onClose={close} />}
    </>
  );
}

async function openModal(item?: ContentItem) {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<Harness item={item} onClose={onClose} />);
  await user.click(screen.getByRole("button", { name: `${(item ?? dune).title} tile` }));
  return { user, onClose };
}

describe("ContentModal", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("opens as a dialog named after the title, with the details shown", async () => {
    await openModal();

    const dialog = screen.getByRole("dialog", { name: "Dune" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("2021");
    expect(dialog).toHaveTextContent("2h 35m");
    expect(dialog).toHaveTextContent("A desert planet.");
    expect(dialog).toHaveTextContent("Timothee Chalamet, Rebecca Ferguson");
  });

  it("moves focus to the Close button when it opens", async () => {
    await openModal();

    expect(screen.getByRole("button", { name: "Close Dune" })).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab inside the dialog", async () => {
    const { user } = await openModal();
    const close = screen.getByRole("button", { name: "Close Dune" });
    const play = screen.getByRole("button", { name: "Play" });

    await user.tab();
    expect(play).toHaveFocus();

    // Tab on the last element wraps to the first, not to the page behind
    await user.tab();
    expect(close).toHaveFocus();

    // Shift+Tab on the first element wraps to the last
    await user.tab({ shift: true });
    expect(play).toHaveFocus();
  });

  it("closes on Escape and returns focus to the tile that opened it", async () => {
    const { user, onClose } = await openModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dune tile" })).toHaveFocus();
  });

  it("returns focus to the tile when closed with the Close button", async () => {
    const { user } = await openModal();

    await user.click(screen.getByRole("button", { name: "Close Dune" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dune tile" })).toHaveFocus();
  });

  it("closes on a backdrop click, but not on a click inside the panel", async () => {
    const { user, onClose } = await openModal();
    const dialog = screen.getByRole("dialog");

    await user.click(screen.getByRole("heading", { name: "Dune" }));
    expect(onClose).not.toHaveBeenCalled();

    // The backdrop is the element wrapping the dialog panel
    await user.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks background scrolling while open and restores it on close", async () => {
    const { user } = await openModal();
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("handles a title with no genres, cast or runtime without empty sections", async () => {
    await openModal({ ...dune, genre: [], cast: [], duration: 0 });

    const dialog = screen.getByRole("dialog", { name: "Dune" });
    expect(screen.queryByRole("list", { name: "Genres" })).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent("Cast:");
    expect(dialog).toHaveTextContent("2021");
  });
});
