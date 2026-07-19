import {
  FileSearch,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import type { MessageKey } from "../lib/i18n";
import type {
  ConfigurationAction,
  ConfigurationState,
} from "../lib/configuration-presentation";

interface ConfigurationDockProps {
  themeName: string;
  companionName: string;
  statusLabel: string;
  statusDetail: string;
  actionLabel: string;
  state: ConfigurationState;
  action: ConfigurationAction;
  busy: boolean;
  disabled?: boolean;
  t: (key: MessageKey) => string;
  onAction: () => void;
  onRestore: () => void;
}

export function ConfigurationDock({
  themeName,
  companionName,
  statusLabel,
  statusDetail,
  actionLabel,
  state,
  action,
  busy,
  disabled = busy,
  t,
  onAction,
  onRestore,
}: ConfigurationDockProps) {
  const ActionIcon = busy
    ? LoaderCircle
    : action === "pause"
      ? Pause
      : action === "restart"
        ? RefreshCw
        : action === "settings"
          ? Settings2
          : action === "diagnostics"
            ? FileSearch
            : Play;

  return (
    <section
      className="configuration-dock"
      aria-label={t("currentSetup")}
      aria-busy={busy}
      data-state={state}
    >
      <div className="configuration-dock__identity">
        <span className="configuration-dock__mark" aria-hidden="true">
          <Sparkles size={15} />
        </span>
        <div>
          <span>{t("currentSetup")}</span>
          <strong>{themeName}</strong>
        </div>
      </div>

      <div className="configuration-dock__companion">
        <span>{t("companion")}</span>
        <strong>{companionName}</strong>
      </div>

      <div
        className="configuration-dock__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={`configuration-dock__status-dot configuration-dock__status-dot--${state}`}
          aria-hidden="true"
        />
        <div>
          <strong>{statusLabel}</strong>
          <span>{statusDetail}</span>
        </div>
      </div>

      <div className="configuration-dock__actions">
        <button
          type="button"
          className={
            action === "pause" ||
            action === "settings" ||
            action === "diagnostics"
              ? "secondary-button"
              : "primary-button"
          }
          onClick={onAction}
          disabled={disabled}
        >
          <ActionIcon size={15} className={busy ? "is-spinning" : ""} />
          {busy ? t("applying") : actionLabel}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={onRestore}
          disabled={disabled}
          aria-label={t("restore")}
          title={t("restore")}
        >
          <RotateCcw size={14} />
          <span>{t("restore")}</span>
        </button>
      </div>
    </section>
  );
}
