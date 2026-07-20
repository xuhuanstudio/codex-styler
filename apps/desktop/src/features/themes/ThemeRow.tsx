import {
  Check,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Trash2,
} from "lucide-react";
import {
  defaultCompanionForTheme,
  type ThemeDefinition,
} from "@codex-styler/theme-core";
import { useState } from "react";
import type { Locale, MessageKey } from "../../lib/i18n";

export interface ThemeRowProps {
  theme: ThemeDefinition;
  index: number;
  locale: Locale;
  active: boolean;
  live: boolean;
  resolveAsset: (theme: ThemeDefinition, path: string) => string;
  onSelect: (trigger: HTMLButtonElement) => void;
  local: boolean;
  onEdit: () => void;
  onDelete: () => void;
  t: (key: MessageKey) => string;
}

export function ThemeRow({
  theme,
  index,
  locale,
  active,
  live,
  resolveAsset,
  onSelect,
  local,
  onEdit,
  onDelete,
  t,
}: ThemeRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const localized = theme.locales[locale] ?? theme.locales.en;
  const preview = theme.metadata.preview
    ? resolveAsset(theme, theme.metadata.preview)
    : undefined;
  return (
    <article className={"theme-row" + (active ? " theme-row--active" : "")}>
      <button
        className="theme-row__select"
        onClick={(event) => onSelect(event.currentTarget)}
        aria-label={`${t("preview")}: ${localized.name}`}
        aria-pressed={active}
      />
      <div className="theme-row__preview" aria-hidden="true">
        <span
          style={{
            backgroundColor: theme.variants.dark.background.color,
            backgroundImage: preview ? "url(" + preview + ")" : undefined,
          }}
        />
        <small>{String(index).padStart(2, "0")}</small>
      </div>
      <div className="theme-row__copy">
        <span>{theme.metadata.tags.slice(0, 3).join(" · ").toUpperCase()}</span>
        <h3>{localized.name}</h3>
        <p>{localized.description}</p>
      </div>
      <div className="theme-row__badges">
        {live && (
          <span className="theme-row__live">
            <Check size={12} />
            {t("liveInCodex")}
          </span>
        )}
        {defaultCompanionForTheme(theme.id) && (
          <span>
            <MousePointer2 size={12} />
            {t("interactive")}
          </span>
        )}
        <span>
          {theme.compatibility.codex.mode === "safe" ? "SAFE" : "SEMANTIC"}
        </span>
      </div>
      <div className="theme-row__actions">
        <button
          className="theme-row__more"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`${t("moreActions")}: ${localized.name}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal size={15} />
        </button>
        {menuOpen && (
          <div className="theme-row__menu" role="menu">
            <button
              role="menuitem"
              onClick={() => {
                onEdit();
                setMenuOpen(false);
              }}
            >
              <Palette size={14} />
              {local ? t("editTheme") : t("customizeCopy")}
            </button>
            {local && (
              <button
                role="menuitem"
                className="is-danger"
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
              >
                <Trash2 size={14} />
                {t("deleteTheme")}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
