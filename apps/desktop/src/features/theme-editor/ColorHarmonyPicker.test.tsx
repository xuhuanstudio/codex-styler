import { fireEvent, render, screen } from "@testing-library/react";
import { builtinThemes } from "@codex-styler/theme-core";
import { describe, expect, it, vi } from "vitest";
import { translate } from "../../lib/i18n";
import { ColorHarmonyPicker } from "./ColorHarmonyPicker";

describe("ColorHarmonyPicker", () => {
  it("preserves authored palettes and exposes understandable recipes", () => {
    const onChange = vi.fn();
    render(
      <ColorHarmonyPicker
        variant={builtinThemes[0].variants.dark}
        t={(key) => translate("en", key)}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Designed component palette")).toBeVisible();
    const tonal = screen.getByRole("button", { name: /Tonal harmony/ });
    expect(tonal).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tonal);
    expect(onChange).toHaveBeenCalledWith("tonal");
  });
});
