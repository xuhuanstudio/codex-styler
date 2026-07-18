import { ChevronRight, FolderOpen, Plus, Upload } from "lucide-react";
import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import { PreviewWorkspace } from "../../components/PreviewWorkspace";
import type { ThemeVariantName } from "../../lib/app-session";
import type { Locale, MessageKey } from "../../lib/i18n";
import { ThemeRow } from "./ThemeRow";

export type ThemeCollection = "builtIn" | "mine";

export interface ThemesViewProps {
  locale: Locale;
  selectedTheme: ThemeDefinition;
  previewTheme: ThemeDefinition;
  localThemes: ThemeDefinition[];
  collection: ThemeCollection;
  variant: ThemeVariantName;
  reduceMotion: boolean;
  t: (key: MessageKey) => string;
  onSelect: (theme: ThemeDefinition) => void;
  onEdit: (theme: ThemeDefinition) => void;
  onDelete: (theme: ThemeDefinition) => void;
  onCollectionChange: (collection: ThemeCollection) => void;
  onNew: () => void;
  onImport: () => void;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  liveThemeId: string | null;
  isLive: boolean;
  busy: boolean;
}

export function ThemesView({
  locale,
  selectedTheme,
  previewTheme,
  localThemes,
  collection,
  variant,
  reduceMotion,
  t,
  onSelect,
  onEdit,
  onDelete,
  onCollectionChange,
  onNew,
  onImport,
  resolveAsset,
  liveThemeId,
  isLive,
  busy,
}: ThemesViewProps) {
  const themes = collection === "builtIn" ? builtinThemes : localThemes;
  const localized = selectedTheme.locales[locale] ?? selectedTheme.locales.en;
  const selectedIndex =
    themes.findIndex((theme) => theme.id === selectedTheme.id) + 1;
  const performance =
    previewTheme.scene.entities.length > 0 ||
    Object.values(previewTheme.variants).some((item) =>
      Boolean(item.background.image),
    ) ||
    previewTheme.scene.layers.some((layer) => Math.abs(layer.parallax) > 0)
      ? t("medium")
      : t("low");
  const selectedThemeIsLive = liveThemeId === selectedTheme.id;
  return (
    <div className="page page--themes">
      <section className="page-heading">
        <div>
          <span className="page-kicker">VISUAL SYSTEM LIBRARY</span>
          <h1>{t("themeLibrary")}</h1>
          <p>{t("themeLibraryDetail")}</p>
        </div>
        <div className="page-heading__actions">
          <button className="secondary-button" onClick={onImport}>
            <Upload size={14} />
            {t("importTheme")}
          </button>
          <button className="primary-button" onClick={onNew}>
            <Plus size={14} />
            {t("newTheme")}
          </button>
        </div>
      </section>

      <div
        className="theme-collection-tabs"
        role="tablist"
        aria-label={t("themes")}
      >
        <button
          role="tab"
          aria-selected={collection === "builtIn"}
          className={collection === "builtIn" ? "is-active" : ""}
          onClick={() => onCollectionChange("builtIn")}
        >
          {t("builtInThemes")}
          <small>{builtinThemes.length}</small>
        </button>
        <button
          role="tab"
          aria-selected={collection === "mine"}
          className={collection === "mine" ? "is-active" : ""}
          onClick={() => onCollectionChange("mine")}
        >
          {t("myThemes")}
          <small>{localThemes.length}</small>
        </button>
      </div>

      {themes.length === 0 ? (
        <section className="empty-state theme-empty-state">
          <span className="empty-state__icon">
            <FolderOpen size={25} />
          </span>
          <h2>{t("noLocalThemesTitle")}</h2>
          <p>{t("noLocalThemes")}</p>
          <div className="button-row">
            <button className="primary-button" onClick={onNew}>
              <Plus size={14} /> {t("newTheme")}
            </button>
            <button className="secondary-button" onClick={onImport}>
              <Upload size={14} /> {t("importTheme")}
            </button>
          </div>
        </section>
      ) : (
        <section className="theme-library-workspace">
          <div className="theme-library-master">
            <div className="section-heading section-heading--compact">
              <div>
                <span>THEME INDEX</span>
                <h2>
                  {collection === "builtIn"
                    ? t("builtInThemes")
                    : t("myThemes")}
                </h2>
              </div>
              <span className="section-count">
                {themes.length} {t("themesCount")}
              </span>
            </div>
            <div className="theme-list" aria-label={t("allThemes")}>
              {themes.map((theme, index) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  index={index + 1}
                  locale={locale}
                  active={selectedTheme.id === theme.id}
                  live={liveThemeId === theme.id}
                  resolveAsset={resolveAsset}
                  onSelect={() => onSelect(theme)}
                  local={collection === "mine"}
                  onEdit={() => onEdit(theme)}
                  onDelete={() => onDelete(theme)}
                  t={t}
                />
              ))}
            </div>
          </div>
          <section className="featured-theme theme-detail-card">
            <div className="featured-theme__preview">
              <div className="featured-theme__label">
                {busy
                  ? t("applying")
                  : selectedThemeIsLive
                    ? t("liveInCodex")
                    : t("previewOnly")}
              </div>
              <PreviewWorkspace
                theme={previewTheme}
                variant={variant}
                locale={locale}
                reduceMotion={reduceMotion}
                resolveAsset={resolveAsset}
              />
            </div>
            <div className="featured-theme__copy">
              <span>
                THEME {String(Math.max(1, selectedIndex)).padStart(2, "0")} /{" "}
                {localized.name.toUpperCase()}
              </span>
              <h2>{localized.name}</h2>
              <p>{localized.description}</p>
              <div className="theme-facts">
                <div>
                  <small>{t("performance")}</small>
                  <strong>{performance}</strong>
                </div>
                <div>
                  <small>{t("interactive")}</small>
                  <strong>
                    {previewTheme.scene.entities.length ? "Pointer" : "—"}
                  </strong>
                </div>
              </div>
              <div
                className={
                  "configuration-state" +
                  (selectedThemeIsLive ? " configuration-state--live" : "")
                }
              >
                <span />
                {busy
                  ? t("applying")
                  : selectedThemeIsLive
                    ? t("liveInCodex")
                    : isLive
                      ? t("changesApplyInstantly")
                      : t("changesReadyToApply")}
              </div>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => onEdit(selectedTheme)}
                >
                  {collection === "builtIn"
                    ? t("customizeCopy")
                    : t("editTheme")}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
