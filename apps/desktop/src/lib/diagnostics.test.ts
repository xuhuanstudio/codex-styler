import { describe, expect, it } from "vitest";
import { diagnosticsSummary, type DiagnosticsReport } from "./diagnostics";

const report: DiagnosticsReport = {
  format: "codex-styler-diagnostics-v1",
  generatedAt: "1784300000",
  appVersion: "0.2.0-beta.1",
  platform: "windows",
  codexVersion: "26.707.91948",
  checks: [
    {
      id: "installation",
      status: "pass",
      detail: "A supported installation was located",
    },
  ],
  lifecycle: [
    {
      timestampMs: 1_784_300_000_000,
      action: "apply-configuration",
      outcome: "semantic",
      durationMs: 420,
    },
  ],
  privacy: ["No content or full paths"],
};

describe("redacted diagnostics export", () => {
  it("summarizes checks and timing without inventing machine identifiers", () => {
    const summary = diagnosticsSummary(report);
    expect(summary).toContain("[PASS] installation");
    expect(summary).toContain("apply-configuration semantic 420ms");
    expect(summary).not.toMatch(/Users|AppData|\\Users\\|\/home\//u);
  });
});
