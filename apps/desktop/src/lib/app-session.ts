import type {
  CompanionDefinition,
  CompanionOverrides,
  ThemeDefinition,
} from "@codex-styler/theme-core";
import type { RuntimeStatus } from "./runtime";

export type ThemeVariantName = "light" | "dark";

export interface AppSessionState {
  selection: {
    theme: ThemeDefinition;
    variant: ThemeVariantName;
    companion: CompanionDefinition | null;
    companionOverrides?: CompanionOverrides;
  };
  runtime: RuntimeStatus;
  draft: {
    themeDirty: boolean;
    companionDirty: boolean;
  };
  operation: {
    revision: number;
    phase: "idle" | "applying" | "saving" | "restoring" | "error";
    message: string | null;
  };
}

export type AppSessionAction =
  | { type: "selection/theme"; theme: ThemeDefinition }
  | { type: "selection/variant"; variant: ThemeVariantName }
  | {
      type: "selection/companion";
      companion: CompanionDefinition | null;
      companionOverrides?: CompanionOverrides;
    }
  | {
      type: "selection/companion-overrides";
      companionOverrides?: CompanionOverrides;
    }
  | { type: "runtime/replace"; runtime: RuntimeStatus }
  | { type: "runtime/reset"; runtime: RuntimeStatus }
  | {
      type: "runtime/update";
      update: (runtime: RuntimeStatus) => RuntimeStatus;
    }
  | { type: "draft/theme-dirty"; dirty: boolean }
  | { type: "draft/companion-dirty"; dirty: boolean }
  | {
      type: "operation/start";
      revision: number;
      phase: Exclude<AppSessionState["operation"]["phase"], "idle" | "error">;
    }
  | { type: "operation/complete"; revision: number }
  | { type: "operation/error"; revision: number; message: string };

export function createInitialAppSession(
  theme: ThemeDefinition,
  runtime: RuntimeStatus,
  companion: CompanionDefinition | null = null,
  companionOverrides?: CompanionOverrides,
  variant: ThemeVariantName = "dark",
): AppSessionState {
  return {
    selection: { theme, variant, companion, companionOverrides },
    runtime,
    draft: { themeDirty: false, companionDirty: false },
    operation: { revision: 0, phase: "idle", message: null },
  };
}

export function appSessionReducer(
  state: AppSessionState,
  action: AppSessionAction,
): AppSessionState {
  switch (action.type) {
    case "selection/theme":
      return {
        ...state,
        selection: { ...state.selection, theme: action.theme },
      };
    case "selection/variant":
      return {
        ...state,
        selection: { ...state.selection, variant: action.variant },
      };
    case "selection/companion":
      return {
        ...state,
        selection: {
          ...state.selection,
          companion: action.companion,
          companionOverrides: action.companionOverrides,
        },
      };
    case "selection/companion-overrides":
      return {
        ...state,
        selection: {
          ...state.selection,
          companionOverrides: action.companionOverrides,
        },
      };
    case "runtime/replace":
      if (action.runtime.revision < state.runtime.revision) return state;
      return { ...state, runtime: action.runtime };
    case "runtime/reset":
      return { ...state, runtime: action.runtime };
    case "runtime/update":
      return { ...state, runtime: action.update(state.runtime) };
    case "draft/theme-dirty":
      return {
        ...state,
        draft: { ...state.draft, themeDirty: action.dirty },
      };
    case "draft/companion-dirty":
      return {
        ...state,
        draft: { ...state.draft, companionDirty: action.dirty },
      };
    case "operation/start":
      if (action.revision < state.operation.revision) return state;
      return {
        ...state,
        operation: {
          revision: action.revision,
          phase: action.phase,
          message: null,
        },
      };
    case "operation/complete":
      if (action.revision !== state.operation.revision) return state;
      return {
        ...state,
        operation: { ...state.operation, phase: "idle", message: null },
      };
    case "operation/error":
      if (action.revision !== state.operation.revision) return state;
      return {
        ...state,
        operation: {
          revision: action.revision,
          phase: "error",
          message: action.message,
        },
      };
    default:
      return state;
  }
}
