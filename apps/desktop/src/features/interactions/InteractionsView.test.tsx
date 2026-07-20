import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { translate } from "../../lib/i18n";
import { InteractionsView } from "./InteractionsView";

describe("InteractionsView", () => {
  afterEach(cleanup);

  it("supports roving keyboard selection without adding duplicate actions", () => {
    const onChange = vi.fn();
    render(
      <InteractionsView
        mode="disabled"
        t={(key) => translate("en", key)}
        onChange={onChange}
      />,
    );

    const official = screen.getByRole("option", {
      name: /Use the official control/,
    });
    official.focus();
    fireEvent.keyDown(official, { key: "ArrowDown" });

    expect(onChange).toHaveBeenCalledWith("marbles");
    expect(screen.getByRole("option", { name: /Triple Drop/ })).toHaveFocus();
  });

  it("explains that every game result controls the complete Codex loadout", () => {
    render(
      <InteractionsView
        mode="toss"
        t={(key) => translate("en", key)}
        onChange={vi.fn()}
      />,
    );

    const binding = screen.getByRole("region", {
      name: "Every play returns one complete loadout",
    });
    expect(binding).toHaveTextContent("Model engine");
    expect(binding).toHaveTextContent("Reasoning effort");
    expect(binding).toHaveTextContent("Response speed");
    expect(binding).toHaveTextContent(
      "The action itself selects all three real settings",
    );
  });
});
