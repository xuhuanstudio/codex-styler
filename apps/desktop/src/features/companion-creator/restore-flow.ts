export class CompanionRestoreCancelledError extends Error {
  constructor() {
    super("Companion draft restoration was cancelled");
    this.name = "CompanionRestoreCancelledError";
  }
}

export function throwIfRestoreCancelled(signal: AbortSignal): void {
  if (signal.aborted) throw new CompanionRestoreCancelledError();
}

export function isCompanionRestoreCancelled(reason: unknown): boolean {
  return reason instanceof CompanionRestoreCancelledError;
}

/**
 * Restoring large cleaned frames in parallel can enqueue several full-size
 * pixel buffers at once and make the WebView appear frozen. Keep this stage
 * sequential: it bounds peak memory, yields observable progress after every
 * frame, and gives cancellation a deterministic checkpoint.
 */
export async function restoreFramesSequentially<T, R>(
  items: readonly T[],
  transform: (item: T, index: number) => Promise<R>,
  options: {
    signal: AbortSignal;
    onProgress?: (completed: number, total: number) => void;
  },
): Promise<R[]> {
  const output: R[] = [];
  for (const [index, item] of items.entries()) {
    throwIfRestoreCancelled(options.signal);
    output.push(await transform(item, index));
    throwIfRestoreCancelled(options.signal);
    options.onProgress?.(index + 1, items.length);
  }
  return output;
}
