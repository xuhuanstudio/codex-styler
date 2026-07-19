import type { MessageKey } from "./i18n";
import type { CodexDetection, RuntimeStatus } from "./runtime";
import type { RuntimeStrategy } from "./storage";

export type ConfigurationAction =
  "apply" | "restart" | "pause" | "settings" | "diagnostics";

export type RuntimeFailureKind =
  "windows-store" | "permission" | "connection" | "timeout" | "unknown";

export type ConfigurationState =
  "pending" | "applying" | "applied" | "paused" | "fallback" | "error";

export interface ConfigurationPresentation {
  state: ConfigurationState;
  statusKey: MessageKey;
  detailKey: MessageKey;
  action: ConfigurationAction;
  actionLabelKey: MessageKey;
  topbarKey: MessageKey;
  failureKind: RuntimeFailureKind | null;
}

interface ConfigurationPresentationInput {
  runtime: RuntimeStatus;
  detection: CodexDetection | null;
  runtimeStrategy: RuntimeStrategy;
}

/**
 * Keeps connection, compatibility, and next-action language consistent across
 * the Home screen and the persistent setup bar.
 */
export function configurationPresentation({
  runtime,
  detection,
  runtimeStrategy,
}: ConfigurationPresentationInput): ConfigurationPresentation {
  const needsRestart =
    runtime.state === "restart-required" ||
    (detection?.running === true && !runtime.connected);

  const state: ConfigurationState =
    runtime.state === "error"
      ? "error"
      : runtime.state === "fallback"
        ? "fallback"
        : runtime.state === "paused"
          ? "paused"
          : runtime.state === "applying" || runtime.state === "launching"
            ? "applying"
            : runtime.state === "applied"
              ? "applied"
              : "pending";

  let action: ConfigurationAction =
    state === "applied" || state === "fallback"
      ? "pause"
      : needsRestart
        ? "restart"
        : detection?.installed === false
          ? "settings"
          : "apply";

  let actionLabelKey: MessageKey =
    action === "pause"
      ? "pause"
      : action === "restart"
        ? "restartAndApply"
        : action === "settings"
          ? "reviewCodexLocation"
          : runtime.connected
            ? "applyChanges"
            : "startCodexAndApply";

  let statusKey: MessageKey;
  let detailKey: MessageKey;
  const failureKind =
    state === "error" ? classifyRuntimeFailure(runtime.message) : null;

  if (state === "applying") {
    statusKey = "statusApplyingSetup";
    detailKey = "statusApplyingSetupDetail";
  } else if (state === "applied") {
    statusKey = "statusApplied";
    detailKey = "connected";
  } else if (state === "paused") {
    statusKey = "statusPaused";
    detailKey = "statusPausedDetail";
  } else if (state === "fallback") {
    statusKey = "statusSafeFallback";
    detailKey = "statusSafeFallbackDetail";
  } else if (state === "error") {
    statusKey = "statusCouldNotApply";
    if (failureKind === "windows-store") {
      detailKey = "statusWindowsStoreRecoveryDetail";
      action = "settings";
      actionLabelKey = "reviewCodexLocation";
    } else if (failureKind === "permission") {
      detailKey = "statusPermissionRecoveryDetail";
      action = "apply";
      actionLabelKey = "retryCodexLaunch";
    } else if (failureKind === "connection") {
      detailKey = needsRestart
        ? "statusConnectionRestartDetail"
        : "statusConnectionStartDetail";
      action = needsRestart ? "restart" : "apply";
      actionLabelKey = needsRestart ? "restartAndApply" : "startCodexAndApply";
    } else if (failureKind === "timeout") {
      detailKey = "statusRuntimeTimeoutDetail";
      action = needsRestart ? "restart" : "apply";
      actionLabelKey = needsRestart ? "restartAndApply" : "retryCodexLaunch";
    } else {
      detailKey = "statusUnexpectedRuntimeDetail";
      action = "diagnostics";
      actionLabelKey = "openDiagnostics";
    }
  } else if (detection?.installed === false) {
    statusKey = "statusCodexNotFound";
    detailKey = "statusCodexNotFoundDetail";
  } else if (needsRestart) {
    statusKey = "statusRestartRequired";
    detailKey = "statusRestartRequiredDetail";
  } else if (runtime.connected) {
    statusKey = "statusReadyToApply";
    detailKey = "connected";
  } else {
    statusKey = "statusReadyToStart";
    detailKey = "statusReadyToStartDetail";
  }

  const topbarKey: MessageKey =
    state === "applying"
      ? "compatibilityChecking"
      : state === "fallback"
        ? "safeFallbackActive"
        : runtime.connected && runtimeStrategy === "conservative"
          ? "conservativeModeActive"
          : runtime.connected && runtime.compatibility === "supported"
            ? "compatible"
            : runtime.connected && state === "applied"
              ? "enhancedModeActive"
              : state === "error"
                ? "compatibilityNotVerified"
                : "unknownCompatibility";

  return {
    state,
    statusKey,
    detailKey,
    action,
    actionLabelKey,
    topbarKey,
    failureKind,
  };
}

export function classifyRuntimeFailure(
  detail: string | null | undefined,
): RuntimeFailureKind {
  if (
    /Microsoft Store installation|application identity|activate the Microsoft Store|AppsFolder|AppUserModelId/i.test(
      detail ?? "",
    )
  ) {
    return "windows-store";
  }
  if (/access is denied|拒绝访问|os error 5\b/i.test(detail ?? "")) {
    return "permission";
  }
  if (
    /debugging socket|connection refused|os error 61\b|websocket.*(?:closed|connect)|target closed|not connected|connection is no longer available|probe timed out/i.test(
      detail ?? "",
    )
  ) {
    return "connection";
  }
  if (/trusted page target|connection timeout|timed out/i.test(detail ?? "")) {
    return "timeout";
  }
  return "unknown";
}

export function runtimeFailureMessageKey(
  detail: string | null | undefined,
): MessageKey {
  const failure = classifyRuntimeFailure(detail);
  return failure === "windows-store"
    ? "windowsStoreLaunchFailed"
    : failure === "permission"
      ? "windowsLaunchPermissionFailed"
      : failure === "connection"
        ? "runtimeConnectionLost"
        : failure === "timeout"
          ? "runtimeTargetTimeout"
          : "runtimeUnexpectedFailure";
}
