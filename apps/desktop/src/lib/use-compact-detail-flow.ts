import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const compactLibraryQuery = "(max-width: 1060px)";

function compactLibraryIsActive() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(compactLibraryQuery).matches
  );
}

interface CloseDetailOptions {
  restoreFocus?: boolean;
}

/**
 * Keeps the responsive list → detail transition usable without coupling
 * resource views to viewport listeners. Wide layouts continue to show both
 * panes, while compact layouts move focus into the detail view and restore it
 * to the originating row on Back or Escape.
 */
export function useCompactDetailFlow<T extends HTMLElement>(
  reduceMotion: boolean,
) {
  const [detailOpen, setDetailOpen] = useState(false);
  const containerRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openDetail = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) triggerRef.current = trigger;
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback((options?: CloseDetailOptions) => {
    const shouldRestoreFocus = options?.restoreFocus ?? true;
    setDetailOpen(false);
    if (!shouldRestoreFocus || !compactLibraryIsActive()) return;
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!detailOpen || !compactLibraryIsActive()) return;
    const container = containerRef.current;
    const viewport = container?.closest<HTMLElement>(".app-main__viewport");
    if (viewport) {
      if (typeof viewport.scrollTo === "function") {
        viewport.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      } else {
        viewport.scrollTop = 0;
      }
    }
    container
      ?.querySelector<HTMLButtonElement>(".compact-detail-back")
      ?.focus({ preventScroll: true });
  }, [detailOpen, reduceMotion]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (event.key !== "Escape" || !detailOpen) return;
      event.preventDefault();
      closeDetail();
    },
    [closeDetail, detailOpen],
  );

  return {
    closeDetail,
    containerRef,
    detailOpen,
    onKeyDown,
    openDetail,
  };
}
