import type { ThemeVariant } from "@codex-styler/theme-core";
import { Check, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import type { MessageKey } from "../../lib/i18n";
import {
  resolveThemeColorHarmonyMode,
  themeColorHarmonySwatches,
  type ThemeColorHarmonyId,
} from "../../lib/theme-color-harmony";

const harmonyOptions = [
  {
    id: "automatic",
    label: "harmonyAutomatic",
    detail: "harmonyAutomaticDetail",
  },
  {
    id: "tonal",
    label: "harmonyTonal",
    detail: "harmonyTonalDetail",
  },
  {
    id: "contrast",
    label: "harmonyContrast",
    detail: "harmonyContrastDetail",
  },
] as const satisfies readonly {
  id: ThemeColorHarmonyId;
  label: MessageKey;
  detail: MessageKey;
}[];

export function ColorHarmonyPicker({
  variant,
  t,
  onChange,
}: {
  variant: ThemeVariant;
  t: (key: MessageKey) => string;
  onChange: (recipe: ThemeColorHarmonyId) => void;
}) {
  const mode = resolveThemeColorHarmonyMode(variant);

  return (
    <>
      <div
        className="color-harmony-picker"
        role="group"
        aria-label={t("colorHarmony")}
        data-theme-control="surfaces.color-harmony"
      >
        {harmonyOptions.map((option) => {
          const active = mode === option.id;
          const swatches = themeColorHarmonySwatches(variant, option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={active ? "is-active" : undefined}
              aria-pressed={active}
              onClick={() => onChange(option.id)}
            >
              <span
                className="color-harmony-picker__swatches"
                aria-hidden="true"
              >
                {swatches.map((color, index) => (
                  <i
                    key={`${option.id}-${index}`}
                    style={{ "--harmony-swatch": color } as CSSProperties}
                  />
                ))}
              </span>
              <span>
                <strong>{t(option.label)}</strong>
                <small>{t(option.detail)}</small>
              </span>
              {active && <Check size={13} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {mode === "authored" && (
        <div className="semantic-harmony-status" data-authored="true">
          <Sparkles size={14} aria-hidden="true" />
          <span>
            <strong>{t("authoredColorHarmony")}</strong>
            <small>{t("authoredColorHarmonyDetail")}</small>
          </span>
        </div>
      )}
    </>
  );
}
