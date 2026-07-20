import { useEffect, useRef, useState } from "react";
import { FolderOpen, Plus, Search, Upload } from "lucide-react";
import { builtinThemes, type ThemeDefinition } from "@codex-styler/theme-core";
import { ResourceLibraryToolbar } from "../../components/ui/ResourceLibraryToolbar";
import type { ThemeVariantName } from "../../lib/app-session";
import type { Locale, MessageKey } from "../../lib/i18n";
import { matchesResourceSearch } from "../../lib/resource-search";
import { useCompactDetailFlow } from "../../lib/use-compact-detail-flow";
import { ThemeDetailCard } from "./ThemeDetailCard";
import { ThemeRow } from "./ThemeRow";

export type ThemeCollection = "builtIn" | "mine";

export interface ThemesViewProps {
  locale: Locale;
  selectedTheme: ThemeDefinition;
  previewThemeFor: (theme: ThemeDefinition) => ThemeDefinition;
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
  busy: boolean;
}

export function ThemesView({
  locale,
  selectedTheme,
  previewThemeFor,
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
}: ThemesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [browsedThemeId, setBrowsedThemeId] = useState(selectedTheme.id);
  const themeListRef = useRef<HTMLDivElement>(null);
  const {
    closeDetail,
    containerRef: workspaceRef,
    detailOpen: compactDetailOpen,
    onKeyDown: onWorkspaceKeyDown,
    openDetail,
  } = useCompactDetailFlow<HTMLElement>(reduceMotion);
  const themes = collection === "builtIn" ? builtinThemes : localThemes;
  const filteredThemes = themes.filter((theme) => {
    const localizedTheme = theme.locales[locale] ?? theme.locales.en;
    return matchesResourceSearch(searchQuery, [
      localizedTheme.name,
      localizedTheme.description,
      theme.metadata.author,
      ...theme.metadata.tags,
    ]);
  });
  const selectedThemeInCollection = themes.find(
    (theme) => theme.id === selectedTheme.id,
  );
  const browsedTheme =
    filteredThemes.find((theme) => theme.id === browsedThemeId) ??
    filteredThemes[0] ??
    selectedThemeInCollection ??
    selectedTheme;
  useEffect(() => {
    setBrowsedThemeId((current) => {
      if (themes.some((theme) => theme.id === current)) return current;
      return selectedThemeInCollection?.id ?? themes[0]?.id ?? selectedTheme.id;
    });
  }, [selectedTheme.id, selectedThemeInCollection?.id, themes]);
  useEffect(() => {
    const active = themeListRef.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    );
    active?.scrollIntoView?.({ block: "nearest" });
  }, [collection, filteredThemes.length, searchQuery, selectedTheme.id]);
  const selectedIndex =
    themes.findIndex((theme) => theme.id === browsedTheme.id) + 1;
  return (
    <div className="page page--themes">
      <section className="page-heading">
        <div>
          <span className="page-kicker">{t("themeLibraryKicker")}</span>
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

      <ResourceLibraryToolbar
        ariaLabel={t("themes")}
        tabs={[
          {
            id: "builtIn",
            label: t("builtInThemes"),
            count: builtinThemes.length,
          },
          {
            id: "mine",
            label: t("myThemes"),
            count: localThemes.length,
          },
        ]}
        activeTab={collection}
        onTabChange={(nextCollection) => {
          setSearchQuery("");
          closeDetail({ restoreFocus: false });
          onCollectionChange(nextCollection);
        }}
        search={
          themes.length > 0
            ? {
                value: searchQuery,
                label: t("searchThemes"),
                placeholder: t("searchThemes"),
                clearLabel: t("clearSearch"),
                resultCount: filteredThemes.length,
                totalCount: themes.length,
                onChange: setSearchQuery,
              }
            : undefined
        }
      />

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
        <section
          ref={workspaceRef}
          onKeyDown={onWorkspaceKeyDown}
          className={
            "theme-library-workspace" +
            (compactDetailOpen ? " theme-library-workspace--detail" : "")
          }
        >
          <div className="theme-library-master">
            <div className="section-heading section-heading--compact">
              <div>
                <span>{t("themeIndexKicker")}</span>
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
            <div
              ref={themeListRef}
              className="theme-list"
              aria-label={t("allThemes")}
              data-scroll-surface="panel"
            >
              {filteredThemes.length === 0 && (
                <div className="library-filter-empty" role="status">
                  <Search size={20} aria-hidden="true" />
                  <strong>{t("noThemeMatches")}</strong>
                  <span>{t("searchAgainDetail")}</span>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    {t("clearSearch")}
                  </button>
                </div>
              )}
              {filteredThemes.map((theme) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  index={themes.findIndex((item) => item.id === theme.id) + 1}
                  locale={locale}
                  active={selectedTheme.id === theme.id}
                  live={liveThemeId === theme.id}
                  resolveAsset={resolveAsset}
                  onSelect={(trigger) => {
                    setBrowsedThemeId(theme.id);
                    onSelect(theme);
                    openDetail(trigger);
                  }}
                  local={collection === "mine"}
                  onEdit={() => onEdit(theme)}
                  onDelete={() => onDelete(theme)}
                  t={t}
                />
              ))}
            </div>
          </div>
          <ThemeDetailCard
            theme={browsedTheme}
            previewTheme={previewThemeFor(browsedTheme)}
            themeIndex={selectedIndex}
            collectionLabel={
              collection === "builtIn" ? t("builtInThemes") : t("myThemes")
            }
            editLabel={
              collection === "builtIn" ? t("customizeCopy") : t("editTheme")
            }
            locale={locale}
            variant={variant}
            reduceMotion={reduceMotion}
            t={t}
            resolveAsset={resolveAsset}
            onBack={() => closeDetail()}
            onEdit={() => onEdit(browsedTheme)}
          />
        </section>
      )}
    </div>
  );
}
