import { useId, useState } from "react";
import { ChevronDown, Play, SlidersHorizontal } from "lucide-react";
import { SelectField } from "../../components/ui/SelectField";
import type { MessageKey } from "../../lib/i18n";
import type { PreviewScenario } from "../../lib/storage";

interface ThemePreviewControlsProps {
  scenario: PreviewScenario;
  presentation: "styled" | "official";
  t: (key: MessageKey) => string;
  motionPreviewing: boolean;
  motionPreviewDisabled: boolean;
  motionPreviewHelp: string;
  onScenarioChange: (scenario: PreviewScenario) => void;
  onPresentationChange: (presentation: "styled" | "official") => void;
  onPreviewMotion: () => void;
}

const scenarios = [
  ["task", "previewTask"],
  ["settings", "previewSettings"],
  ["components", "previewComponents"],
  ["dialog", "previewDialog"],
  ["right-panel", "previewRightPanel"],
] satisfies Array<[PreviewScenario, MessageKey]>;

export function ThemePreviewControls({
  scenario,
  presentation,
  t,
  motionPreviewing,
  motionPreviewDisabled,
  motionPreviewHelp,
  onScenarioChange,
  onPresentationChange,
  onPreviewMotion,
}: ThemePreviewControlsProps) {
  const panelId = useId();
  const motionHelpId = useId();
  const [open, setOpen] = useState(false);
  const scenarioLabel = t(
    scenarios.find(([value]) => value === scenario)?.[1] ?? "previewTask",
  );

  return (
    <div
      className="theme-preview-controls"
      data-open={open || undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          (
            event.currentTarget.querySelector(
              "button",
            ) as HTMLButtonElement | null
          )?.focus();
        }
      }}
    >
      <button
        type="button"
        className="theme-preview-controls__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal size={12} />
        <span>{scenarioLabel}</span>
        <ChevronDown size={11} aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className="theme-preview-controls__panel"
        role="group"
        aria-label={t("previewControls")}
        hidden={!open}
      >
        <SelectField
          compact
          label={t("previewScenario")}
          value={scenario}
          onChange={(event) => {
            onScenarioChange(event.target.value as PreviewScenario);
            setOpen(false);
          }}
        >
          {scenarios.map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </SelectField>

        <div className="theme-preview-controls__comparison">
          <span>{t("compareAppearance")}</span>
          <div role="group" aria-label={t("compareAppearance")}>
            <button
              type="button"
              className={presentation === "styled" ? "is-active" : undefined}
              aria-pressed={presentation === "styled"}
              onClick={() => {
                onPresentationChange("styled");
                setOpen(false);
              }}
            >
              {t("styledAppearance")}
            </button>
            <button
              type="button"
              className={presentation === "official" ? "is-active" : undefined}
              aria-pressed={presentation === "official"}
              onClick={() => {
                onPresentationChange("official");
                setOpen(false);
              }}
            >
              {t("officialAppearance")}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="theme-preview-controls__motion"
          disabled={motionPreviewDisabled || motionPreviewing}
          aria-describedby={motionHelpId}
          onClick={() => {
            onPreviewMotion();
            setOpen(false);
          }}
        >
          <Play size={13} aria-hidden="true" />
          <span>
            <strong>
              {motionPreviewing
                ? t("previewMotionPlaying")
                : t("previewMotion")}
            </strong>
            <small id={motionHelpId} aria-live="polite">
              {motionPreviewHelp}
            </small>
          </span>
        </button>
      </div>
    </div>
  );
}
