import { ChevronRight, Image, Palette, PawPrint } from "lucide-react";
import type {
  CompanionDefinition,
  ThemeDefinition,
} from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { ThemeVariantName } from "../../lib/app-session";
import type { RuntimeStatus } from "../../lib/runtime";
import type { RuntimeStrategy } from "../../lib/storage";

export interface HomeViewProps {
  locale: Locale;
  theme: ThemeDefinition;
  sourceTheme: ThemeDefinition;
  companion: CompanionDefinition | null;
  runtime: RuntimeStatus;
  runtimeStrategy: RuntimeStrategy;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  t: (key: MessageKey) => string;
  onEdit: () => void;
  onBrowse: () => void;
  onCreateFromImage: () => void;
  onCompanions: () => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
}

export function HomeView({
  locale,
  theme,
  sourceTheme,
  companion,
  runtime,
  runtimeStrategy,
  variant,
  reduceMotion,
  t,
  onEdit,
  onBrowse,
  onCreateFromImage,
  onCompanions,
  resolveAsset,
}: HomeViewProps) {
  const copy = sourceTheme.locales[locale] ?? sourceTheme.locales.en;
  const companionCopy = companion
    ? (companion.locales[locale] ?? companion.locales.en)
    : null;
  const setupIsLive =
    runtime.connected &&
    (runtime.state === "applied" || runtime.state === "fallback");
  return (
    <div className="page home-page">
      <section className="page-heading home-heading">
        <div>
          <span className="page-kicker">WORKSPACE CONTROL</span>
          <h1>{t("homeTitle")}</h1>
          <p>{t("homeDescription")}</p>
        </div>
        <div className="home-heading__status">
          <span className={setupIsLive ? "is-live" : ""} />
          <div>
            <small>{t("codexAppearance")}</small>
            <strong>
              {runtime.state === "fallback"
                ? t("statusFallback")
                : setupIsLive
                  ? t("themeActive")
                  : runtime.state === "error"
                    ? t("statusError")
                    : runtime.state === "paused"
                      ? t("statusPaused")
                      : t("ready")}
            </strong>
          </div>
        </div>
      </section>

      <section className="home-current">
        <div className="home-current__preview">
          <span className="home-current__label">
            {setupIsLive ? t("liveSetup") : t("selectedSetup")}
          </span>
          <PreviewWorkspace
            theme={theme}
            variant={variant}
            locale={locale}
            reduceMotion={reduceMotion}
            resolveAsset={resolveAsset}
          />
        </div>
        <div className="home-current__content">
          <span className="home-current__eyebrow">
            {setupIsLive ? t("liveInCodex") : t("readyToApply")}
          </span>
          <h2>{copy.name}</h2>
          <p>{copy.description}</p>
          <dl className="home-current__facts">
            <div>
              <dt>{t("companion")}</dt>
              <dd>{companionCopy?.name ?? t("noCompanion")}</dd>
            </div>
            <div>
              <dt>{t("runtimeStrategy")}</dt>
              <dd>
                {runtimeStrategy === "enhanced"
                  ? t("automaticMode")
                  : t("compatibilityMode")}
              </dd>
            </div>
          </dl>
          <div className="button-row">
            <button className="secondary-button" onClick={onEdit}>
              {t("editTheme")}
              <ChevronRight size={15} />
            </button>
          </div>
          <div
            className={
              "configuration-state" +
              (setupIsLive ? " configuration-state--live" : "")
            }
          >
            <span />
            {setupIsLive
              ? t("changesApplyInstantly")
              : t("changesReadyToApply")}
          </div>
        </div>
      </section>

      <section className="home-actions" aria-label={t("quickActions")}>
        <button onClick={onBrowse}>
          <span>
            <Palette size={18} />
          </span>
          <strong>{t("browseThemes")}</strong>
          <small>{t("browseThemesDetail")}</small>
          <ChevronRight size={15} />
        </button>
        <button onClick={onCreateFromImage}>
          <span>
            <Image size={18} />
          </span>
          <strong>{t("createFromImage")}</strong>
          <small>{t("createFromImageDetail")}</small>
          <ChevronRight size={15} />
        </button>
        <button onClick={onCompanions}>
          <span>
            <PawPrint size={18} />
          </span>
          <strong>{t("chooseCompanion")}</strong>
          <small>{t("chooseCompanionDetail")}</small>
          <ChevronRight size={15} />
        </button>
      </section>
    </div>
  );
}
