import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskActivityPreview } from "./TaskActivityPreview";

describe("TaskActivityPreview", () => {
  it("shows the core Codex task states in English", () => {
    const { container } = render(<TaskActivityPreview isChinese={false} />);

    expect(screen.getByText("Implementation plan")).toBeInTheDocument();
    expect(screen.getByText("Run checks")).toBeInTheDocument();
    expect(screen.getByText("All checks passed")).toBeInTheDocument();
    expect(screen.getByText("3 files changed")).toBeInTheDocument();
    expect(
      container.querySelector('[data-message-author-role="user"]'),
    ).not.toBeNull();
    expect(container.querySelector("progress")?.getAttribute("value")).toBe(
      "2",
    );
  });

  it("localizes the work trace in Simplified Chinese", () => {
    render(<TaskActivityPreview isChinese />);

    expect(screen.getByText("实施计划")).toBeInTheDocument();
    expect(screen.getByText("运行检查")).toBeInTheDocument();
    expect(screen.getByText("3 个文件已更改")).toBeInTheDocument();
  });
});
