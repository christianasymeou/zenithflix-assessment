import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY } from "@/hooks/useWatchHistory";
import { ProfileMenu } from "./ProfileMenu";

function seedHistory(count: number) {
  const history = Object.fromEntries(
    Array.from({ length: count }, (_, index) => [index + 1, { progress: 50, updatedAt: index }]),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function renderMenu() {
  const user = userEvent.setup();
  render(
    <>
      <ProfileMenu />
      <button type="button">Outside</button>
    </>,
  );
  return { user, avatar: screen.getByRole("button", { name: "Account menu" }) };
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    // The history hook caches by stored value; tell it storage changed
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY })));
  });

  it("opens and closes from the avatar, announcing its state", async () => {
    const { user, avatar } = renderMenu();
    expect(avatar).toHaveAttribute("aria-expanded", "false");

    await user.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Signed in as")).toHaveTextContent("Signed in as User");
    expect(screen.getByRole("link", { name: "My watch history" })).toHaveAttribute(
      "href",
      "/continue-watching",
    );

    await user.click(avatar);
    expect(avatar).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Signed in as")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the avatar", async () => {
    const { user, avatar } = renderMenu();
    await user.click(avatar);
    await user.tab();
    expect(screen.getByRole("link", { name: "My watch history" })).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(avatar).toHaveAttribute("aria-expanded", "false");
    expect(avatar).toHaveFocus();
  });

  it("closes when clicking or tabbing outside", async () => {
    const { user, avatar } = renderMenu();

    await user.click(avatar);
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(avatar).toHaveAttribute("aria-expanded", "false");

    await user.click(avatar);
    await user.tab(); // My watch history
    await user.tab(); // Clear is disabled (no history) and Sign out is disabled → leaves the menu
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(avatar).toHaveAttribute("aria-expanded", "false");
  });

  it("disables Clear watch history when there is nothing to clear", async () => {
    const { user, avatar } = renderMenu();

    await user.click(avatar);

    expect(screen.getByRole("button", { name: /clear watch history/i })).toBeDisabled();
    expect(screen.getByText("Nothing to clear")).toBeInTheDocument();
  });

  it("asks for confirmation, and Cancel keeps the history", async () => {
    seedHistory(3);
    const { user, avatar } = renderMenu();
    await user.click(avatar);
    const clear = screen.getByRole("button", { name: "Clear watch history" });

    await user.click(clear);
    expect(clear).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Remove progress for 3 titles?")).toBeInTheDocument();
    // Focus lands on the safe choice
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();

    await user.click(cancel);

    expect(screen.queryByText(/remove progress/i)).not.toBeInTheDocument();
    expect(clear).toHaveFocus();
    expect(Object.keys(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"))).toHaveLength(3);
  });

  it("clears the history after confirming, then closes and announces it", async () => {
    seedHistory(2);
    const { user, avatar } = renderMenu();
    await user.click(avatar);

    await user.click(screen.getByRole("button", { name: "Clear watch history" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "")).toEqual({});
    expect(avatar).toHaveAttribute("aria-expanded", "false");
    expect(avatar).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Watch history cleared");
  });

  it("shows Sign out as a disabled placeholder", async () => {
    const { user, avatar } = renderMenu();

    await user.click(avatar);

    expect(screen.getByRole("button", { name: /sign out/i })).toBeDisabled();
  });
});
