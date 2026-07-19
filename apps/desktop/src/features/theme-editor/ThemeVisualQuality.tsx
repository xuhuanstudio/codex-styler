import type { ThemeDefinition } from "@codex-styler/theme-core";
import { AlertCircle, Check, ChevronRight, ShieldCheck } from "lucide-react";
import type { ThemeVariantName } from "../../lib/app-session";
import type { MessageKey } from "../../lib/i18n";
import {
  resolveThemeVisualQuality,
  type ThemeVisualQualityCheckId,
} from "../../lib/theme-visual-quality";

const labelKeys: Record<ThemeVisualQualityCheckId, MessageKey> = {
  "primary-text": "visualPrimaryText",
  "secondary-text": "visualSecondaryText",
  "accent-content": "visualAccentContent",
  boundaries: "visualBoundaries",
};

export function ThemeVisualQuality({
  theme,
  variant,
  t,
}: {
  theme: ThemeDefinition;
  variant: ThemeVariantName;
  t: (key: MessageKey) => string;
}) {
  const report = resolveThemeVisualQuality(theme, variant);
  const allChecksPass = report.checks.every(
    (check) => check.ratio + 0.005 >= check.minimum,
  );
  const hasSurfaceGuard =
    report.effectiveSurfaceOpacity > report.authoredSurfaceOpacity + 0.005;

  return (
    <details
      className="visual-quality"
      data-status={allChecksPass ? "ready" : "attention"}
    >
      <summary>
        <span className="visual-quality__icon">
          {allChecksPass ? (
            <ShieldCheck size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
        </span>
        <span>
          <strong>{t("visualSafety")}</strong>
          <small>
            {allChecksPass
              ? report.protectedCount > 0
                ? `${report.protectedCount} ${t(
                    report.protectedCount === 1
                      ? "visualSafeguardActive"
                      : "visualSafeguardsActive",
                  )}`
                : t("visualSafetyReadyDetail")
              : t("visualSafetyAttentionDetail")}
          </small>
        </span>
        <em>
          {t(allChecksPass ? "visualSafetyReady" : "visualSafetyAttention")}
        </em>
        <ChevronRight size={14} />
      </summary>
      <div className="visual-quality__details">
        <div className="visual-quality__checks">
          {report.checks.map((check) => (
            <div key={check.id} data-protected={check.protected || undefined}>
              <span>
                {check.ratio + 0.005 >= check.minimum ? (
                  <Check size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {t(labelKeys[check.id])}
              </span>
              <strong>{check.ratio.toFixed(1)}:1</strong>
            </div>
          ))}
        </div>
        {hasSurfaceGuard && (
          <div className="visual-quality__guard">
            <span>{t("visualSurfaceGuard")}</span>
            <strong>
              {Math.round(report.authoredSurfaceOpacity * 100)}% →{" "}
              {Math.round(report.effectiveSurfaceOpacity * 100)}%
            </strong>
          </div>
        )}
        <p>{t("visualSafetyRuntimeDetail")}</p>
      </div>
    </details>
  );
}
