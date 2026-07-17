/// <reference lib="webworker" />

import { applyCleanupPixels } from "./pixel-processing";
import type { CleanupSettings } from "./model";

interface CleanupRequest {
  id: number;
  data: Uint8ClampedArray;
  width: number;
  height: number;
  settings: Pick<
    CleanupSettings,
    "sampledColor" | "tolerance" | "feather" | "despill" | "connectedSubject"
  >;
}

const scope: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<CleanupRequest>) => {
  const { id, data, width, height, settings } = event.data;
  try {
    const result = applyCleanupPixels({ data, width, height }, settings);
    scope.postMessage({ id, data: result.data }, [result.data.buffer]);
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
