import type { ThemeDefinition } from "@codex-styler/theme-core";
import { ChevronRight, Copy, Image, LockKeyhole, Plus, X } from "lucide-react";
import type { Locale, MessageKey } from "../../lib/i18n";

export type NewThemeStep = "choose" | "existing";

export function NewThemeDialog({
  step,
  themes,
  locale,
  t,
  onClose,
  onChooseStep,
  onBlank,
  onImage,
  onExisting,
  resolveAsset,
}: {
  step: NewThemeStep;
  themes: ThemeDefinition[];
  locale: Locale;
  t: (key: MessageKey) => string;
  onClose: () => void;
  onChooseStep: (step: NewThemeStep) => void;
  onBlank: () => void;
  onImage: () => void;
  onExisting: (theme: ThemeDefinition) => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="new-theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-theme-title"
      >
        <header className="new-theme-dialog__header">
          <div>
            {step === "existing" && (
              <button
                className="new-theme-dialog__back"
                onClick={() => onChooseStep("choose")}
                aria-label={t("back")}
              >
                <ChevronRight size={15} />
              </button>
            )}
            <span>{t("createTheme")}</span>
            <h2 id="new-theme-title">
              {step === "existing"
                ? t("chooseStartingTheme")
                : t("startYourTheme")}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t("cancel")}
          >
            <X size={16} />
          </button>
        </header>

        {step === "choose" ? (
          <div className="new-theme-options" data-scroll-surface="panel">
            <button
              className="new-theme-option new-theme-option--image"
              onClick={onImage}
            >
              <span className="new-theme-option__icon">
                <Image size={21} />
              </span>
              <span>
                <small>{t("recommended")}</small>
                <strong>{t("createFromImage")}</strong>
                <p>{t("createFromImageLong")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
            <button className="new-theme-option" onClick={onBlank}>
              <span className="new-theme-option__icon">
                <Plus size={21} />
              </span>
              <span>
                <small>{t("cleanStart")}</small>
                <strong>{t("startBlank")}</strong>
                <p>{t("startBlankDetail")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
            <button
              className="new-theme-option"
              onClick={() => onChooseStep("existing")}
            >
              <span className="new-theme-option__icon">
                <Copy size={21} />
              </span>
              <span>
                <small>{t("optionalStartingPoint")}</small>
                <strong>{t("useExistingTheme")}</strong>
                <p>{t("useExistingThemeDetail")}</p>
              </span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="new-theme-existing-list" data-scroll-surface="panel">
            {themes.map((theme) => {
              const localizedTheme = theme.locales[locale] ?? theme.locales.en;
              const preview = theme.metadata.preview
                ? resolveAsset(theme, theme.metadata.preview)
                : undefined;
              return (
                <button key={theme.id} onClick={() => onExisting(theme)}>
                  <span
                    className="new-theme-existing-list__preview"
                    style={{
                      backgroundColor: theme.variants.dark.background.color,
                      backgroundImage: preview ? `url(${preview})` : undefined,
                    }}
                  />
                  <span>
                    <strong>{localizedTheme.name}</strong>
                    <small>{localizedTheme.description}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
        )}
        <footer className="new-theme-dialog__footer">
          <LockKeyhole size={13} />
          {t("newThemePrivacy")}
        </footer>
      </section>
    </div>
  );
}
