import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translate, type MessageKey } from "../../lib/i18n";
import { RestartCodexDialog, UpdateDialog } from "./AppDialogs";

const t = (key: MessageKey) => translate("en", key);

describe("application dialogs", () => {
  afterEach(cleanup);

  it("keeps restart recovery explicit when a previous attempt failed", () => {
    const onConfirm = vi.fn();
    render(
      <RestartCodexDialog
        t={t}
        busy={false}
        error="The managed process did not exit"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The managed process did not exit",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry restart" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows localized release notes before allowing an update install", () => {
    const onInstall = vi.fn();
    const onSkip = vi.fn();
    render(
      <UpdateDialog
        update={{
          version: "0.2.0-beta.8",
          notes: null,
          releaseNotes: {
            locale: "en",
            summary: "A smaller and safer desktop update.",
            highlights: ["Clearer resource libraries"],
            fixes: ["Reliable restart recovery"],
          },
          publishedAt: "2026-07-20T00:00:00Z",
          prerelease: true,
        }}
        installStatus="idle"
        progress={null}
        t={t}
        onSkip={onSkip}
        onLater={vi.fn()}
        onInstall={onInstall}
      />,
    );

    expect(
      screen.getByText("A smaller and safer desktop update."),
    ).toBeVisible();
    expect(screen.getByText("Reliable restart recovery")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Skip this version" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Download and install" }),
    );
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onInstall).toHaveBeenCalledOnce();
  });
});
