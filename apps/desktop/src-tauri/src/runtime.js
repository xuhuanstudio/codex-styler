(() => {
  if (window.__CODEX_STYLER_RUNTIME__?.version === 6) return;
  window.__CODEX_STYLER_RUNTIME__?.restore?.();

  const BACKDROP_ID = "codex-styler-scene-root";
  const ENTITY_ID = "codex-styler-entity-root";
  const STYLE_ID = "codex-styler-runtime-style";
  const HEX = /^#[0-9a-f]{6}$/i;
  const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
  let pointerHandler = null;
  let resizeHandler = null;
  let mutationObserver = null;
  let animationFrame = null;
  let healthTimer = null;
  let activeState = null;
  let entityCleanup = null;
  let entityPositioner = null;

  const finiteBetween = (value, minimum, maximum) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum;

  const rgb = (hex) =>
    [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const luminance = (hex) => {
    const channels = rgb(hex).map((value) => {
      const normalized = value / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const contrast = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const readable = (preferred, background) => {
    if (contrast(preferred, background) >= 4.5) return preferred;
    return contrast("#151515", background) >= contrast("#f7f7f5", background)
      ? "#151515"
      : "#f7f7f5";
  };

  const assertSafeImage = (value) => {
    if (value === undefined) return;
    if (
      typeof value !== "string" ||
      value.length > 28_000_000 ||
      !DATA_IMAGE.test(value)
    ) {
      throw new Error("Codex Styler rejected an unsafe runtime image");
    }
  };

  const assertSafeTheme = (theme, variant) => {
    if (
      !theme ||
      typeof theme !== "object" ||
      !/^[a-z0-9][a-z0-9.-]{2,63}$/.test(theme.id)
    ) {
      throw new Error("Codex Styler rejected an invalid theme identity");
    }
    if (variant !== "light" && variant !== "dark") {
      throw new Error("Codex Styler rejected an invalid variant");
    }
    const visual = theme.variants?.[variant];
    const background = visual?.background;
    const appearance = visual?.appearance;
    if (!background || !appearance)
      throw new Error("Codex Styler rejected incomplete theme data");
    for (const color of [
      background.color,
      background.overlay,
      appearance.accent,
      appearance.surface,
      appearance.text,
      appearance.mutedText,
      appearance.border,
    ]) {
      if (typeof color !== "string" || !HEX.test(color)) {
        throw new Error("Codex Styler rejected an unsafe color value");
      }
    }
    if (
      !finiteBetween(background.position?.x, 0, 100) ||
      !finiteBetween(background.position?.y, 0, 100) ||
      !finiteBetween(background.brightness, 0.2, 2) ||
      !finiteBetween(background.blur, 0, 40) ||
      !finiteBetween(background.overlayOpacity, 0, 1) ||
      !finiteBetween(appearance.surfaceOpacity, 0, 1) ||
      !finiteBetween(appearance.radius, 0, 32) ||
      !finiteBetween(appearance.focusBlur, 0, 32)
    ) {
      throw new Error("Codex Styler rejected an out-of-range visual value");
    }
    if (
      (appearance.layout !== undefined &&
        !["native", "editorial", "immersive"].includes(appearance.layout)) ||
      (appearance.iconStyle !== undefined &&
        !["native", "contained", "themed"].includes(appearance.iconStyle)) ||
      (appearance.decorations !== undefined &&
        !["none", "subtle", "expressive"].includes(appearance.decorations))
    ) {
      throw new Error("Codex Styler rejected an unsafe chrome treatment");
    }
    assertSafeImage(background.image);
    const entities = theme.scene?.entities;
    if (!Array.isArray(entities) || entities.length > 1) {
      throw new Error("Codex Styler rejected an invalid entity list");
    }
    const entity = entities[0];
    if (!entity) return;
    const renderer = entity.renderer;
    if (
      !renderer ||
      !["image", "sprite-atlas"].includes(renderer.type) ||
      !finiteBetween(entity.anchor?.x, 0, 100) ||
      !finiteBetween(entity.anchor?.y, 0, 100) ||
      !finiteBetween(entity.size, 24, 512) ||
      !finiteBetween(entity.opacity, 0, 1) ||
      !Array.isArray(entity.behaviors)
    ) {
      throw new Error("Codex Styler rejected invalid entity data");
    }
    if (
      renderer.type === "sprite-atlas" &&
      (![4, 8, 16].includes(renderer.directions) ||
        !Number.isInteger(renderer.columns) ||
        !Number.isInteger(renderer.rows) ||
        !Number.isInteger(renderer.frameWidth) ||
        !Number.isInteger(renderer.frameHeight) ||
        renderer.columns < 1 ||
        renderer.rows < 1 ||
        renderer.directions > renderer.columns * renderer.rows)
    ) {
      throw new Error("Codex Styler rejected invalid sprite atlas data");
    }
    if (
      (renderer.normalization !== undefined &&
        !["preserve", "grounded"].includes(renderer.normalization)) ||
      (renderer.alphaThreshold !== undefined &&
        (!Number.isInteger(renderer.alphaThreshold) ||
          renderer.alphaThreshold < 0 ||
          renderer.alphaThreshold > 255))
    ) {
      throw new Error("Codex Styler rejected invalid sprite normalization");
    }
    const attachment = entity.attachment;
    if (
      attachment &&
      (!["composer", "main-surface", "thread-summary"].includes(
        attachment.target,
      ) ||
        !["top", "bottom"].includes(attachment.edge) ||
        !finiteBetween(attachment.align, 0, 1) ||
        !finiteBetween(attachment.offset?.x, -512, 512) ||
        !finiteBetween(attachment.offset?.y, -512, 512))
    ) {
      throw new Error("Codex Styler rejected invalid entity attachment");
    }
    assertSafeImage(renderer.asset);
  };

  const remove = () => {
    mutationObserver?.disconnect();
    mutationObserver = null;
    activeState = null;
    if (pointerHandler)
      window.removeEventListener("pointermove", pointerHandler);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    if (healthTimer !== null) clearTimeout(healthTimer);
    entityCleanup?.();
    pointerHandler = null;
    resizeHandler = null;
    animationFrame = null;
    healthTimer = null;
    entityCleanup = null;
    entityPositioner = null;
    document.getElementById(BACKDROP_ID)?.remove();
    document.getElementById(ENTITY_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-codex-styler");
    document.documentElement.removeAttribute("data-codex-styler-mode");
    document.documentElement.removeAttribute("data-codex-styler-fallback");
    document.documentElement.removeAttribute("data-codex-styler-page");
    document.documentElement.removeAttribute("data-codex-styler-layout");
    document.documentElement.removeAttribute("data-codex-styler-icons");
    document.documentElement.removeAttribute("data-codex-styler-decorations");
  };

  const installStyles = (theme, variant, safeMode) => {
    const visual = theme.variants[variant];
    const { appearance, background } = visual;
    const protectedText = readable(appearance.text, appearance.surface);
    const protectedMuted = readable(appearance.mutedText, appearance.surface);
    const protectedOpacity = background.image
      ? Math.max(0.72, appearance.surfaceOpacity)
      : appearance.surfaceOpacity;
    const surfacePercent = Math.round(protectedOpacity * 100);
    const quietSurfacePercent = background.image
      ? Math.max(64, Math.round(surfacePercent * 0.78))
      : Math.max(38, Math.round(surfacePercent * 0.62));
    const strongSurfacePercent = Math.min(94, Math.max(58, surfacePercent));
    const accentText = readable(appearance.surface, appearance.accent);
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const semantic = safeMode
      ? ""
      : `
        html[data-codex-styler][data-codex-styler-mode="semantic"] {
          color-scheme: ${variant};
          --color-token-foreground: ${protectedText};
          --color-token-text-primary: ${protectedText};
          --color-token-text-secondary: ${protectedMuted};
          --color-token-text-tertiary: color-mix(in srgb, ${protectedMuted} 82%, ${protectedText});
          --color-token-description-foreground: ${protectedMuted};
          --color-token-border: ${appearance.border};
          --color-token-border-default: ${appearance.border};
          --color-token-main-surface-primary: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent);
          --color-token-input-background: color-mix(in srgb, ${appearance.surface} ${Math.min(96, strongSurfacePercent + 6)}%, transparent);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > div:first-child {
          background: transparent !important;
          color: ${protectedText};
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel {
          color: ${protectedText} !important;
          background: linear-gradient(180deg, color-mix(in srgb, ${appearance.surface} ${Math.min(96, strongSurfacePercent + 5)}%, transparent), color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent)) !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: saturate(1.08) blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel nav {
          background: transparent !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel button {
          transition: color 150ms ease, background 150ms ease, box-shadow 150ms ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel button:hover {
          background: color-mix(in srgb, ${appearance.accent} 10%, transparent) !important;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, ${appearance.accent} 12%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel [aria-current="page"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel [class~="bg-token-list-hover-background"] {
          background: color-mix(in srgb, ${appearance.accent} 14%, ${appearance.surface}) !important;
          box-shadow: inset 3px 0 ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface {
          margin: 7px 8px 8px 6px !important;
          overflow: clip !important;
          color: ${protectedText} !important;
          background: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, transparent) !important;
          border: 1px solid color-mix(in srgb, ${appearance.border} 84%, transparent) !important;
          border-radius: ${Math.max(10, appearance.radius + 4)}px !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: saturate(1.04) blur(${Math.max(2, Math.round(appearance.focusBlur * 0.35))}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="task"] main.main-surface {
          background-blend-mode: normal !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface > header,
        html[data-codex-styler][data-codex-styler-mode="semantic"] header.app-header-tint {
          background: color-mix(in srgb, ${appearance.surface} ${Math.min(90, strongSurfacePercent + 4)}%, transparent) !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface [role="main"] {
          background: transparent !important;
          scrollbar-color: color-mix(in srgb, ${appearance.accent} 38%, transparent) transparent;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface article,
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface [data-message-author-role],
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome,
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="dialog"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="menu"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="listbox"] {
          background: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
          border-color: ${appearance.border} !important;
          border-radius: ${appearance.radius}px !important;
          color: ${protectedText} !important;
          box-shadow: 0 1px 0 color-mix(in srgb, ${protectedText} 5%, transparent), 0 14px 40px rgb(0 0 0 / 9%) !important;
          backdrop-filter: saturate(1.08) blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome:focus-within {
          border-color: color-mix(in srgb, ${appearance.accent} 55%, ${appearance.border}) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, ${appearance.accent} 14%, transparent), 0 18px 50px rgb(0 0 0 / 12%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .ProseMirror {
          color: ${protectedText} !important;
          caret-color: ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] button[class~="bg-token-foreground"] {
          color: ${appearance.surface} !important;
          background: ${appearance.accent} !important;
          box-shadow: 0 6px 18px color-mix(in srgb, ${appearance.accent} 22%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] {
          color: ${protectedText} !important;
          background: color-mix(in srgb, ${appearance.surface} ${Math.min(96, strongSurfacePercent + 5)}%, transparent) !important;
          border: 1px solid color-mix(in srgb, ${appearance.border} 88%, transparent) !important;
          border-radius: ${Math.max(12, appearance.radius + 4)}px !important;
          box-shadow: 0 22px 70px rgb(0 0 0 / 16%), inset 0 1px color-mix(in srgb, ${protectedText} 5%, transparent) !important;
          backdrop-filter: saturate(1.1) blur(${Math.max(12, appearance.focusBlur + 6)}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] > div,
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] section {
          border-color: color-mix(in srgb, ${appearance.border} 72%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item-button"] {
          border-radius: ${Math.max(8, appearance.radius - 3)}px !important;
          transition: background 150ms ease, transform 150ms ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item-button"]:hover {
          background: color-mix(in srgb, ${appearance.accent} 11%, transparent) !important;
          transform: translateX(2px);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(input, textarea, select) {
          color: ${protectedText} !important;
          border-color: ${appearance.border} !important;
          background-color: color-mix(in srgb, ${appearance.surface} ${Math.min(96, strongSurfacePercent + 5)}%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(a, [role="link"]) {
          text-decoration-color: color-mix(in srgb, ${appearance.accent} 55%, transparent);
          text-underline-offset: 3px;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is([role="dialog"], [role="menu"], [role="listbox"]) button:hover {
          background-color: color-mix(in srgb, ${appearance.accent} 10%, transparent) !important;
        }

        /* Theme-owned icon treatment. The native glyph remains accessible while its
           container, weight, and home mark are replaced by the selected theme. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] aside.app-shell-left-panel button svg,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] [data-pip-obstacle="thread-summary-panel"] svg {
          box-sizing: border-box;
          width: 25px !important;
          height: 25px !important;
          padding: 5px;
          border-radius: 8px;
          color: ${appearance.accent} !important;
          background: color-mix(in srgb, ${appearance.accent} 11%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, ${appearance.accent} 13%, transparent);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] aside.app-shell-left-panel button svg,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] [data-pip-obstacle="thread-summary-panel"] [data-slot] svg {
          box-sizing: border-box;
          width: 27px !important;
          height: 27px !important;
          padding: 6px;
          border-radius: 50%;
          color: ${accentText} !important;
          background: linear-gradient(145deg, color-mix(in srgb, ${appearance.accent} 82%, white), ${appearance.accent});
          box-shadow: 0 5px 14px color-mix(in srgb, ${appearance.accent} 24%, transparent), inset 0 1px rgb(255 255 255 / 24%);
        }

        /* Full home composition: hero, suggestions, project rail, and composer. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] [role="main"]:has([data-feature="game-source"]) {
          --thread-content-max-width: min(980px, calc(100cqw - 42px)) !important;
          overflow-x: hidden !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-layout="editorial"] [role="main"]:has([data-feature="game-source"]) > div:first-child > div:first-child > div:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-layout="immersive"] [role="main"]:has([data-feature="game-source"]) > div:first-child > div:first-child > div:first-child {
          position: relative !important;
          isolation: isolate;
          width: calc(100% - 38px) !important;
          max-width: none !important;
          min-height: 238px !important;
          padding: 0 !important;
          overflow: hidden !important;
          border: 1px solid color-mix(in srgb, ${appearance.accent} 38%, ${appearance.border}) !important;
          border-radius: ${Math.max(18, appearance.radius + 8)}px !important;
          background-color: ${appearance.surface} !important;
          background-image: linear-gradient(90deg, color-mix(in srgb, ${appearance.surface} 96%, transparent) 0%, color-mix(in srgb, ${appearance.surface} 78%, transparent) 48%, color-mix(in srgb, ${appearance.surface} 18%, transparent) 100%)${background.image ? `, url('${background.image}')` : ""} !important;
          background-size: cover !important;
          background-position: ${background.position.x}% ${background.position.y}% !important;
          box-shadow: 0 20px 55px rgb(0 0 0 / 18%), inset 0 1px color-mix(in srgb, ${protectedText} 8%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-layout="immersive"] [role="main"]:has([data-feature="game-source"]) > div:first-child > div:first-child > div:first-child {
          width: calc(100% - 26px) !important;
          min-height: 270px !important;
          border-radius: ${Math.max(22, appearance.radius + 12)}px !important;
          background-image: linear-gradient(90deg, color-mix(in srgb, ${appearance.surface} 94%, transparent) 0%, color-mix(in srgb, ${appearance.surface} 64%, transparent) 44%, transparent 100%)${background.image ? `, url('${background.image}')` : ""} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] [data-testid="home-icon"] {
          display: none !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] [data-feature="game-source"] {
          position: relative;
          display: block !important;
          max-width: 560px !important;
          color: ${protectedText} !important;
          text-align: left !important;
          font-size: clamp(20px, 2vw, 29px) !important;
          font-weight: 720 !important;
          line-height: 1.25 !important;
          text-shadow: 0 2px 18px rgb(0 0 0 / ${variant === "dark" ? "42%" : "14%"});
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-icons="themed"] [data-feature="game-source"]::before {
          content: "";
          display: block;
          width: 42px;
          height: 42px;
          margin-bottom: 17px;
          border: 8px double color-mix(in srgb, ${appearance.accent} 82%, white);
          border-right-color: transparent;
          border-radius: 50%;
          box-shadow: 0 0 0 5px color-mix(in srgb, ${appearance.accent} 10%, transparent), 0 0 24px color-mix(in srgb, ${appearance.accent} 30%, transparent);
          transform: rotate(-18deg);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] .group\\/home-suggestions button {
          position: relative !important;
          min-height: 118px !important;
          padding: 15px !important;
          border: 1px solid color-mix(in srgb, ${appearance.accent} 20%, ${appearance.border}) !important;
          border-radius: ${Math.max(16, appearance.radius + 5)}px !important;
          color: ${protectedText} !important;
          background: linear-gradient(145deg, color-mix(in srgb, ${appearance.surface} ${Math.min(98, strongSurfacePercent + 4)}%, transparent), color-mix(in srgb, ${appearance.surface} ${Math.max(56, strongSurfacePercent - 8)}%, transparent)) !important;
          box-shadow: 0 12px 30px rgb(0 0 0 / 12%), inset 0 1px color-mix(in srgb, ${protectedText} 6%, transparent) !important;
          backdrop-filter: blur(${Math.max(10, appearance.focusBlur)}px) saturate(1.08) !important;
          transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] .group\\/home-suggestions button:hover {
          transform: translateY(-4px) !important;
          border-color: color-mix(in srgb, ${appearance.accent} 58%, ${appearance.border}) !important;
          box-shadow: 0 18px 38px rgb(0 0 0 / 16%), 0 0 0 3px color-mix(in srgb, ${appearance.accent} 8%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-icons="themed"] .group\\/home-suggestions button > span:first-child > span:first-child {
          width: 40px !important;
          height: 40px !important;
          display: grid !important;
          place-items: center;
          border-radius: 14px !important;
          color: ${accentText} !important;
          background: linear-gradient(145deg, color-mix(in srgb, ${appearance.accent} 78%, white), ${appearance.accent}) !important;
          box-shadow: 0 8px 18px color-mix(in srgb, ${appearance.accent} 24%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector) {
          position: relative;
          padding: 32px 10px 10px !important;
          border: 1px solid color-mix(in srgb, ${appearance.accent} 14%, ${appearance.border}) !important;
          border-bottom: 0 !important;
          border-radius: ${Math.max(14, appearance.radius + 3)}px ${Math.max(14, appearance.radius + 3)}px 0 0;
          background: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
          backdrop-filter: blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector)::before {
          content: "WORKSPACE";
          position: absolute;
          top: 10px;
          left: 14px;
          color: ${appearance.accent};
          font: 700 10px/1 system-ui, sans-serif;
          letter-spacing: .15em;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome {
          position: relative;
          overflow: visible !important;
          border-width: 1px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] .composer-surface-chrome::before {
          content: "";
          position: absolute;
          left: -8px;
          top: -8px;
          width: 18px;
          height: 18px;
          border: 4px solid ${appearance.accent};
          border-right-color: transparent;
          border-radius: 50%;
          background: ${appearance.surface};
          box-shadow: 0 0 16px color-mix(in srgb, ${appearance.accent} 34%, transparent);
          transform: rotate(-25deg);
          pointer-events: none;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="task"] [data-message-author-role="user"] {
          border-left: 3px solid ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] main.main-surface::after {
          content: "";
          position: absolute;
          right: 22px;
          bottom: 18px;
          width: 74px;
          height: 22px;
          border: 1px solid color-mix(in srgb, ${appearance.accent} 28%, transparent);
          border-radius: 50%;
          transform: rotate(-12deg);
          pointer-events: none;
          opacity: .72;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] pre,
        html[data-codex-styler][data-codex-styler-mode="semantic"] code {
          border-color: color-mix(in srgb, ${appearance.border} 75%, transparent) !important;
          border-radius: ${Math.max(6, appearance.radius - 4)}px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] ::selection {
          background: color-mix(in srgb, ${appearance.accent} 28%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel button {
            transition: none !important;
          }
        }
      `;
    style.textContent = `
      html[data-codex-styler] body {
        background: transparent !important;
      }
      html[data-codex-styler] body > div:first-child {
        position: relative; z-index: 1;
      }
      #${BACKDROP_ID} {
        position: fixed; inset: 0; z-index: 0; pointer-events: none;
        overflow: hidden; background: ${background.color};
      }
      #${BACKDROP_ID} .cs-background {
        position: absolute; inset: -20px;
        background-color: ${background.color};
        background-image: ${background.image ? `url('${background.image}')` : "none"};
        background-position: ${background.position.x}% ${background.position.y}%;
        background-size: cover;
        filter: brightness(${background.brightness}) blur(${background.blur}px);
        transform: scale(1.015);
      }
      #${BACKDROP_ID} .cs-overlay {
        position: absolute; inset: 0; background: ${background.overlay};
        opacity: ${background.overlayOpacity};
      }
      #${ENTITY_ID} {
        position: fixed; inset: 0; z-index: 2147483000; pointer-events: none;
        overflow: hidden; contain: strict;
      }
      #${ENTITY_ID} canvas, #${ENTITY_ID} .cs-entity-image {
        position: absolute; pointer-events: auto; user-select: none; touch-action: none;
        cursor: grab;
        filter: drop-shadow(0 10px 18px rgb(0 0 0 / 18%));
      }
      #${ENTITY_ID} canvas:active, #${ENTITY_ID} .cs-entity-image:active { cursor: grabbing; }
      #${ENTITY_ID} .cs-entity-image { object-fit: contain; }
      ${semantic}
    `;
    document.head.appendChild(style);
  };

  const updatePageKind = () => {
    const home =
      document.querySelector('[data-testid="home-icon"]') ||
      (document.querySelector('[data-feature="game-source"]') &&
        document.querySelector(".group\\/home-suggestions"));
    document.documentElement.setAttribute(
      "data-codex-styler-page",
      home ? "home" : "task",
    );
  };

  const entityTarget = (target) => {
    if (target === "composer") {
      return (
        document.querySelector(
          '.composer-surface-chrome, [data-testid="composer"]',
        ) || document.querySelector("form textarea")?.closest("form")
      );
    }
    if (target === "thread-summary") {
      return document.querySelector(
        '[data-pip-obstacle="thread-summary-panel"]',
      );
    }
    return document.querySelector("main.main-surface");
  };

  const analyzeOpaqueFrames = (image, renderer) => {
    const frameWidth =
      renderer.type === "sprite-atlas"
        ? renderer.frameWidth
        : image.naturalWidth;
    const frameHeight =
      renderer.type === "sprite-atlas"
        ? renderer.frameHeight
        : image.naturalHeight;
    const frameCount =
      renderer.type === "sprite-atlas" ? renderer.columns * renderer.rows : 1;
    const source = document.createElement("canvas");
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    if (!sourceContext) return null;
    sourceContext.drawImage(image, 0, 0);
    const threshold = renderer.alphaThreshold ?? 24;
    const bounds = [];
    let maxWidth = 1;
    let maxHeight = 1;
    for (let frame = 0; frame < frameCount; frame += 1) {
      const column =
        renderer.type === "sprite-atlas" ? frame % renderer.columns : 0;
      const row =
        renderer.type === "sprite-atlas"
          ? Math.floor(frame / renderer.columns)
          : 0;
      const pixels = sourceContext.getImageData(
        column * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
      ).data;
      let left = frameWidth;
      let top = frameHeight;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < frameHeight; y += 1) {
        for (let x = 0; x < frameWidth; x += 1) {
          if (pixels[(y * frameWidth + x) * 4 + 3] <= threshold) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      const opaque =
        right >= left && bottom >= top
          ? {
              x: left,
              y: top,
              width: right - left + 1,
              height: bottom - top + 1,
            }
          : { x: 0, y: 0, width: frameWidth, height: frameHeight };
      bounds.push(opaque);
      maxWidth = Math.max(maxWidth, opaque.width);
      maxHeight = Math.max(maxHeight, opaque.height);
    }
    return { bounds, maxWidth, maxHeight, frameWidth, frameHeight };
  };

  const installEntity = (root, theme, variant) => {
    const entity = theme.scene.entities?.[0];
    if (!entity) return;

    const renderer = entity.renderer;
    const canvas = document.createElement("canvas");
    const size = Math.max(24, entity.size);
    const aspect =
      renderer.type === "sprite-atlas"
        ? renderer.frameHeight / renderer.frameWidth
        : 1;
    const logicalHeight = size * aspect;
    const pixelRatio = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.ceil(size * pixelRatio);
    canvas.height = Math.ceil(logicalHeight * pixelRatio);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${logicalHeight}px`;
    canvas.style.opacity = String(entity.opacity);
    root.appendChild(canvas);

    let dragging = false;
    let watchedTarget = null;
    const attachmentObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => entityPositioner?.());
    const position = () => {
      const attachment = entity.attachment;
      if (!attachment) {
        canvas.style.left = `${entity.anchor.x}%`;
        canvas.style.top = `${entity.anchor.y}%`;
        canvas.style.transform = "translate(-50%, -50%)";
        if (watchedTarget) attachmentObserver?.unobserve(watchedTarget);
        watchedTarget = null;
        return;
      }
      const target = entityTarget(attachment.target);
      if (!target) return;
      if (watchedTarget !== target) {
        if (watchedTarget) attachmentObserver?.unobserve(watchedTarget);
        watchedTarget = target;
        attachmentObserver?.observe(target);
      }
      const bounds = target.getBoundingClientRect();
      canvas.style.left = `${bounds.left + bounds.width * attachment.align + attachment.offset.x}px`;
      canvas.style.top = `${
        (attachment.edge === "bottom" ? bounds.bottom : bounds.top) +
        attachment.offset.y
      }px`;
      canvas.style.transform =
        attachment.edge === "bottom"
          ? "translate(-50%, 0)"
          : "translate(-50%, -100%)";
    };
    entityPositioner = position;
    position();

    const onDown = (event) => {
      dragging = true;
      event.preventDefault();
      event.stopPropagation();
      canvas.setPointerCapture(event.pointerId);
    };
    const onMove = (event) => {
      if (!dragging) return;
      const composer = entityTarget("composer");
      const composerBounds = composer?.getBoundingClientRect();
      if (
        composerBounds &&
        Math.abs(event.clientY - composerBounds.top) <= 56
      ) {
        entity.attachment = {
          target: "composer",
          edge: "top",
          align: Math.max(
            0.06,
            Math.min(
              0.94,
              (event.clientX - composerBounds.left) / composerBounds.width,
            ),
          ),
          offset: { x: 0, y: 3 },
        };
        position();
        return;
      }
      delete entity.attachment;
      const x = Math.max(
        3,
        Math.min(97, (event.clientX / window.innerWidth) * 100),
      );
      const y = Math.max(
        5,
        Math.min(95, (event.clientY / window.innerHeight) * 100),
      );
      entity.anchor = { x, y };
      position();
    };
    const onUp = (event) => {
      dragging = false;
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const image = new Image();
    image.src = renderer.asset;
    const context = canvas.getContext("2d");
    const targetFps = Math.min(
      60,
      Math.max(12, theme.variants[variant].motion?.targetFps || 30),
    );
    const frameInterval = 1000 / targetFps;
    let analysis = null;
    let frame = 0;
    let pendingFrame = 0;
    let lastDraw = 0;

    const draw = (timestamp = performance.now()) => {
      if (!context || !image.complete || !image.naturalWidth) {
        animationFrame = null;
        return;
      }
      if (timestamp - lastDraw < frameInterval) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }
      frame = pendingFrame;
      const column =
        renderer.type === "sprite-atlas" ? frame % renderer.columns : 0;
      const row =
        renderer.type === "sprite-atlas"
          ? Math.floor(frame / renderer.columns)
          : 0;
      const frameWidth =
        renderer.type === "sprite-atlas"
          ? renderer.frameWidth
          : image.naturalWidth;
      const frameHeight =
        renderer.type === "sprite-atlas"
          ? renderer.frameHeight
          : image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (renderer.normalization === "grounded") {
        analysis ||= analyzeOpaqueFrames(image, renderer);
      }
      if (analysis && renderer.normalization === "grounded") {
        const opaque = analysis.bounds[frame] ?? analysis.bounds[0];
        const sidePadding = canvas.width * 0.06;
        const topPadding = canvas.height * 0.04;
        const bottomPadding = canvas.height * 0.015;
        const scale = Math.min(
          (canvas.width - sidePadding * 2) / analysis.maxWidth,
          (canvas.height - topPadding - bottomPadding) / analysis.maxHeight,
        );
        const drawWidth = opaque.width * scale;
        const drawHeight = opaque.height * scale;
        context.drawImage(
          image,
          column * frameWidth + opaque.x,
          row * frameHeight + opaque.y,
          opaque.width,
          opaque.height,
          (canvas.width - drawWidth) / 2,
          canvas.height - bottomPadding - drawHeight,
          drawWidth,
          drawHeight,
        );
      } else {
        context.drawImage(
          image,
          column * frameWidth,
          row * frameHeight,
          frameWidth,
          frameHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
      lastDraw = timestamp;
      animationFrame = null;
    };
    const scheduleDraw = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    image.addEventListener(
      "load",
      () => {
        if (renderer.normalization === "grounded") {
          try {
            analysis = analyzeOpaqueFrames(image, renderer);
          } catch {
            analysis = null;
          }
        }
        scheduleDraw();
      },
      { once: true },
    );
    if (image.complete) scheduleDraw();

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (
      renderer.type === "sprite-atlas" &&
      !reduced &&
      entity.behaviors.includes("look-at-pointer")
    ) {
      pointerHandler = (event) => {
        if (dragging) return;
        const bounds = canvas.getBoundingClientRect();
        const angle = Math.atan2(
          event.clientY - (bounds.top + bounds.height / 2),
          event.clientX - (bounds.left + bounds.width / 2),
        );
        const normalized = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        pendingFrame =
          Math.round(normalized / ((Math.PI * 2) / renderer.directions)) %
          renderer.directions;
        scheduleDraw();
      };
      window.addEventListener("pointermove", pointerHandler, { passive: true });
    }
    resizeHandler = () => {
      position();
      scheduleDraw();
    };
    window.addEventListener("resize", resizeHandler, { passive: true });
    entityCleanup = () => {
      attachmentObserver?.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  };

  const verifySemanticAdapter = () => {
    const sidebar = document.querySelector("aside.app-shell-left-panel");
    const main = document.querySelector("main.main-surface");
    if (!sidebar) return { ok: false, reason: "sidebar anchor was not found" };
    if (!main)
      return { ok: false, reason: "main workspace anchor was not found" };
    if (!document.getElementById(STYLE_ID)) {
      return { ok: false, reason: "runtime stylesheet was removed" };
    }
    const mainStyle = getComputedStyle(main);
    if (
      mainStyle.backgroundColor === "rgba(0, 0, 0, 0)" &&
      mainStyle.backgroundImage === "none"
    ) {
      return {
        ok: false,
        reason: "semantic surface style did not take effect",
      };
    }
    return { ok: true, reason: null };
  };

  const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(() => resolve()));

  const render = (theme, variant, safeMode, requestedMode, resolvedMode) => {
    assertSafeTheme(theme, variant);
    remove();
    document.documentElement.setAttribute("data-codex-styler", theme.id);
    document.documentElement.setAttribute(
      "data-codex-styler-mode",
      safeMode ? "compatibility" : "semantic",
    );
    const appearance = theme.variants[variant].appearance;
    document.documentElement.setAttribute(
      "data-codex-styler-layout",
      appearance.layout || "native",
    );
    document.documentElement.setAttribute(
      "data-codex-styler-icons",
      appearance.iconStyle || "native",
    );
    document.documentElement.setAttribute(
      "data-codex-styler-decorations",
      appearance.decorations || "none",
    );
    installStyles(theme, variant, Boolean(safeMode));
    updatePageKind();

    const backdrop = document.createElement("div");
    backdrop.id = BACKDROP_ID;
    backdrop.setAttribute("aria-hidden", "true");
    const background = document.createElement("div");
    background.className = "cs-background";
    const overlay = document.createElement("div");
    overlay.className = "cs-overlay";
    backdrop.append(background, overlay);
    document.body.appendChild(backdrop);

    const entityRoot = document.createElement("div");
    entityRoot.id = ENTITY_ID;
    entityRoot.setAttribute("aria-hidden", "true");
    document.body.appendChild(entityRoot);
    installEntity(entityRoot, theme, variant);

    activeState = {
      theme,
      variant,
      safeMode: Boolean(safeMode),
      requestedMode,
      resolvedMode,
    };
    mutationObserver = new MutationObserver(() => {
      updatePageKind();
      entityPositioner?.();
      if (
        activeState &&
        (!document.getElementById(BACKDROP_ID) ||
          !document.getElementById(ENTITY_ID) ||
          !document.getElementById(STYLE_ID))
      ) {
        const state = activeState;
        render(
          state.theme,
          state.variant,
          state.safeMode,
          state.requestedMode,
          state.resolvedMode,
        );
        return;
      }
      if (
        activeState?.requestedMode === "auto" &&
        activeState.resolvedMode === "semantic"
      ) {
        if (healthTimer !== null) clearTimeout(healthTimer);
        healthTimer = setTimeout(() => {
          healthTimer = null;
          const verification = verifySemanticAdapter();
          if (!verification.ok && activeState?.resolvedMode === "semantic") {
            const state = activeState;
            render(
              state.theme,
              state.variant,
              true,
              state.requestedMode,
              "compatibility",
            );
            document.documentElement.setAttribute(
              "data-codex-styler-fallback",
              verification.reason,
            );
          }
        }, 700);
      }
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  };

  const apply = async (theme, variant, compatibilityMode = "auto") => {
    assertSafeTheme(theme, variant);
    if (!["auto", "compatibility", "developer"].includes(compatibilityMode)) {
      throw new Error("Codex Styler rejected an invalid compatibility mode");
    }

    const themeRequestsSemantic =
      theme.compatibility?.codex?.mode === "semantic";
    if (
      compatibilityMode === "compatibility" ||
      (compatibilityMode === "auto" && !themeRequestsSemantic)
    ) {
      render(theme, variant, true, compatibilityMode, "compatibility");
      return {
        ok: true,
        themeId: theme.id,
        requestedMode: compatibilityMode,
        resolvedMode: "compatibility",
        reason: themeRequestsSemantic
          ? null
          : "theme requests isolated rendering",
      };
    }

    const resolvedMode =
      compatibilityMode === "developer" ? "developer" : "semantic";
    render(theme, variant, false, compatibilityMode, resolvedMode);
    if (compatibilityMode === "developer") {
      return {
        ok: true,
        themeId: theme.id,
        requestedMode: compatibilityMode,
        resolvedMode: "developer",
        reason: null,
      };
    }

    await nextFrame();
    await nextFrame();
    const verification = verifySemanticAdapter();
    if (!verification.ok) {
      render(theme, variant, true, compatibilityMode, "compatibility");
      document.documentElement.setAttribute(
        "data-codex-styler-fallback",
        verification.reason,
      );
      return {
        ok: true,
        themeId: theme.id,
        requestedMode: compatibilityMode,
        resolvedMode: "compatibility",
        reason: verification.reason,
      };
    }

    return {
      ok: true,
      themeId: theme.id,
      requestedMode: compatibilityMode,
      resolvedMode: "semantic",
      reason: null,
    };
  };

  window.__CODEX_STYLER_RUNTIME__ = {
    version: 6,
    apply,
    pause: remove,
    restore: remove,
  };
})();
