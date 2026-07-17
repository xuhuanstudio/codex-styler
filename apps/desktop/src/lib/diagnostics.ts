import { invoke } from "@tauri-apps/api/core";
import JSZip from "jszip";

export interface DiagnosticCheck {
  id: string;
  status: "pass" | "info" | "fail";
  detail: string;
}

export interface DiagnosticsReport {
  format: "codex-styler-diagnostics-v1";
  generatedAt: string;
  appVersion: string;
  platform: string;
  codexVersion: string | null;
  checks: DiagnosticCheck[];
  lifecycle: Array<{
    timestampMs: number;
    action: string;
    outcome: string;
    durationMs: number;
  }>;
  privacy: string[];
}

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function collectDiagnostics(
  customPath?: string | null,
): Promise<DiagnosticsReport> {
  if (!isTauri()) {
    return {
      format: "codex-styler-diagnostics-v1",
      generatedAt: String(Math.floor(Date.now() / 1000)),
      appVersion: "browser-preview",
      platform: navigator.platform,
      codexVersion: "Preview mode",
      checks: [
        {
          id: "preview",
          status: "info",
          detail: "Desktop checks are available in the installed application",
        },
      ],
      lifecycle: [],
      privacy: ["No content or full paths are included"],
    };
  }
  return invoke<DiagnosticsReport>("run_diagnostics", { customPath });
}

export function diagnosticsSummary(report: DiagnosticsReport): string {
  const generated = new Date(Number(report.generatedAt) * 1000).toISOString();
  const checks = report.checks
    .map(
      (check) => `[${check.status.toUpperCase()}] ${check.id}: ${check.detail}`,
    )
    .join("\n");
  const lifecycle =
    report.lifecycle.length === 0
      ? "No lifecycle events recorded."
      : report.lifecycle
          .map(
            (event) =>
              `${new Date(event.timestampMs).toISOString()} ${event.action} ${event.outcome} ${event.durationMs}ms`,
          )
          .join("\n");
  return `Codex Styler diagnostics
Generated: ${generated}
App: ${report.appVersion}
Platform: ${report.platform}
Codex version: ${report.codexVersion ?? "unknown"}

Checks
${checks}

Recent lifecycle
${lifecycle}

Privacy boundary
${report.privacy.map((item) => `- ${item}`).join("\n")}
`;
}

export async function exportDiagnostics(
  report: DiagnosticsReport,
): Promise<void> {
  const zip = new JSZip();
  zip.file("diagnostics.json", JSON.stringify(report, null, 2));
  zip.file("summary.txt", diagnosticsSummary(report));
  const archive = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  const url = URL.createObjectURL(archive);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `codex-styler-diagnostics-${Date.now()}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function openWindowsCompatibilityIssue(): void {
  window.open(
    "https://github.com/xuhuanstudio/codex-styler/issues/new?template=windows-compatibility.yml",
    "_blank",
    "noopener,noreferrer",
  );
}
