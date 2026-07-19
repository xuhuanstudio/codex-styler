import { useId, useState, type PointerEvent } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SelectField } from "../../components/ui/SelectField";
import type { MessageKey } from "../../lib/i18n";
import type { PreviewScenario } from "../../lib/storage";

interface ThemePreviewControlsProps {
  scenario: PreviewScenario;
  presentation: "styled" | "official";
  t: (key: MessageKey) => string;
  onScenarioChange: (scenario: PreviewScenario) => void;
  onPresentationChange: (presentation: "styled" | "official") => void;
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
  onScenarioChange,
  onPresentationChange,
}: ThemePreviewControlsProps) {
  const panelId = useId();
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = pinned || hovered;
  const scenarioLabel = t(
    scenarios.find(([value]) => value === scenario)?.[1] ?? "previewTask",
  );

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") setHovered(true);
  }

  return (
    <div
      className="theme-preview-controls"
      data-open={open || undefined}
      data-pinned={pinned || undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setPinned(false);
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
        onClick={() => setPinned((current) => !current)}
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
            setPinned(false);
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
              onClick={() => onPresentationChange("styled")}
            >
              {t("styledAppearance")}
            </button>
            <button
              type="button"
              className={presentation === "official" ? "is-active" : undefined}
              aria-pressed={presentation === "official"}
              onClick={() => onPresentationChange("official")}
            >
              {t("officialAppearance")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
