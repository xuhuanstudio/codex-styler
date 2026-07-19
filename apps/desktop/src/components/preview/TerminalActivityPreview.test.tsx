import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TerminalActivityPreview } from "./TerminalActivityPreview";

describe("TerminalActivityPreview", () => {
  it("shows commands, output, and completion state", () => {
    const { container } = render(<TerminalActivityPreview isChinese={false} />);

    expect(screen.getByText("Theme verification")).toBeInTheDocument();
    expect(screen.getByText("All checks passed")).toBeInTheDocument();
    expect(container.querySelectorAll("samp")).toHaveLength(4);
    expect(container.querySelector("pre")?.textContent).toContain("pnpm test");
    expect(container.querySelector("pre")?.textContent).toContain("pnpm build");
  });
});
