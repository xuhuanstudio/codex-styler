import { useCallback, useReducer } from "react";
import type { ThemeDefinition } from "@codex-styler/theme-core";

const historyLimit = 50;
const groupWindowMs = 700;

export interface ThemeDraftHistoryState {
  present: ThemeDefinition;
  past: ThemeDefinition[];
  future: ThemeDefinition[];
  lastGroup: { key: string; at: number } | null;
}

export type ThemeDraftHistoryAction =
  | {
      type: "commit";
      update: (theme: ThemeDefinition) => ThemeDefinition;
      group?: string;
      at: number;
    }
  | { type: "reset"; theme: ThemeDefinition }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "break-group" };

export function themeDraftsEqual(
  first: ThemeDefinition,
  second: ThemeDefinition,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function createThemeDraftHistory(
  theme: ThemeDefinition,
): ThemeDraftHistoryState {
  return {
    present: structuredClone(theme),
    past: [],
    future: [],
    lastGroup: null,
  };
}

export function themeDraftHistoryReducer(
  state: ThemeDraftHistoryState,
  action: ThemeDraftHistoryAction,
): ThemeDraftHistoryState {
  if (action.type === "reset") {
    return createThemeDraftHistory(action.theme);
  }

  if (action.type === "break-group") {
    return state.lastGroup ? { ...state, lastGroup: null } : state;
  }

  if (action.type === "undo") {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      present: previous,
      past: state.past.slice(0, -1),
      future: [state.present, ...state.future].slice(0, historyLimit),
      lastGroup: null,
    };
  }

  if (action.type === "redo") {
    const next = state.future[0];
    if (!next) return state;
    return {
      present: next,
      past: [...state.past, state.present].slice(-historyLimit),
      future: state.future.slice(1),
      lastGroup: null,
    };
  }

  const next = action.update(structuredClone(state.present));
  if (themeDraftsEqual(next, state.present)) return state;

  const grouped = Boolean(
    action.group &&
    state.lastGroup?.key === action.group &&
    action.at - state.lastGroup.at <= groupWindowMs,
  );

  return {
    present: next,
    past: grouped
      ? state.past
      : [...state.past, state.present].slice(-historyLimit),
    future: [],
    lastGroup: action.group ? { key: action.group, at: action.at } : null,
  };
}

export function useThemeDraftHistory(initialTheme: ThemeDefinition) {
  const [state, dispatch] = useReducer(
    themeDraftHistoryReducer,
    initialTheme,
    createThemeDraftHistory,
  );

  const commit = useCallback(
    (update: (theme: ThemeDefinition) => ThemeDefinition, group?: string) => {
      dispatch({ type: "commit", update, group, at: Date.now() });
    },
    [],
  );

  const reset = useCallback((theme: ThemeDefinition) => {
    dispatch({ type: "reset", theme });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const breakGroup = useCallback(() => dispatch({ type: "break-group" }), []);

  return {
    theme: state.present,
    commit,
    reset,
    undo,
    redo,
    breakGroup,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
