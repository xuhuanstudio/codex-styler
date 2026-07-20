import type {
  CompanionDefinition,
  ThemeDefinition,
} from "@codex-styler/theme-core";
import {
  ChevronRight,
  Download,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { CompanionCreatorProject } from "../companion-creator/model";
import {
  diagnosticsSummary,
  exportDiagnostics,
  openWindowsCompatibilityIssue,
  type DiagnosticsReport,
} from "../../lib/diagnostics";
import type { Locale, MessageKey } from "../../lib/i18n";
import type { AvailableUpdate } from "../../lib/runtime";

type Translate = (key: MessageKey) => string;

export function DeleteThemeDialog({
  theme,
  locale,
  t,
  onCancel,
  onDelete,
}: {
  theme: ThemeDefinition;
  locale: Locale;
  t: Translate;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-theme-title"
      >
        <span className="confirm-dialog__icon">
          <Trash2 size={18} />
        </span>
        <h2 id="delete-theme-title">{t("deleteThemeTitle")}</h2>
        <p>{t("deleteThemeBody")}</p>
        <strong>{theme.locales[locale]?.name ?? theme.metadata.name}</strong>
        <div className="button-row">
          <button className="secondary-button" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button className="danger-button" onClick={onDelete}>
            <Trash2 size={14} />
            {t("deleteTheme")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function UnsavedThemeDialog({
  theme,
  locale,
  t,
  busy,
  onCancel,
  onDiscard,
  onSave,
}: {
  theme: ThemeDefinition;
  locale: Locale;
  t: Translate;
  busy: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog confirm-dialog--unsaved"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-theme-title"
        aria-describedby="unsaved-theme-description"
      >
        <span className="confirm-dialog__icon confirm-dialog__icon--draft">
          <Save size={18} />
        </span>
        <h2 id="unsaved-theme-title">{t("unsavedThemeTitle")}</h2>
        <p id="unsaved-theme-description">{t("unsavedThemeBody")}</p>
        <strong>{theme.locales[locale]?.name ?? theme.metadata.name}</strong>
        <div className="button-row button-row--unsaved">
          <button
            className="secondary-button"
            onClick={onCancel}
            disabled={busy}
            autoFocus
          >
            {t("keepEditing")}
          </button>
          <button
            className="danger-button danger-button--quiet"
            onClick={onDiscard}
            disabled={busy}
          >
            {t("discardChanges")}
          </button>
          <button className="primary-button" onClick={onSave} disabled={busy}>
            <Save size={14} />
            {busy ? t("saving") : t("saveAndLeave")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DeleteCompanionDialog({
  companion,
  locale,
  t,
  onCancel,
  onDelete,
}: {
  companion: CompanionDefinition;
  locale: Locale;
  t: Translate;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-companion-title"
      >
        <span className="confirm-dialog__icon">
          <Trash2 size={18} />
        </span>
        <h2 id="delete-companion-title">{t("deleteCompanionTitle")}</h2>
        <p>{t("deleteCompanionBody")}</p>
        <strong>{companion.locales[locale]?.name ?? companion.name}</strong>
        <div className="button-row">
          <button className="secondary-button" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button className="danger-button" onClick={onDelete}>
            <Trash2 size={14} />
            {t("deleteCompanion")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DeleteCompanionProjectDialog({
  project,
  t,
  onCancel,
  onDelete,
}: {
  project: CompanionCreatorProject;
  t: Translate;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-companion-project-title"
      >
        <span className="confirm-dialog__icon">
          <Trash2 size={18} />
        </span>
        <h2 id="delete-companion-project-title">{t("deleteDraftTitle")}</h2>
        <p>{t("deleteDraftBody")}</p>
        <strong>{project.name}</strong>
        <div className="button-row">
          <button className="secondary-button" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button className="danger-button" onClick={onDelete}>
            <Trash2 size={14} />
            {t("deleteDraft")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function RestartCodexDialog({
  t,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  t: Translate;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog confirm-dialog--restart"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-codex-title"
      >
        <span className="confirm-dialog__icon">
          <RefreshCw size={18} />
        </span>
        <h2 id="restart-codex-title">{t("quitCodexTitle")}</h2>
        <p>{t("quitCodexBody")}</p>
        {error && (
          <p className="confirm-dialog__error" role="alert">
            {t("restartFailedDetail")}: {error}
          </p>
        )}
        <div className="button-row">
          <button
            className="secondary-button"
            onClick={onCancel}
            disabled={busy}
          >
            {t("cancel")}
          </button>
          <button
            className="primary-button"
            onClick={onConfirm}
            disabled={busy}
          >
            <RefreshCw size={14} className={busy ? "is-spinning" : ""} />
            {busy
              ? t("restartingCodex")
              : error
                ? t("retryRestart")
                : t("quitAndContinue")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function DiagnosticsDialog({
  report,
  t,
  onClose,
}: {
  report: DiagnosticsReport;
  t: Translate;
  onClose: () => void;
}) {
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="diagnostics-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnostics-title"
        data-scroll-surface="panel"
      >
        <header>
          <span className="confirm-dialog__icon">
            <ShieldCheck size={18} />
          </span>
          <div>
            <span className="page-kicker">LOCAL REDACTED REPORT</span>
            <h2 id="diagnostics-title">{t("diagnosticsTitle")}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={t("cancel")}
          >
            <X size={15} />
          </button>
        </header>
        <p>{t("diagnosticsPrivacy")}</p>
        <div className="diagnostics-checks">
          {report.checks.map((check) => (
            <div key={check.id} data-status={check.status}>
              <span>{check.status}</span>
              <strong>{check.id}</strong>
              <small>{check.detail}</small>
            </div>
          ))}
        </div>
        <details>
          <summary>{t("previewDiagnosticText")}</summary>
          <pre data-scroll-surface="canvas">{diagnosticsSummary(report)}</pre>
        </details>
        <div className="button-row">
          <button
            className="secondary-button"
            onClick={openWindowsCompatibilityIssue}
          >
            <ChevronRight size={14} />
            {t("openCompatibilityIssue")}
          </button>
          <button
            className="primary-button"
            onClick={() => void exportDiagnostics(report)}
          >
            <Download size={14} />
            {t("exportDiagnostics")}
          </button>
        </div>
      </section>
    </div>
  );
}

export type UpdateInstallStatus =
  "idle" | "downloading" | "installing" | "restarting";

export function UpdateDialog({
  update,
  installStatus,
  progress,
  t,
  onSkip,
  onLater,
  onInstall,
}: {
  update: AvailableUpdate;
  installStatus: UpdateInstallStatus;
  progress: number | null;
  t: Translate;
  onSkip: () => void;
  onLater: () => void;
  onInstall: () => void;
}) {
  const isIdle = installStatus === "idle";
  return (
    <div className="confirm-backdrop" role="presentation">
      <section
        className="confirm-dialog update-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
      >
        <span className="confirm-dialog__icon update-dialog__icon">
          <Download size={18} />
        </span>
        <div className="update-dialog__heading">
          <span>{t("updateAvailable")}</span>
          <h2 id="update-dialog-title">Codex Styler {update.version}</h2>
          {update.prerelease && <small>{t("prerelease")}</small>}
        </div>
        <p>{t("updateAvailableBody")}</p>
        {update.releaseNotes ? (
          <div className="update-dialog__notes" data-scroll-surface="panel">
            <strong>{t("releaseNotes")}</strong>
            <p className="update-dialog__summary">
              {update.releaseNotes.summary}
            </p>
            {update.releaseNotes.highlights.length > 0 && (
              <section>
                <h3>{t("releaseHighlights")}</h3>
                <ul>
                  {update.releaseNotes.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            {update.releaseNotes.fixes.length > 0 && (
              <section>
                <h3>{t("releaseFixes")}</h3>
                <ul>
                  {update.releaseNotes.fixes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : update.notes ? (
          <div className="update-dialog__notes" data-scroll-surface="panel">
            <strong>{t("releaseNotes")}</strong>
            <p>{update.notes}</p>
          </div>
        ) : null}
        {!isIdle && (
          <div className="update-dialog__progress" aria-live="polite">
            <div>
              <span>
                {installStatus === "downloading"
                  ? t("downloadingUpdate")
                  : installStatus === "installing"
                    ? t("installingUpdate")
                    : t("restartingAfterUpdate")}
              </span>
              {progress !== null && installStatus === "downloading" && (
                <strong>{progress}%</strong>
              )}
            </div>
            <span className="update-dialog__progress-track">
              <span
                style={{ width: progress === null ? "34%" : `${progress}%` }}
              />
            </span>
          </div>
        )}
        <div className="update-dialog__secondary-actions">
          <button className="text-button" disabled={!isIdle} onClick={onSkip}>
            {t("skipThisVersion")}
          </button>
          <button
            className="secondary-button"
            disabled={!isIdle}
            onClick={onLater}
          >
            {t("remindMeLater")}
          </button>
          <button
            className="primary-button"
            disabled={!isIdle}
            onClick={onInstall}
          >
            <Download size={14} />
            {t("downloadAndInstall")}
          </button>
        </div>
      </section>
    </div>
  );
}
