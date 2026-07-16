import { Check, LockKeyhole, PackageCheck, RotateCcw, X } from "lucide-react";
import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import type { Locale, MessageKey } from "../lib/i18n";
import { themeAssetUrl } from "../lib/assets";

interface OnboardingProps {
  locale: Locale;
  selectedTheme: ThemeDefinition;
  onSelectTheme: (theme: ThemeDefinition) => void;
  onComplete: () => void;
  onClose?: () => void;
  t: (key: MessageKey) => string;
}

export function Onboarding({
  locale,
  selectedTheme,
  onSelectTheme,
  onComplete,
  onClose,
  t,
}: OnboardingProps) {
  return (
    <div className="modal-backdrop">
      <section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        {onClose && (
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        )}
        <div className="onboarding__eyebrow">
          <span className="status-pulse" />
          {t("unofficial")}
        </div>
        <h1 id="onboarding-title">{t("firstRunTitle")}</h1>
        <p className="onboarding__lead">{t("firstRunBody")}</p>

        <div className="safety-row">
          <span><RotateCcw size={16} />{t("safetyPointOne")}</span>
          <span><PackageCheck size={16} />{t("safetyPointTwo")}</span>
          <span><LockKeyhole size={16} />{t("safetyPointThree")}</span>
        </div>

        <div className="onboarding__section-title">{t("startWithTheme")}</div>
        <div className="onboarding-themes">
          {builtinThemes.map((theme) => {
            const preview = theme.metadata.preview
              ? themeAssetUrl(theme, theme.metadata.preview)
              : undefined;
            const localized = theme.locales[locale] ?? theme.locales.en;
            return (
              <button
                key={theme.id}
                className={
                  "onboarding-theme" +
                  (theme.id === selectedTheme.id ? " onboarding-theme--selected" : "")
                }
                onClick={() => onSelectTheme(theme)}
              >
                <span
                  className="onboarding-theme__visual"
                  style={{
                    backgroundColor: theme.variants.dark.background.color,
                    backgroundImage: preview ? "url(" + preview + ")" : undefined,
                  }}
                />
                <span className="onboarding-theme__copy">
                  <strong>{localized.name}</strong>
                  <small>{localized.description}</small>
                </span>
                <span className="onboarding-theme__check">
                  <Check size={13} />
                </span>
              </button>
            );
          })}
        </div>
        <button className="primary-button onboarding__continue" onClick={onComplete}>
          {t("continue")}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  );
}

