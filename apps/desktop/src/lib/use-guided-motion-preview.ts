import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_PREVIEW_DURATION_MS = 1_500;

export function useGuidedMotionPreview(
  durationMs = DEFAULT_PREVIEW_DURATION_MS,
) {
  const timerRef = useRef<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setPlaying(true);
    setRevision((current) => current + 1);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setPlaying(false);
    }, durationMs);
  }, [durationMs]);

  useEffect(() => stop, [stop]);

  return { revision, playing, play, stop };
}
