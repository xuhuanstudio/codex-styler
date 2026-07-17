import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DirectionDial } from "./DirectionDial";

describe("direction dial", () => {
  afterEach(cleanup);
  it("exposes clockwise-from-up slider semantics and keyboard updates", () => {
    const onChange = vi.fn();
    render(<DirectionDial angle={90} onChange={onChange} label="Direction" />);
    const dial = screen.getByRole("slider", { name: "Direction" });
    expect(dial).toHaveAttribute(
      "aria-valuetext",
      "90 degrees, clockwise from up",
    );
    fireEvent.keyDown(dial, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(91);
    fireEvent.keyDown(dial, { key: "ArrowLeft", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(75);
  });

  it("keeps the numeric control bound to the same angle", () => {
    const onChange = vi.fn();
    render(<DirectionDial angle={15} onChange={onChange} label="Direction" />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "270" },
    });
    expect(onChange).toHaveBeenCalledWith(270);
  });
});
