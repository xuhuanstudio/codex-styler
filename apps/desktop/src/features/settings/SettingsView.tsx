import {
  ChevronRight,
  FolderOpen,
  Languages,
  LockKeyhole,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import type { ReactNode } from "react";
import { SelectField } from "../../components/ui/SelectField";
import type { LocalePreference, MessageKey } from "../../lib/i18n";
import type { CodexDetection } from "../../lib/runtime";
import type {
  ManagerAppearance,
  RuntimeStrategy,
  UserSettings,
} from "../../lib/storage";

type UpdateStatus = "idle" | "checking" | "current" | "error";

export interface SettingsViewProps {
  settings: UserSettings;
  detection: CodexDetection | null;
  currentVersion: string;
  updateStatus: UpdateStatus;
  t: (key: MessageKey) => string;
  onChange: (patch: Partial<UserSettings>) => void;
  installPathBusy: boolean;
  onChooseCodexInstall: () => void;
  onUseAutomaticCodexInstall: () => void;
  onCheckForUpdates: () => void;
  diagnosticsBusy: boolean;
  onRunDiagnostics: () => void;
  onOpenOnboarding: () => void;
}

export function SettingsView({
  settings,
  detection,
  currentVersion,
  updateStatus,
  t,
  onChange,
  installPathBusy,
  onChooseCodexInstall,
  onUseAutomaticCodexInstall,
  onCheckForUpdates,
  diagnosticsBusy,
  onRunDiagnostics,
  onOpenOnboarding,
}: SettingsViewProps) {
  const lastChecked = formatLastChecked(settings.lastUpdateCheckAt, t);

  return (
    <div className="page settings-page">
      <section className="page-heading">
        <div>
          <span className="page-kicker">LOCAL PREFERENCES</span>
          <h1>{t("settings")}</h1>
          <p>{t("privacyBody")}</p>
        </div>
      </section>
      <div className="settings-layout settings-layout--continuous">
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <Languages size={17} />
            <div>
              <h2>{t("language")}</h2>
              <p>{t("languageDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <SelectField
              value={settings.locale}
              onChange={(event) =>
                onChange({ locale: event.target.value as LocalePreference })
              }
            >
              <option value="system">{t("systemLanguage")}</option>
              <option value="en">English</option>
              <option value="zh-CN">简体中文</option>
            </SelectField>
          </div>
        </section>
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <Palette size={17} />
            <div>
              <h2>{t("managerAppearance")}</h2>
              <p>{t("managerAppearanceDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <SegmentedControl
              value={settings.appearance}
              options={[
                {
                  value: "system",
                  label: t("system"),
                  icon: <Monitor size={13} />,
                },
                {
                  value: "light",
                  label: t("light"),
                  icon: <Sun size={13} />,
                },
                { value: "dark", label: t("dark"), icon: <Moon size={13} /> },
              ]}
              onChange={(value) =>
                onChange({ appearance: value as ManagerAppearance })
              }
            />
          </div>
        </section>
        <section className="settings-group settings-group--split">
          <div className="settings-group__title">
            <ShieldCheck size={17} />
            <div>
              <h2>{t("runtimeStrategy")}</h2>
              <p>{t("runtimeStrategyDescription")}</p>
            </div>
          </div>
          <div className="settings-group__control">
            <SelectField
              value={settings.runtimeStrategy}
              onChange={(event) =>
                onChange({
                  runtimeStrategy: event.target.value as RuntimeStrategy,
                })
              }
            >
              <option value="enhanced">{t("automaticMode")}</option>
              <option value="conservative">{t("compatibilityMode")}</option>
            </SelectField>
            <p className="settings-mode-note">
              {settings.runtimeStrategy === "enhanced"
                ? t("automaticModeDescription")
                : t("compatibilityModeDescription")}
            </p>
          </div>
        </section>

        <section className="settings-group codex-location-setting">
          <div className="settings-group__title">
            <FolderOpen size={17} />
            <div>
              <h2>{t("codexLocation")}</h2>
              <p>{t("codexLocationDescription")}</p>
            </div>
          </div>
          <div className="codex-location-control">
            <div className="codex-location-path">
              <small>
                {settings.codexInstallPath
                  ? t("customLocation")
                  : t("detectedAutomatically")}
              </small>
              <strong title={detection?.path ?? undefined}>
                {detection?.path ?? t("codexNotDetected")}
              </strong>
            </div>
            <div className="button-row">
              {settings.codexInstallPath && (
                <button
                  className="text-button"
                  onClick={onUseAutomaticCodexInstall}
                  disabled={installPathBusy}
                >
                  {t("useAutomaticDetection")}
                </button>
              )}
              <button
                className="secondary-button"
                onClick={onChooseCodexInstall}
                disabled={installPathBusy}
              >
                <FolderOpen size={14} />
                {installPathBusy ? t("checking") : t("chooseApplication")}
              </button>
            </div>
          </div>
        </section>

        <SettingToggle
          icon={<Sparkles size={17} />}
          title={t("reduceMotion")}
          description={t("reduceMotionDescription")}
          checked={settings.reduceMotion}
          onChange={(checked) => onChange({ reduceMotion: checked })}
        />

        <SettingToggle
          icon={<RefreshCw size={17} />}
          title={t("automaticUpdateChecks")}
          description={t("automaticUpdateChecksDescription")}
          checked={settings.automaticUpdateChecks}
          onChange={(checked) => onChange({ automaticUpdateChecks: checked })}
        />

        <section className="settings-group settings-group--row update-settings-row">
          <div className="update-settings-row__version">
            <small>{t("currentVersion")}</small>
            <strong>Codex Styler {currentVersion}</strong>
            <span>
              {t("lastChecked")}: {lastChecked}
            </span>
          </div>
          <button
            className="secondary-button"
            onClick={onCheckForUpdates}
            disabled={updateStatus === "checking"}
          >
            <RefreshCw
              size={14}
              className={updateStatus === "checking" ? "is-spinning" : ""}
            />
            {updateStatus === "checking"
              ? t("checkingForUpdates")
              : t("checkForUpdates")}
          </button>
        </section>
        <section className="settings-group settings-group--row diagnostics-settings-row">
          <div className="settings-group__title">
            <ShieldCheck size={17} />
            <div>
              <h2>{t("diagnosticsTitle")}</h2>
              <p>{t("diagnosticsDescription")}</p>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={onRunDiagnostics}
            disabled={diagnosticsBusy}
          >
            <RefreshCw
              size={14}
              className={diagnosticsBusy ? "is-spinning" : ""}
            />
            {diagnosticsBusy ? t("runningDiagnostics") : t("runDiagnostics")}
          </button>
        </section>

        <section className="trust-grid">
          <article>
            <LockKeyhole size={20} />
            <h3>{t("privacyTitle")}</h3>
            <p>{t("privacyBody")}</p>
          </article>
          <article>
            <ShieldCheck size={20} />
            <h3>{t("compatibilityTitle")}</h3>
            <p>{t("compatibilityBody")}</p>
          </article>
        </section>
        <button className="text-button" onClick={onOpenOnboarding}>
          {t("openOnboarding")}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function formatLastChecked(
  lastUpdateCheckAt: string | null,
  t: SettingsViewProps["t"],
): string {
  if (!lastUpdateCheckAt) return t("neverChecked");
  const date = new Date(lastUpdateCheckAt);
  if (Number.isNaN(date.getTime())) return t("neverChecked");
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented-control">
      {options.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SettingToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <section className="settings-group settings-group--row">
      <div className="settings-group__title">
        {icon}
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <button
        className={"toggle" + (checked ? " toggle--on" : "")}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={title}
      >
        <span />
      </button>
    </section>
  );
}
