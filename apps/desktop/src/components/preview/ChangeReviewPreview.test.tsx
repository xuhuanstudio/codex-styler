import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChangeReviewPreview } from "./ChangeReviewPreview";

describe("ChangeReviewPreview", () => {
  it("shows files, semantic diff lines, and restore safety", () => {
    const { container } = render(<ChangeReviewPreview isChinese={false} />);

    expect(screen.getByText("Working tree")).toBeInTheDocument();
    expect(screen.getAllByText("runtime.js")).toHaveLength(2);
    expect(screen.getByText("Safe to restore")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-change="added"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-change="deleted"]')).toHaveLength(
      2,
    );
  });
});
