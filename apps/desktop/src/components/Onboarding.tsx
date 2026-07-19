import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  MonitorCheck,
  PackageCheck,
  Play,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import {
  builtinThemes,
  type CompanionDefinition,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import type { Locale, MessageKey } from "../lib/i18n";
import type { CodexDetection } from "../lib/runtime";
import type { ThemeVariantName } from "../lib/app-session";
import { themeAssetUrl } from "../lib/assets";
import { PreviewWorkspace } from "./PreviewWorkspace";

interface OnboardingProps {
  isFirstRun: boolean;
  locale: Locale;
  detection: CodexDetection | null;
  selectedTheme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  selectedCompanion: CompanionDefinition | null;
  recommendedCompanion: CompanionDefinition | null;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  requiresRestart: boolean;
  onSelectTheme: (theme: ThemeDefinition) => void;
  onSelectCompanion: (companion: CompanionDefinition | null) => void;
  onSelectVariant: (variant: ThemeVariantName) => void;
  onApply: () => void;
  onOpenSettings: () => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onClose?: () => void;
  t: (key: MessageKey) => string;
}

const STEPS = ["setupSafetyStep", "setupStyleStep", "setupReviewStep"] as const;

export function Onboarding({
  isFirstRun,
  locale,
  detection,
  selectedTheme,
  previewTheme,
  selectedCompanion,
  recommendedCompanion,
  variant,
  reduceMotion,
  requiresRestart,
  onSelectTheme,
  onSelectCompanion,
  onSelectVariant,
  onApply,
  onOpenSettings,
  resolveAsset,
  onClose,
  t,
}: OnboardingProps) {
  const [step, setStep] = useState(0);
  const selectedThemeCopy =
    selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedCompanionCopy = selectedCompanion
    ? (selectedCompanion.locales[locale] ?? selectedCompanion.locales.en)
    : null;
  const recommendedCopy = recommendedCompanion
    ? (recommendedCompanion.locales[locale] ?? recommendedCompanion.locales.en)
    : null;
  const installationReady = detection?.installed === true;

  return (
    <div className="modal-backdrop">
      <section
        className="onboarding onboarding--guided"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {onClose && (
          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t("cancel")}
          >
            <X size={17} />
          </button>
        )}

        <nav className="onboarding-steps" aria-label={t("setupGuide")}>
          {STEPS.map((label, index) => (
            <button
              key={label}
              className={
                index === step ? "is-active" : index < step ? "is-complete" : ""
              }
              onClick={() => index < step && setStep(index)}
              disabled={index > step}
              aria-current={index === step ? "step" : undefined}
            >
              <span>{index < step ? <Check size={12} /> : index + 1}</span>
              {t(label)}
            </button>
          ))}
        </nav>

        <div className="onboarding-content">
          {step === 0 && (
            <div className="onboarding-stage onboarding-stage--safety">
              <div className="onboarding__eyebrow">
                <span className="status-pulse" />
                {t("unofficial")}
              </div>
              <h1 id="onboarding-title">{t("setupSafetyTitle")}</h1>
              <p className="onboarding__lead">{t("setupSafetyBody")}</p>

              <div
                className={`onboarding-detection${
                  detection?.installed === false ? " is-missing" : ""
                }`}
                aria-live="polite"
              >
                <span>
                  <MonitorCheck size={20} />
                </span>
                <div>
                  <strong>
                    {detection === null
                      ? t("codexDetectionChecking")
                      : detection.installed
                        ? t("codexDetected")
                        : t("codexDetectionMissing")}
                  </strong>
                  <small>
                    {detection === null
                      ? t("codexDetectionCheckingDetail")
                      : detection.installed
                        ? [detection.version, detection.platform]
                            .filter(Boolean)
                            .join(" · ")
                        : t("codexDetectionMissingDetail")}
                  </small>
                </div>
                {detection?.installed === false && (
                  <button className="secondary-button" onClick={onOpenSettings}>
                    {t("chooseCodexInSettings")}
                  </button>
                )}
              </div>

              <div className="onboarding-trust-grid">
                <span>
                  <RotateCcw size={18} />
                  <strong>{t("safetyPointOne")}</strong>
                </span>
                <span>
                  <PackageCheck size={18} />
                  <strong>{t("safetyPointTwo")}</strong>
                </span>
                <span>
                  <LockKeyhole size={18} />
                  <strong>{t("safetyPointThree")}</strong>
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-stage onboarding-stage--style">
              <div className="onboarding-stage__heading">
                <span>{t("setupStyleStep")}</span>
                <h1 id="onboarding-title">{t("setupStyleTitle")}</h1>
                <p>{t("setupStyleBody")}</p>
              </div>

              <div className="onboarding-setup-grid">
                <div>
                  <div className="onboarding__section-title">
                    {t("startWithTheme")}
                  </div>
                  <div className="onboarding-themes">
                    {builtinThemes.map((theme) => {
                      const preview = theme.metadata.preview
                        ? themeAssetUrl(theme, theme.metadata.preview)
                        : undefined;
                      const localized =
                        theme.locales[locale] ?? theme.locales.en;
                      return (
                        <button
                          key={theme.id}
                          className={
                            "onboarding-theme" +
                            (theme.id === selectedTheme.id
                              ? " onboarding-theme--selected"
                              : "")
                          }
                          onClick={() => onSelectTheme(theme)}
                          aria-pressed={theme.id === selectedTheme.id}
                        >
                          <span
                            className="onboarding-theme__visual"
                            style={{
                              backgroundColor:
                                theme.variants.dark.background.color,
                              backgroundImage: preview
                                ? `url(${preview})`
                                : undefined,
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
                </div>

                <aside className="onboarding-setup-options">
                  <div>
                    <span>{t("themeVariant")}</span>
                    <div
                      className="onboarding-variant"
                      role="group"
                      aria-label={t("themeVariant")}
                    >
                      {(["light", "dark"] as const).map((item) => (
                        <button
                          key={item}
                          className={variant === item ? "is-active" : ""}
                          onClick={() => onSelectVariant(item)}
                          aria-pressed={variant === item}
                        >
                          {t(item)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span>{t("companionOptional")}</span>
                    <button
                      className={
                        !selectedCompanion
                          ? "onboarding-pairing is-active"
                          : "onboarding-pairing"
                      }
                      onClick={() => onSelectCompanion(null)}
                      aria-pressed={!selectedCompanion}
                    >
                      <strong>{t("noCompanion")}</strong>
                      <small>{t("themeOnly")}</small>
                      {!selectedCompanion && <Check size={14} />}
                    </button>
                    {selectedCompanion &&
                      selectedCompanion.id !== recommendedCompanion?.id &&
                      selectedCompanionCopy && (
                        <button
                          className="onboarding-pairing is-active"
                          onClick={() => onSelectCompanion(selectedCompanion)}
                          aria-pressed="true"
                        >
                          <strong>{selectedCompanionCopy.name}</strong>
                          <small>{t("currentSelection")}</small>
                          <Check size={14} />
                        </button>
                      )}
                    {recommendedCompanion && recommendedCopy && (
                      <button
                        className={
                          selectedCompanion?.id === recommendedCompanion.id
                            ? "onboarding-pairing is-active"
                            : "onboarding-pairing"
                        }
                        onClick={() => onSelectCompanion(recommendedCompanion)}
                        aria-pressed={
                          selectedCompanion?.id === recommendedCompanion.id
                        }
                      >
                        <strong>{recommendedCopy.name}</strong>
                        <small>{t("recommendedCompanion")}</small>
                        {selectedCompanion?.id === recommendedCompanion.id && (
                          <Check size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-stage onboarding-stage--review">
              <div className="onboarding-stage__heading">
                <span>{t("setupReviewStep")}</span>
                <h1 id="onboarding-title">
                  {t(
                    isFirstRun
                      ? "setupReviewTitle"
                      : "setupReviewReturningTitle",
                  )}
                </h1>
                <p>
                  {t(
                    isFirstRun ? "setupReviewBody" : "setupReviewReturningBody",
                  )}
                </p>
              </div>
              <div className="onboarding-review">
                <PreviewWorkspace
                  theme={previewTheme}
                  variant={variant}
                  locale={locale}
                  reduceMotion={reduceMotion}
                  resolveAsset={resolveAsset}
                  compact
                />
                <dl>
                  <div>
                    <dt>{t("selectedTheme")}</dt>
                    <dd>{selectedThemeCopy.name}</dd>
                  </div>
                  <div>
                    <dt>{t("themeVariant")}</dt>
                    <dd>{t(variant)}</dd>
                  </div>
                  <div>
                    <dt>{t("companion")}</dt>
                    <dd>{selectedCompanionCopy?.name ?? t("noCompanion")}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        <footer className="onboarding-footer">
          <button
            className="text-button"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={14} />
            {t("previous")}
          </button>
          {step < 2 ? (
            <button
              className="primary-button"
              onClick={() => setStep((value) => Math.min(2, value + 1))}
              disabled={step === 0 && !installationReady}
            >
              {t("continue")}
              <ArrowRight size={14} />
            </button>
          ) : (
            <button className="primary-button" onClick={onApply}>
              {requiresRestart ? <RefreshCw size={14} /> : <Play size={14} />}
              {requiresRestart ? t("restartAndApply") : t("startAndApply")}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
