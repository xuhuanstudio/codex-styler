import { describe, expect, it } from "vitest";
import {
  classifyRuntimeFailure,
  configurationPresentation,
  runtimeFailureMessageKey,
} from "./configuration-presentation";
import type { CodexDetection, RuntimeStatus } from "./runtime";

const detection: CodexDetection = {
  installed: true,
  running: false,
  path: "/Applications/Codex.app",
  version: "test",
  platform: "macos",
};

const runtime: RuntimeStatus = {
  state: "disconnected",
  connected: false,
  startedByStyler: false,
  port: null,
  codexVersion: null,
  compatibility: "safe",
  message: null,
  revision: 0,
};

describe("configurationPresentation", () => {
  it("turns a disconnected install into one clear start action", () => {
    expect(
      configurationPresentation({
        runtime,
        detection,
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      state: "pending",
      statusKey: "statusReadyToStart",
      detailKey: "statusReadyToStartDetail",
      action: "apply",
      actionLabelKey: "startCodexAndApply",
      topbarKey: "unknownCompatibility",
    });
  });

  it("explains that a running unconnected Codex must restart", () => {
    expect(
      configurationPresentation({
        runtime,
        detection: { ...detection, running: true },
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      statusKey: "statusRestartRequired",
      detailKey: "statusRestartRequiredDetail",
      action: "restart",
      actionLabelKey: "restartAndApply",
    });
  });

  it("routes a missing installation to location settings", () => {
    expect(
      configurationPresentation({
        runtime,
        detection: { ...detection, installed: false, path: null },
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      statusKey: "statusCodexNotFound",
      action: "settings",
      actionLabelKey: "reviewCodexLocation",
    });
  });

  it("does not describe an enhanced applied session as conservative", () => {
    expect(
      configurationPresentation({
        runtime: {
          ...runtime,
          state: "applied",
          connected: true,
          compatibility: "safe",
        },
        detection,
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      state: "applied",
      statusKey: "statusApplied",
      action: "pause",
      topbarKey: "enhancedModeActive",
    });
  });

  it("keeps a real fallback distinct from the selected strategy", () => {
    expect(
      configurationPresentation({
        runtime: {
          ...runtime,
          state: "fallback",
          connected: true,
        },
        detection,
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      state: "fallback",
      statusKey: "statusSafeFallback",
      detailKey: "statusSafeFallbackDetail",
      topbarKey: "safeFallbackActive",
    });
  });

  it("offers recovery language without hiding whether Codex is connected", () => {
    const disconnected = configurationPresentation({
      runtime: { ...runtime, state: "error" },
      detection,
      runtimeStrategy: "enhanced",
    });
    const connected = configurationPresentation({
      runtime: { ...runtime, state: "error", connected: true },
      detection,
      runtimeStrategy: "enhanced",
    });

    expect(disconnected.detailKey).toBe("statusUnexpectedRuntimeDetail");
    expect(disconnected.action).toBe("diagnostics");
    expect(connected.detailKey).toBe("statusUnexpectedRuntimeDetail");
  });

  it("routes a Microsoft Store identity failure to the Codex location fallback", () => {
    expect(
      configurationPresentation({
        runtime: {
          ...runtime,
          state: "error",
          message:
            "The Microsoft Store installation could not be resolved to an application identity",
        },
        detection,
        runtimeStrategy: "enhanced",
      }),
    ).toMatchObject({
      failureKind: "windows-store",
      detailKey: "statusWindowsStoreRecoveryDetail",
      action: "settings",
      actionLabelKey: "reviewCodexLocation",
    });
  });

  it("keeps permission and connection failures actionable", () => {
    const permission = configurationPresentation({
      runtime: {
        ...runtime,
        state: "error",
        message: "Access is denied (os error 5)",
      },
      detection,
      runtimeStrategy: "enhanced",
    });
    const connection = configurationPresentation({
      runtime: {
        ...runtime,
        state: "error",
        message:
          "Could not open the Codex debugging socket: Connection refused",
      },
      detection: { ...detection, running: true },
      runtimeStrategy: "enhanced",
    });

    expect(permission).toMatchObject({
      failureKind: "permission",
      detailKey: "statusPermissionRecoveryDetail",
      action: "apply",
      actionLabelKey: "retryCodexLaunch",
    });
    expect(connection).toMatchObject({
      failureKind: "connection",
      detailKey: "statusConnectionRestartDetail",
      action: "restart",
      actionLabelKey: "restartAndApply",
    });
  });

  it("classifies raw failures once for both persistent and toast feedback", () => {
    expect(
      classifyRuntimeFailure(
        "Codex did not expose a trusted page target before the connection timeout",
      ),
    ).toBe("timeout");
    expect(runtimeFailureMessageKey("Access is denied (os error 5)")).toBe(
      "windowsLaunchPermissionFailed",
    );
    expect(runtimeFailureMessageKey("unmapped desktop error")).toBe(
      "runtimeUnexpectedFailure",
    );
  });
});
