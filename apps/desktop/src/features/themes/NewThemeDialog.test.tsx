import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { nativeRefined } from "@codex-styler/theme-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translate, type MessageKey } from "../../lib/i18n";
import { NewThemeDialog } from "./NewThemeDialog";

const t = (key: MessageKey) => translate("en", key);

describe("NewThemeDialog", () => {
  afterEach(cleanup);

  it("keeps the creation choices and existing-theme navigation explicit", () => {
    const onChooseStep = vi.fn();
    const onImage = vi.fn();

    const { rerender } = render(
      <NewThemeDialog
        step="choose"
        themes={[nativeRefined]}
        locale="en"
        t={t}
        onClose={vi.fn()}
        onChooseStep={onChooseStep}
        onBlank={vi.fn()}
        onImage={onImage}
        onExisting={vi.fn()}
        resolveAsset={(_, path) => path}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /create from image/i }));
    expect(onImage).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /existing theme/i }));
    expect(onChooseStep).toHaveBeenCalledWith("existing");

    rerender(
      <NewThemeDialog
        step="existing"
        themes={[nativeRefined]}
        locale="en"
        t={t}
        onClose={vi.fn()}
        onChooseStep={onChooseStep}
        onBlank={vi.fn()}
        onImage={onImage}
        onExisting={vi.fn()}
        resolveAsset={(_, path) => path}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /choose a starting theme/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: /native refined/i }),
    ).toBeVisible();
  });
});
