(() => {
  if (window.__CODEX_STYLER_RUNTIME__?.version === 15) return;
  window.__CODEX_STYLER_RUNTIME__?.restore?.();

  const BACKDROP_ID = "codex-styler-scene-root";
  const ENTITY_ID = "codex-styler-entity-root";
  const STYLE_ID = "codex-styler-runtime-style";
  const APP_ROOT_ATTRIBUTE = "data-codex-styler-app-root";
  const OVERLAY_ROOT_ATTRIBUTE = "data-codex-styler-overlay-root";
  const UNLAYERED_ROOT_ATTRIBUTE = "data-codex-styler-unlayered-root";
  const STATIC_ROOT_ATTRIBUTE = "data-codex-styler-static-root";
  const HEX = /^#[0-9a-f]{6}$/i;
  const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
  const PALETTE_KEYS = new Set([
    "canvas",
    "surfaceRaised",
    "surfaceOverlay",
    "surfaceSunken",
    "control",
    "controlHover",
    "controlActive",
    "textTertiary",
    "onAccent",
    "borderSubtle",
    "borderStrong",
    "focus",
    "success",
    "warning",
    "danger",
    "info",
    "added",
    "modified",
    "deleted",
  ]);
  let pointerHandler = null;
  let resizeHandler = null;
  let layoutResizeHandler = null;
  let mutationObserver = null;
  let animationFrame = null;
  let healthTimer = null;
  let activeState = null;
  let entityCleanup = null;
  let entityPositioner = null;
  let latestRevision = 0;

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
      appearance.palette !== undefined &&
      (!appearance.palette ||
        typeof appearance.palette !== "object" ||
        Array.isArray(appearance.palette))
    ) {
      throw new Error("Codex Styler rejected an invalid semantic palette");
    }
    for (const [key, color] of Object.entries(appearance.palette || {})) {
      if (
        !PALETTE_KEYS.has(key) ||
        typeof color !== "string" ||
        !HEX.test(color)
      ) {
        throw new Error("Codex Styler rejected an unsafe semantic color");
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
      (!Number.isInteger(renderer.directions) ||
        renderer.directions < 4 ||
        renderer.directions > 512 ||
        !Number.isInteger(renderer.columns) ||
        !Number.isInteger(renderer.rows) ||
        !Number.isInteger(renderer.frameWidth) ||
        !Number.isInteger(renderer.frameHeight) ||
        renderer.columns < 1 ||
        renderer.rows < 1 ||
        renderer.columns > 16 ||
        renderer.rows > 16 ||
        (renderer.framesPerPage !== undefined &&
          (!Number.isInteger(renderer.framesPerPage) ||
            renderer.framesPerPage < 1 ||
            renderer.framesPerPage > renderer.columns * renderer.rows)) ||
        (renderer.pages !== undefined &&
          (!Array.isArray(renderer.pages) ||
            renderer.pages.length < 1 ||
            renderer.pages.length > 8)) ||
        renderer.directions >
          (renderer.framesPerPage ?? renderer.columns * renderer.rows) *
            (renderer.pages?.length ?? 1) ||
        (renderer.frameCount !== undefined &&
          (!Number.isInteger(renderer.frameCount) ||
            renderer.frameCount < 4 ||
            renderer.frameCount > 512 ||
            renderer.frameCount >
              (renderer.framesPerPage ?? renderer.columns * renderer.rows) *
                (renderer.pages?.length ?? 1))) ||
        (renderer.frameAngles !== undefined &&
          (!Array.isArray(renderer.frameAngles) ||
            renderer.frameAngles.length !== renderer.directions ||
            renderer.frameAngles.some(
              (angle, index) =>
                !finiteBetween(angle, 0, 360) ||
                (index > 0 && angle < renderer.frameAngles[index - 1]),
            ))) ||
        (renderer.transitionFps !== undefined &&
          (!Number.isInteger(renderer.transitionFps) ||
            renderer.transitionFps < 12 ||
            renderer.transitionFps > 60)) ||
        (renderer.followSmoothing !== undefined &&
          !finiteBetween(renderer.followSmoothing, 0.02, 1)))
    ) {
      throw new Error("Codex Styler rejected invalid sprite atlas data");
    }
    if (renderer.type === "sprite-atlas" && renderer.poses !== undefined) {
      const frameCount = renderer.frameCount ?? renderer.directions;
      if (
        !Array.isArray(renderer.poses) ||
        renderer.poses.length < 4 ||
        renderer.poses.length > 512 ||
        renderer.poses.some(
          (pose, index) =>
            typeof pose?.id !== "string" ||
            pose.id.length < 2 ||
            !finiteBetween(pose.angle, 0, 359.999999) ||
            !Number.isInteger(pose.frame) ||
            pose.frame < 0 ||
            pose.frame >= frameCount ||
            (index > 0 && pose.angle <= renderer.poses[index - 1].angle),
        )
      ) {
        throw new Error("Codex Styler rejected invalid companion poses");
      }
      const poseIds = new Set(renderer.poses.map((pose) => pose.id));
      if (
        renderer.idleClips !== undefined &&
        (!Array.isArray(renderer.idleClips) ||
          renderer.idleClips.length > 64 ||
          renderer.idleClips.some(
            (clip) =>
              typeof clip?.id !== "string" ||
              !Array.isArray(clip.poseIds) ||
              clip.poseIds.length < 1 ||
              clip.poseIds.some((id) => !poseIds.has(id)) ||
              !Array.isArray(clip.frames) ||
              clip.frames.length < 1 ||
              clip.frames.some(
                (item) =>
                  !Number.isInteger(item?.frame) ||
                  item.frame < 0 ||
                  item.frame >= frameCount ||
                  !Number.isInteger(item.durationMs) ||
                  item.durationMs < 16 ||
                  item.durationMs > 5000,
              ) ||
              !Number.isInteger(clip.minimumDelayMs) ||
              !Number.isInteger(clip.maximumDelayMs) ||
              clip.minimumDelayMs < 250 ||
              clip.maximumDelayMs < clip.minimumDelayMs,
          ))
      ) {
        throw new Error("Codex Styler rejected invalid idle motion clips");
      }
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
    renderer.pages?.forEach(assertSafeImage);
  };

  const removeEntity = () => {
    if (pointerHandler)
      window.removeEventListener("pointermove", pointerHandler);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    entityCleanup?.();
    pointerHandler = null;
    resizeHandler = null;
    animationFrame = null;
    entityCleanup = null;
    entityPositioner = null;
    document.getElementById(ENTITY_ID)?.remove();
  };

  const remove = () => {
    mutationObserver?.disconnect();
    mutationObserver = null;
    activeState = null;
    removeEntity();
    if (layoutResizeHandler)
      window.removeEventListener("resize", layoutResizeHandler);
    if (healthTimer !== null) clearTimeout(healthTimer);
    layoutResizeHandler = null;
    healthTimer = null;
    document.getElementById(BACKDROP_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-codex-styler");
    document.documentElement.removeAttribute("data-codex-styler-mode");
    document.documentElement.removeAttribute("data-codex-styler-fallback");
    document.documentElement.removeAttribute("data-codex-styler-page");
    document.documentElement.removeAttribute("data-codex-styler-layout");
    document.documentElement.removeAttribute("data-codex-styler-icons");
    document.documentElement.removeAttribute("data-codex-styler-decorations");
    document.documentElement.removeAttribute("data-codex-styler-density");
    document.documentElement.removeAttribute(
      "data-codex-styler-collision-guard",
    );
    document
      .querySelectorAll(`[${APP_ROOT_ATTRIBUTE}]`)
      .forEach((element) => element.removeAttribute(APP_ROOT_ATTRIBUTE));
    document
      .querySelectorAll(
        `[${OVERLAY_ROOT_ATTRIBUTE}], [${UNLAYERED_ROOT_ATTRIBUTE}], [${STATIC_ROOT_ATTRIBUTE}]`,
      )
      .forEach((element) => {
        element.removeAttribute(OVERLAY_ROOT_ATTRIBUTE);
        element.removeAttribute(UNLAYERED_ROOT_ATTRIBUTE);
        element.removeAttribute(STATIC_ROOT_ATTRIBUTE);
      });
  };

  const injectedRoot = (element) =>
    element?.id === BACKDROP_ID || element?.id === ENTITY_ID;

  const appRootFallback = () => {
    const conventionalRoot = document.querySelector("body > #root");
    if (conventionalRoot) return conventionalRoot;

    const currentRoot = document.querySelector(
      `body > [${APP_ROOT_ATTRIBUTE}]`,
    );
    if (currentRoot?.isConnected) return currentRoot;

    return Array.from(document.body.children)
      .filter(
        (element) =>
          !injectedRoot(element) &&
          !["SCRIPT", "STYLE", "LINK"].includes(element.tagName),
      )
      .sort((left, right) => {
        const leftBounds = left.getBoundingClientRect();
        const rightBounds = right.getBoundingClientRect();
        return (
          rightBounds.width * rightBounds.height -
          leftBounds.width * leftBounds.height
        );
      })[0];
  };

  const updateStackingRoots = () => {
    const anchoredRoot = (
      document.querySelector("aside.app-shell-left-panel") ||
      document.querySelector("main.main-surface")
    )?.closest("body > *");
    const root = anchoredRoot || appRootFallback();
    document.querySelectorAll(`[${APP_ROOT_ATTRIBUTE}]`).forEach((element) => {
      if (element !== root) element.removeAttribute(APP_ROOT_ATTRIBUTE);
    });
    root?.setAttribute(APP_ROOT_ATTRIBUTE, "");

    const overlaySelector =
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="alert"], [role="status"], [role="tooltip"], [data-radix-popper-content-wrapper], [data-sonner-toaster], [data-hot-toast]';
    Array.from(document.body.children).forEach((element) => {
      const overlay =
        element !== root &&
        !injectedRoot(element) &&
        (element.matches(overlaySelector) ||
          Boolean(element.querySelector(overlaySelector)));
      if (!overlay) {
        element.removeAttribute(OVERLAY_ROOT_ATTRIBUTE);
        element.removeAttribute(UNLAYERED_ROOT_ATTRIBUTE);
        element.removeAttribute(STATIC_ROOT_ATTRIBUTE);
        return;
      }

      if (element.hasAttribute(OVERLAY_ROOT_ATTRIBUTE)) return;
      const computed = getComputedStyle(element);
      element.setAttribute(OVERLAY_ROOT_ATTRIBUTE, "");
      if (!computed.zIndex || computed.zIndex === "auto") {
        element.setAttribute(UNLAYERED_ROOT_ATTRIBUTE, "");
      } else {
        element.removeAttribute(UNLAYERED_ROOT_ATTRIBUTE);
      }
      if (computed.position === "static") {
        element.setAttribute(STATIC_ROOT_ATTRIBUTE, "");
      } else {
        element.removeAttribute(STATIC_ROOT_ATTRIBUTE);
      }
    });
  };

  const semanticPalette = (appearance, background, variant) => {
    const custom = appearance.palette || {};
    const textPrimary = readable(appearance.text, appearance.surface);
    const textSecondary = readable(appearance.mutedText, appearance.surface);
    const safeOverride = (candidate, foreground, fallback, minimum = 4.5) =>
      candidate && contrast(foreground, candidate) >= minimum
        ? candidate
        : fallback;
    const safeForeground = (candidate, backgroundColor, fallback) =>
      candidate && contrast(candidate, backgroundColor) >= 4.5
        ? candidate
        : fallback;
    const statusDefaults =
      variant === "dark"
        ? {
            success: "#4BC47D",
            warning: "#E7A645",
            danger: "#F06A67",
            info: "#83C3FF",
          }
        : {
            success: "#197A43",
            warning: "#9A5B12",
            danger: "#B93232",
            info: "#1F5F99",
          };
    const success = safeForeground(
      custom.success,
      appearance.surface,
      statusDefaults.success,
    );
    const warning = safeForeground(
      custom.warning,
      appearance.surface,
      statusDefaults.warning,
    );
    const danger = safeForeground(
      custom.danger,
      appearance.surface,
      statusDefaults.danger,
    );
    const info = safeForeground(
      custom.info || appearance.accent,
      appearance.surface,
      statusDefaults.info,
    );
    const onAccent = safeForeground(
      custom.onAccent,
      appearance.accent,
      readable(appearance.surface, appearance.accent),
    );
    return {
      canvas: safeOverride(custom.canvas, textPrimary, background.color),
      surface: appearance.surface,
      surfaceRaised: safeOverride(
        custom.surfaceRaised,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 92%, ${appearance.text})`,
      ),
      surfaceOverlay: safeOverride(
        custom.surfaceOverlay,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 86%, ${appearance.text})`,
      ),
      surfaceSunken: safeOverride(
        custom.surfaceSunken,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 88%, ${background.color})`,
      ),
      control: safeOverride(
        custom.control,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 90%, ${appearance.text})`,
      ),
      controlHover: safeOverride(
        custom.controlHover,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 84%, ${appearance.text})`,
      ),
      controlActive: safeOverride(
        custom.controlActive,
        textPrimary,
        `color-mix(in srgb, ${appearance.surface} 76%, ${appearance.text})`,
      ),
      textPrimary,
      textSecondary,
      textTertiary: safeForeground(
        custom.textTertiary,
        appearance.surface,
        `color-mix(in srgb, ${textSecondary} 78%, ${appearance.surface})`,
      ),
      accent: appearance.accent,
      onAccent,
      border: appearance.border,
      borderSubtle:
        custom.borderSubtle ||
        `color-mix(in srgb, ${appearance.border} 52%, transparent)`,
      borderStrong:
        custom.borderStrong ||
        `color-mix(in srgb, ${appearance.border} 70%, ${appearance.text})`,
      focus: safeForeground(
        custom.focus || appearance.accent,
        appearance.surface,
        statusDefaults.info,
      ),
      success,
      warning,
      danger,
      info,
      added: safeForeground(custom.added, appearance.surface, success),
      modified: safeForeground(custom.modified, appearance.surface, warning),
      deleted: safeForeground(custom.deleted, appearance.surface, danger),
    };
  };

  const codexColorTokenDeclarations = (palette) => `
    /* Stable semantic roles. Themes never depend on Codex-private tokens. */
    --codex-styler-canvas: ${palette.canvas};
    --codex-styler-surface: ${palette.surface};
    --codex-styler-surface-raised: ${palette.surfaceRaised};
    --codex-styler-surface-overlay: ${palette.surfaceOverlay};
    --codex-styler-surface-sunken: ${palette.surfaceSunken};
    --codex-styler-control: ${palette.control};
    --codex-styler-control-hover: ${palette.controlHover};
    --codex-styler-control-active: ${palette.controlActive};
    --codex-styler-text-primary: ${palette.textPrimary};
    --codex-styler-text-secondary: ${palette.textSecondary};
    --codex-styler-text-tertiary: ${palette.textTertiary};
    --codex-styler-accent: ${palette.accent};
    --codex-styler-on-accent: ${palette.onAccent};
    --codex-styler-border: ${palette.border};
    --codex-styler-border-subtle: ${palette.borderSubtle};
    --codex-styler-border-strong: ${palette.borderStrong};
    --codex-styler-focus: ${palette.focus};
    --codex-styler-success: ${palette.success};
    --codex-styler-warning: ${palette.warning};
    --codex-styler-danger: ${palette.danger};
    --codex-styler-info: ${palette.info};
    --codex-styler-added: ${palette.added};
    --codex-styler-modified: ${palette.modified};
    --codex-styler-deleted: ${palette.deleted};

    /* Codex base palette. */
    --color-background-surface-under: var(--codex-styler-canvas);
    --color-background-surface: var(--codex-styler-surface);
    --color-background-panel: var(--codex-styler-surface-raised);
    --color-background-control: color-mix(in srgb, var(--codex-styler-control) 96%, transparent);
    --color-background-control-opaque: var(--codex-styler-control);
    --color-background-editor-opaque: var(--codex-styler-surface-sunken);
    --color-background-elevated-primary: color-mix(in srgb, var(--codex-styler-surface-overlay) 96%, transparent);
    --color-background-elevated-primary-opaque: var(--codex-styler-surface-overlay);
    --color-background-elevated-secondary: color-mix(in srgb, var(--codex-styler-surface-raised) 72%, transparent);
    --color-background-elevated-secondary-opaque: var(--codex-styler-surface-raised);
    --color-background-button-primary: var(--codex-styler-accent);
    --color-background-button-primary-hover: color-mix(in srgb, var(--codex-styler-accent) 86%, var(--codex-styler-text-primary));
    --color-background-button-primary-active: color-mix(in srgb, var(--codex-styler-accent) 76%, var(--codex-styler-text-primary));
    --color-background-button-primary-inactive: color-mix(in srgb, var(--codex-styler-accent) 42%, transparent);
    --color-background-button-secondary: var(--codex-styler-control);
    --color-background-button-secondary-hover: var(--codex-styler-control-hover);
    --color-background-button-secondary-active: var(--codex-styler-control-active);
    --color-background-button-secondary-inactive: color-mix(in srgb, var(--codex-styler-control) 48%, transparent);
    --color-background-button-tertiary: color-mix(in srgb, var(--codex-styler-control) 44%, transparent);
    --color-background-button-tertiary-hover: var(--codex-styler-control-hover);
    --color-background-button-tertiary-active: var(--codex-styler-control-active);
    --color-text-foreground: var(--codex-styler-text-primary);
    --color-text-foreground-secondary: var(--codex-styler-text-secondary);
    --color-text-foreground-tertiary: var(--codex-styler-text-tertiary);
    --color-text-button-primary: var(--codex-styler-on-accent);
    --color-text-button-secondary: var(--codex-styler-text-primary);
    --color-text-button-tertiary: var(--codex-styler-text-secondary);
    --color-icon-primary: var(--codex-styler-text-primary);
    --color-icon-secondary: var(--codex-styler-text-secondary);
    --color-icon-tertiary: var(--codex-styler-text-tertiary);
    --color-border: var(--codex-styler-border);
    --color-border-light: var(--codex-styler-border-subtle);
    --color-border-heavy: var(--codex-styler-border-strong);
    --color-border-focus: color-mix(in srgb, var(--codex-styler-focus) 76%, transparent);
    --color-simple-scrim: color-mix(in srgb, var(--codex-styler-text-primary) 10%, transparent);

    /* Codex component aliases. */
    --color-token-bg-primary: var(--codex-styler-canvas);
    --color-token-bg-secondary: color-mix(in srgb, var(--codex-styler-surface) 92%, transparent);
    --color-token-bg-tertiary: color-mix(in srgb, var(--codex-styler-surface-raised) 85%, transparent);
    --color-token-bg-appshot: color-mix(in srgb, var(--codex-styler-canvas) 75%, transparent);
    --color-token-bg-fog: color-mix(in srgb, var(--codex-styler-text-primary) 2.5%, transparent);
    --color-token-side-bar-background: var(--codex-styler-canvas);
    --color-token-main-surface-primary: color-mix(in srgb, var(--codex-styler-surface) 88%, transparent);
    --color-token-foreground: var(--codex-styler-text-primary);
    --color-token-text-primary: var(--codex-styler-text-primary);
    --color-token-text-secondary: var(--codex-styler-text-secondary);
    --color-token-text-tertiary: var(--codex-styler-text-tertiary);
    --color-token-description-foreground: var(--codex-styler-text-secondary);
    --color-token-disabled-foreground: var(--codex-styler-text-tertiary);
    --color-token-icon-foreground: var(--codex-styler-text-primary);
    --color-token-border: var(--codex-styler-border);
    --color-token-border-default: var(--codex-styler-border);
    --color-token-border-light: var(--codex-styler-border-subtle);
    --color-token-border-heavy: var(--codex-styler-border-strong);
    --color-token-focus-border: color-mix(in srgb, var(--codex-styler-focus) 76%, transparent);
    --color-token-primary: var(--codex-styler-accent);
    --color-token-on-accent: var(--codex-styler-on-accent);
    --color-token-link: var(--codex-styler-info);
    --color-token-text-link-foreground: var(--codex-styler-info);
    --color-token-text-link-active-foreground: color-mix(in srgb, var(--codex-styler-info) 78%, var(--codex-styler-text-primary));
    --color-token-button-background: var(--codex-styler-accent);
    --color-token-button-foreground: var(--codex-styler-on-accent);
    --color-token-button-border: color-mix(in srgb, var(--codex-styler-accent) 62%, var(--codex-styler-border));
    --color-token-button-secondary-hover-background: var(--codex-styler-control-hover);
    --color-token-input-background: color-mix(in srgb, var(--codex-styler-control) 96%, transparent);
    --color-token-input-border: var(--codex-styler-border-strong);
    --color-token-input-foreground: var(--codex-styler-text-primary);
    --color-token-input-placeholder-foreground: var(--codex-styler-text-tertiary);
    --color-token-checkbox-background: var(--codex-styler-surface-overlay);
    --color-token-checkbox-border: var(--codex-styler-border);
    --color-token-checkbox-foreground: var(--codex-styler-text-primary);
    --color-token-dropdown-background: var(--codex-styler-control);
    --color-token-dropdown-foreground: var(--codex-styler-text-primary);
    --color-token-menu-background: color-mix(in srgb, var(--codex-styler-surface-overlay) 96%, transparent);
    --color-token-menu-border: var(--codex-styler-border);
    --color-token-badge-background: color-mix(in srgb, var(--codex-styler-control) 72%, transparent);
    --color-token-badge-foreground: var(--codex-styler-text-secondary);
    --color-token-list-active-selection-background: color-mix(in srgb, var(--codex-styler-accent) 18%, transparent);
    --color-token-list-active-selection-foreground: var(--codex-styler-text-primary);
    --color-token-list-active-selection-icon-foreground: var(--codex-styler-text-primary);
    --color-token-list-hover-background: color-mix(in srgb, var(--codex-styler-accent) 11%, transparent);
    --color-token-list-focus-outline: color-mix(in srgb, var(--codex-styler-focus) 76%, transparent);
    --color-token-toolbar-hover-background: color-mix(in srgb, var(--codex-styler-accent) 11%, transparent);
    --color-token-menubar-selection-background: color-mix(in srgb, var(--codex-styler-accent) 11%, transparent);
    --color-token-menubar-selection-foreground: var(--codex-styler-text-primary);
    --color-token-scrollbar-slider-background: color-mix(in srgb, var(--codex-styler-text-secondary) 18%, transparent);
    --color-token-scrollbar-slider-hover-background: color-mix(in srgb, var(--codex-styler-text-secondary) 30%, transparent);
    --color-token-scrollbar-slider-active-background: color-mix(in srgb, var(--codex-styler-text-primary) 30%, transparent);
    --color-token-conversation-body: color-mix(in srgb, var(--codex-styler-text-primary) 60%, transparent);
    --color-token-conversation-header: color-mix(in srgb, var(--codex-styler-text-primary) 34%, transparent);
    --color-token-conversation-summary-leading: color-mix(in srgb, var(--codex-styler-text-secondary) 90%, transparent);
    --color-token-conversation-summary-trailing: color-mix(in srgb, var(--codex-styler-text-primary) 46%, transparent);
    --color-token-non-assistant-body-descendant: color-mix(in srgb, var(--codex-styler-text-primary) 54%, transparent);
    --color-token-editor-background: var(--codex-styler-surface-sunken);
    --color-token-editor-widget-background: color-mix(in srgb, var(--codex-styler-surface-overlay) 96%, transparent);
    --color-token-editor-foreground: var(--codex-styler-text-primary);
    --color-token-editor-selection-background: color-mix(in srgb, var(--codex-styler-accent) 28%, transparent);
    --color-token-editor-find-match-background: color-mix(in srgb, var(--codex-styler-accent) 22%, transparent);
    --color-token-editor-find-match-highlight-background: color-mix(in srgb, var(--codex-styler-accent) 28%, transparent);
    --color-token-editor-group-drop-background: color-mix(in srgb, var(--codex-styler-accent) 28%, transparent);
    --color-token-editor-group-drop-into-prompt-background: color-mix(in srgb, var(--codex-styler-accent) 28%, transparent);
    --color-token-editor-group-drop-into-prompt-foreground: var(--codex-styler-text-primary);
    --color-token-text-code-block-background: color-mix(in srgb, var(--codex-styler-control) 72%, transparent);
    --color-token-text-preformat-background: color-mix(in srgb, var(--codex-styler-surface-raised) 72%, transparent);
    --color-token-text-preformat-foreground: var(--codex-styler-text-primary);
    --color-token-diff-surface: color-mix(in srgb, var(--codex-styler-surface) 94%, var(--codex-styler-text-primary));
    --color-token-terminal-background: color-mix(in srgb, var(--codex-styler-surface-sunken) 94%, transparent);
    --color-token-terminal-border: var(--codex-styler-border);
    --color-token-terminal-foreground: var(--codex-styler-text-primary);
    --color-token-terminal-ansi-black: var(--codex-styler-text-tertiary);
    --color-token-terminal-ansi-bright-black: var(--codex-styler-text-secondary);
    --color-token-terminal-ansi-white: var(--codex-styler-text-primary);
    --color-token-terminal-ansi-bright-white: var(--codex-styler-text-primary);
    --color-token-terminal-ansi-blue: var(--codex-styler-info);
    --color-token-terminal-ansi-bright-blue: var(--codex-styler-info);
    --color-token-terminal-ansi-cyan: color-mix(in srgb, var(--codex-styler-info) 78%, var(--codex-styler-success));
    --color-token-terminal-ansi-bright-cyan: color-mix(in srgb, var(--codex-styler-info) 78%, var(--codex-styler-success));
    --color-token-terminal-ansi-green: var(--codex-styler-success);
    --color-token-terminal-ansi-bright-green: var(--codex-styler-success);
    --color-token-terminal-ansi-yellow: var(--codex-styler-warning);
    --color-token-terminal-ansi-bright-yellow: var(--codex-styler-warning);
    --color-token-terminal-ansi-red: var(--codex-styler-danger);
    --color-token-terminal-ansi-bright-red: var(--codex-styler-danger);
    --color-token-terminal-ansi-magenta: var(--codex-styler-accent);
    --color-token-terminal-ansi-bright-magenta: var(--codex-styler-accent);

    /* Functional colors keep their meaning while remaining theme-overridable. */
    --color-accent-blue: var(--codex-styler-info);
    --color-accent-green: var(--codex-styler-success);
    --color-accent-orange: var(--codex-styler-warning);
    --color-accent-red: var(--codex-styler-danger);
    --color-accent-yellow: var(--codex-styler-warning);
    --color-accent-purple: var(--codex-styler-accent);
    --color-text-accent: var(--codex-styler-info);
    --color-text-success: var(--codex-styler-success);
    --color-text-warning: var(--codex-styler-warning);
    --color-text-error: var(--codex-styler-danger);
    --color-text-on-accent: var(--codex-styler-on-accent);
    --color-icon-accent: var(--codex-styler-info);
    --color-icon-success: var(--codex-styler-success);
    --color-icon-warning: var(--codex-styler-warning);
    --color-icon-error: var(--codex-styler-danger);
    --color-border-warning: color-mix(in srgb, var(--codex-styler-warning) 46%, transparent);
    --color-border-error: color-mix(in srgb, var(--codex-styler-danger) 46%, transparent);
    --color-background-accent: color-mix(in srgb, var(--codex-styler-accent) 16%, var(--codex-styler-surface));
    --color-background-accent-hover: color-mix(in srgb, var(--codex-styler-accent) 22%, var(--codex-styler-surface));
    --color-background-accent-active: color-mix(in srgb, var(--codex-styler-accent) 28%, var(--codex-styler-surface));
    --color-background-status-success: color-mix(in srgb, var(--codex-styler-success) 16%, var(--codex-styler-surface));
    --color-background-status-warning: color-mix(in srgb, var(--codex-styler-warning) 16%, var(--codex-styler-surface));
    --color-background-status-error: color-mix(in srgb, var(--codex-styler-danger) 16%, var(--codex-styler-surface));
    --color-background-danger-active: color-mix(in srgb, var(--codex-styler-danger) 30%, transparent);
    --color-decoration-added: var(--codex-styler-added);
    --color-decoration-modified: var(--codex-styler-modified);
    --color-decoration-deleted: var(--codex-styler-deleted);
    --color-decoration-unchanged: var(--codex-styler-border-strong);
    --color-editor-added: color-mix(in srgb, var(--codex-styler-added) 23%, transparent);
    --color-editor-deleted: color-mix(in srgb, var(--codex-styler-deleted) 23%, transparent);
    --color-token-error-foreground: var(--codex-styler-danger);
    --color-token-editor-error-foreground: var(--codex-styler-danger);
    --color-token-editor-warning-foreground: var(--codex-styler-warning);
    --color-token-diff-editor-inserted-line-background: color-mix(in srgb, var(--codex-styler-added) 23%, transparent);
    --color-token-diff-editor-removed-line-background: color-mix(in srgb, var(--codex-styler-deleted) 23%, transparent);
    --color-token-diff-editor-removed-text-background: color-mix(in srgb, var(--codex-styler-deleted) 30%, transparent);
    --color-token-git-decoration-added-resource-foreground: var(--codex-styler-added);
    --color-token-git-decoration-untracked-resource-foreground: var(--codex-styler-added);
    --color-token-git-decoration-modified-resource-foreground: var(--codex-styler-modified);
    --color-token-git-decoration-renamed-resource-foreground: var(--codex-styler-modified);
    --color-token-git-decoration-ignored-resource-foreground: var(--codex-styler-text-tertiary);
    --color-token-git-decoration-deleted-resource-foreground: var(--codex-styler-deleted);
    --color-token-input-validation-info-background: color-mix(in srgb, var(--codex-styler-info) 16%, var(--codex-styler-surface));
    --color-token-input-validation-warning-background: color-mix(in srgb, var(--codex-styler-warning) 16%, var(--codex-styler-surface));
    --color-token-input-validation-warning-border: color-mix(in srgb, var(--codex-styler-warning) 46%, transparent);
    --color-token-input-validation-error-background: color-mix(in srgb, var(--codex-styler-danger) 16%, var(--codex-styler-surface));
    --color-token-input-validation-error-border: color-mix(in srgb, var(--codex-styler-danger) 46%, transparent);
    --color-token-charts-blue: var(--codex-styler-info);
    --color-token-charts-green: var(--codex-styler-success);
    --color-token-charts-orange: var(--codex-styler-warning);
    --color-token-charts-red: var(--codex-styler-danger);
    --color-token-charts-yellow: var(--codex-styler-warning);
    --color-token-charts-purple: var(--codex-styler-accent);
    --color-token-activity-bar-badge-background: var(--codex-styler-accent);
    --color-token-activity-bar-badge-foreground: var(--codex-styler-on-accent);
    --color-token-progress-bar-background: var(--codex-styler-accent);
    --color-token-radio-active-foreground: var(--codex-styler-on-accent);
    --color-token-radio-inactive-border: var(--codex-styler-border-strong);
  `;

  const installStyles = (theme, variant, safeMode) => {
    const visual = theme.variants[variant];
    const { appearance, background } = visual;
    const protectedText = readable(appearance.text, appearance.surface);
    const protectedOpacity = background.image
      ? Math.max(0.72, appearance.surfaceOpacity)
      : appearance.surfaceOpacity;
    const surfacePercent = Math.round(protectedOpacity * 100);
    const quietSurfacePercent = background.image
      ? Math.max(64, Math.round(surfacePercent * 0.78))
      : Math.max(38, Math.round(surfacePercent * 0.62));
    const strongSurfacePercent = Math.min(94, Math.max(58, surfacePercent));
    const accentText = readable(appearance.surface, appearance.accent);
    const palette = semanticPalette(appearance, background, variant);
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const semantic = safeMode
      ? ""
      : `
        html[data-codex-styler][data-codex-styler-mode="semantic"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] {
          color-scheme: ${variant};
          ${codexColorTokenDeclarations(palette)}
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] {
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
          overflow: clip !important;
          color: ${protectedText} !important;
          background: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, transparent) !important;
          border: 1px solid color-mix(in srgb, ${appearance.border} 84%, transparent) !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: saturate(1.04) blur(${Math.max(2, Math.round(appearance.focusBlur * 0.35))}px) !important;
          transition: margin 180ms ease, border-radius 180ms ease, box-shadow 180ms ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-layout="native"] main.main-surface {
          margin: 0 !important;
          border-color: color-mix(in srgb, ${appearance.border} 48%, transparent) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-layout="editorial"] main.main-surface {
          margin: 7px 8px 8px 6px !important;
          border-radius: ${Math.max(12, appearance.radius + 4)}px !important;
          box-shadow: 0 18px 48px rgb(0 0 0 / 13%), inset 0 1px color-mix(in srgb, ${protectedText} 5%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-layout="immersive"] main.main-surface {
          margin: 10px 12px 12px 9px !important;
          border-radius: ${Math.max(18, appearance.radius + 10)}px !important;
          background: color-mix(in srgb, ${appearance.surface} ${Math.max(50, quietSurfacePercent - 8)}%, transparent) !important;
          box-shadow: 0 26px 72px rgb(0 0 0 / 18%), inset 0 1px color-mix(in srgb, ${protectedText} 7%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-layout="editorial"] main.main-surface [role="main"] {
          --thread-content-max-width: min(920px, calc(100cqw - 48px)) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-layout="immersive"] main.main-surface [role="main"] {
          --thread-content-max-width: min(1040px, calc(100cqw - 40px)) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="task"] main.main-surface {
          background-blend-mode: normal !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] main.main-surface > header:not(.app-header-tint) {
          background: color-mix(in srgb, ${appearance.surface} ${Math.min(90, strongSurfacePercent + 4)}%, transparent) !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: blur(${appearance.focusBlur}px) !important;
        }
        /* Codex intentionally layers docked-panel tabs above this fixed tint.
           An opaque injected tint paints over those tabs even though they
           remain present and interactive in the DOM. */
        html[data-codex-styler][data-codex-styler-mode="semantic"] header.app-header-tint {
          background: transparent !important;
          border-color: transparent !important;
          backdrop-filter: none !important;
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

        /* Icon treatments preserve every native SVG dimension and padding. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] aside.app-shell-left-panel button > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] [data-pip-obstacle="thread-summary-panel"] button > svg:first-child {
          color: ${appearance.accent} !important;
          filter: drop-shadow(0 2px 5px color-mix(in srgb, ${appearance.accent} 22%, transparent));
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] aside.app-shell-left-panel button > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] [data-pip-obstacle="thread-summary-panel"] button > svg:first-child {
          color: color-mix(in srgb, ${appearance.accent} 86%, ${protectedText}) !important;
          stroke-width: 2.25px;
          filter: drop-shadow(0 3px 7px color-mix(in srgb, ${appearance.accent} 34%, transparent));
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
          min-height: clamp(190px, 30cqh, 238px) !important;
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
          min-height: clamp(210px, 34cqh, 270px) !important;
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
          font-size: clamp(20px, min(2vw, 3.6cqh), 29px) !important;
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
          min-height: clamp(96px, 14cqh, 118px) !important;
          padding: clamp(12px, 1.8cqh, 15px) !important;
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
          /* Codex intentionally tucks the rail shell behind the composer.
             Keep its lower safe area so the interactive row never follows. */
          padding: clamp(26px, 4cqh, 32px) 10px 27px !important;
          border: 1px solid color-mix(in srgb, ${appearance.accent} 14%, ${appearance.border}) !important;
          border-bottom: 0 !important;
          border-radius: ${Math.max(14, appearance.radius + 3)}px ${Math.max(14, appearance.radius + 3)}px 0 0;
          background: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
          backdrop-filter: blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector)::before {
          content: "WORKSPACE";
          position: absolute;
          top: clamp(8px, 1.25cqh, 10px);
          left: 14px;
          color: ${appearance.accent};
          font: 700 10px/1 system-ui, sans-serif;
          letter-spacing: .15em;
          pointer-events: none;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-density="compact"] .group\\/home-suggestions button {
          min-height: 88px !important;
          padding: 11px 12px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-density="compact"] .group\\/home-suggestions button:hover {
          transform: translateY(-2px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-density="compact"] [data-feature="game-source"] {
          font-size: clamp(18px, 3.2cqh, 24px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-density="compact"] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector) {
          padding-top: 24px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-density="compact"] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector)::before {
          top: 7px;
          font-size: 9px;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-collision-guard] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector) {
          padding-top: 8px !important;
          padding-bottom: 27px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"][data-codex-styler-collision-guard] div:has(> .horizontal-scroll-fade-mask .group\\/project-selector)::before {
          display: none;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome {
          position: relative;
          overflow: visible !important;
          border-width: 1px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] main.main-surface {
          box-shadow: inset 0 1px color-mix(in srgb, ${appearance.accent} 14%, transparent), 0 14px 38px rgb(0 0 0 / 10%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] .composer-surface-chrome {
          border-color: color-mix(in srgb, ${appearance.accent} 30%, ${appearance.border}) !important;
          box-shadow: 0 12px 32px rgb(0 0 0 / 11%), 0 0 0 2px color-mix(in srgb, ${appearance.accent} 5%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] main.main-surface {
          border-color: color-mix(in srgb, ${appearance.accent} 34%, ${appearance.border}) !important;
          box-shadow: 0 26px 72px rgb(0 0 0 / 18%), inset 0 2px color-mix(in srgb, ${appearance.accent} 24%, transparent), 0 0 0 3px color-mix(in srgb, ${appearance.accent} 6%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] main.main-surface > header,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] header.app-header-tint {
          border-bottom-color: color-mix(in srgb, ${appearance.accent} 36%, ${appearance.border}) !important;
          box-shadow: inset 0 -1px color-mix(in srgb, ${appearance.accent} 12%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] .composer-surface-chrome {
          border-color: color-mix(in srgb, ${appearance.accent} 54%, ${appearance.border}) !important;
          box-shadow: 0 16px 42px rgb(0 0 0 / 18%), 0 0 0 3px color-mix(in srgb, ${appearance.accent} 9%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="task"] [data-message-author-role="user"] {
          border-left: 3px solid ${appearance.accent} !important;
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
      /* The marked application root stays above the backdrop even when Codex
         prepends transient popover portals and changes direct-child ordering. */
      html[data-codex-styler] body > [${APP_ROOT_ATTRIBUTE}] {
        position: relative; z-index: 1;
      }
      html[data-codex-styler] body > [${OVERLAY_ROOT_ATTRIBUTE}][${UNLAYERED_ROOT_ATTRIBUTE}] {
        z-index: 11;
      }
      html[data-codex-styler] body > [${OVERLAY_ROOT_ATTRIBUTE}][${STATIC_ROOT_ATTRIBUTE}] {
        position: relative;
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
        position: fixed; inset: 0; z-index: 10; pointer-events: none;
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
    const settings =
      !document.querySelector("aside.app-shell-left-panel") &&
      !document.querySelector("main.main-surface") &&
      document.querySelector(
        `body > [${APP_ROOT_ATTRIBUTE}] .main-surface`,
      );
    document.documentElement.setAttribute(
      "data-codex-styler-page",
      home ? "home" : settings ? "settings" : "task",
    );
  };

  const updateResponsiveLayout = () => {
    const root = document.documentElement;
    if (root.getAttribute("data-codex-styler-page") !== "home") {
      root.removeAttribute("data-codex-styler-density");
      root.removeAttribute("data-codex-styler-collision-guard");
      return;
    }

    const hero = document.querySelector('[data-feature="game-source"]');
    const homeMain = hero?.closest('[role="main"]');
    const compact = Boolean(
      homeMain && (homeMain.clientHeight < 680 || homeMain.clientWidth < 720),
    );
    if (compact) root.setAttribute("data-codex-styler-density", "compact");
    else root.removeAttribute("data-codex-styler-density");

    if (!root.hasAttribute("data-codex-styler-collision-guard")) {
      const project = document.querySelector(".group\\/project-selector");
      const composer = document.querySelector(".composer-surface-chrome");
      if (project && composer) {
        const projectBounds = project.getBoundingClientRect();
        const composerBounds = composer.getBoundingClientRect();
        if (projectBounds.bottom > composerBounds.top - 4) {
          root.setAttribute("data-codex-styler-collision-guard", "");
        }
      }
    }
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

    const pageSources =
      renderer.type === "sprite-atlas" && renderer.pages?.length
        ? renderer.pages
        : [renderer.asset];
    const context = canvas.getContext("2d");
    const targetFps = Math.min(
      60,
      Math.max(
        12,
        renderer.transitionFps ||
          theme.variants[variant].motion?.targetFps ||
          30,
      ),
    );
    const frameInterval = 1000 / targetFps;
    const analyses = new Map();
    const pageCache = new Map();
    let pageUseCounter = 0;
    let frame = renderer.neutralFrame ?? 0;
    let pendingFrame = frame;
    let lastDraw = 0;

    const loadPage = (pageIndex) => {
      if (pageIndex < 0 || pageIndex >= pageSources.length) return null;
      const cached = pageCache.get(pageIndex);
      if (cached) {
        cached.lastUsed = ++pageUseCounter;
        return cached.image;
      }
      const image = new Image();
      image.decoding = "async";
      const entry = { image, lastUsed: ++pageUseCounter };
      pageCache.set(pageIndex, entry);
      image.addEventListener("load", () => scheduleDraw(), { once: true });
      image.src = pageSources[pageIndex];
      if (pageCache.size > 2) {
        const oldest = [...pageCache.entries()]
          .filter(([index]) => index !== pageIndex)
          .sort(([, left], [, right]) => left.lastUsed - right.lastUsed)[0];
        if (oldest) {
          oldest[1].image.removeAttribute("src");
          pageCache.delete(oldest[0]);
          analyses.delete(oldest[0]);
        }
      }
      return image;
    };

    const draw = (timestamp = performance.now()) => {
      const framesPerPage =
        renderer.type === "sprite-atlas"
          ? renderer.framesPerPage ?? renderer.columns * renderer.rows
          : 1;
      const pageIndex = Math.floor(pendingFrame / framesPerPage);
      const image = loadPage(pageIndex) ?? loadPage(0);
      if (!context || !image.complete || !image.naturalWidth) {
        animationFrame = null;
        return;
      }
      if (timestamp - lastDraw < frameInterval) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }
      frame = pendingFrame;
      const localFrame = frame % framesPerPage;
      const column =
        renderer.type === "sprite-atlas"
          ? localFrame % renderer.columns
          : 0;
      const row =
        renderer.type === "sprite-atlas"
          ? Math.floor(localFrame / renderer.columns)
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
        if (!analyses.has(pageIndex)) {
          analyses.set(pageIndex, analyzeOpaqueFrames(image, renderer));
        }
      }
      const analysis = analyses.get(pageIndex) ?? null;
      if (analysis && renderer.normalization === "grounded") {
        const opaque = analysis.bounds[localFrame] ?? analysis.bounds[0];
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
      const adjacentPage =
        pageIndex + 1 < pageSources.length ? pageIndex + 1 : pageIndex - 1;
      if (document.visibilityState === "visible") loadPage(adjacentPage);
    };
    const scheduleDraw = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    const initialFramesPerPage =
      renderer.type === "sprite-atlas"
        ? renderer.framesPerPage ?? renderer.columns * renderer.rows
        : 1;
    loadPage(Math.floor(pendingFrame / initialFramesPerPage));
    scheduleDraw();

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const directionalPoses =
      renderer.type !== "sprite-atlas"
        ? []
        : renderer.poses?.length
          ? renderer.poses
          : renderer.frameAngles?.length === renderer.directions
            ? renderer.frameAngles.map((angle, index) => ({
                id: `legacy-${index}`,
                angle: angle >= 360 ? 359.9999 : angle,
                frame: index,
              }))
            : Array.from({ length: renderer.directions }, (_, index) => ({
                id: `linear-${index}`,
                angle: (index / renderer.directions) * 360,
                frame: index,
              }));
    let activePose = directionalPoses[0] ?? null;
    let smoothedDirection = null;
    let idleTimer = null;
    let idleGeneration = 0;

    const cancelIdle = () => {
      idleGeneration += 1;
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = null;
    };

    const scheduleIdle = (pose) => {
      cancelIdle();
      if (
        reduced ||
        document.visibilityState !== "visible" ||
        renderer.type !== "sprite-atlas" ||
        !pose ||
        !Array.isArray(renderer.idleClips)
      ) {
        return;
      }
      const clips = renderer.idleClips.filter((clip) =>
        clip.poseIds.includes(pose.id),
      );
      if (clips.length === 0) return;
      const clip = clips[Math.floor(Math.random() * clips.length)];
      const delay =
        clip.minimumDelayMs +
        Math.random() * (clip.maximumDelayMs - clip.minimumDelayMs);
      const generation = idleGeneration;
      idleTimer = window.setTimeout(() => {
        const play = (index) => {
          if (
            generation !== idleGeneration ||
            document.visibilityState !== "visible"
          ) {
            return;
          }
          const item = clip.frames[index];
          if (!item) {
            pendingFrame = pose.frame;
            scheduleDraw();
            scheduleIdle(pose);
            return;
          }
          pendingFrame = item.frame;
          scheduleDraw();
          idleTimer = window.setTimeout(() => play(index + 1), item.durationMs);
        };
        play(0);
      }, delay);
    };

    if (reduced && renderer.type === "sprite-atlas") {
      pendingFrame = renderer.reducedMotionFrame ?? renderer.neutralFrame ?? 0;
      scheduleDraw();
    }
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
        const degrees = (normalized * 180) / Math.PI;
        const responsiveness = renderer.followSmoothing ?? 0.18;
        if (smoothedDirection === null) {
          smoothedDirection = degrees;
        } else {
          const currentRadians = (smoothedDirection * Math.PI) / 180;
          const nextRadians = (degrees * Math.PI) / 180;
          const x =
            Math.cos(currentRadians) * (1 - responsiveness) +
            Math.cos(nextRadians) * responsiveness;
          const y =
            Math.sin(currentRadians) * (1 - responsiveness) +
            Math.sin(nextRadians) * responsiveness;
          smoothedDirection =
            ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        }
        let closest = directionalPoses[0];
        let closestDistance = Number.POSITIVE_INFINITY;
        directionalPoses.forEach((pose) => {
            const rawDistance = Math.abs(pose.angle - smoothedDirection);
            const distance = Math.min(rawDistance, 360 - rawDistance);
            if (distance < closestDistance) {
              closest = pose;
              closestDistance = distance;
            }
        });
        cancelIdle();
        activePose = closest;
        pendingFrame = closest.frame;
        scheduleDraw();
        scheduleIdle(closest);
      };
      window.addEventListener("pointermove", pointerHandler, { passive: true });
    }
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        cancelIdle();
        return;
      }
      scheduleDraw();
      scheduleIdle(activePose);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    resizeHandler = () => {
      position();
      scheduleDraw();
    };
    window.addEventListener("resize", resizeHandler, { passive: true });
    entityCleanup = () => {
      cancelIdle();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const entry of pageCache.values()) entry.image.removeAttribute("src");
      pageCache.clear();
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
    if (!document.getElementById(STYLE_ID)) {
      return { ok: false, reason: "runtime stylesheet was removed" };
    }
    const appRoot = document.querySelector(
      `body > [${APP_ROOT_ATTRIBUTE}]`,
    );
    if (!appRoot) {
      return { ok: false, reason: "application root was not found" };
    }
    if (!sidebar || !main) {
      const alternateSurface = appRoot.querySelector(
        '.main-surface, [role="dialog"], [role="alertdialog"]',
      );
      if (alternateSurface || appRoot.childElementCount > 0) {
        return { ok: true, reason: null };
      }
      return {
        ok: false,
        reason: "a visible application surface was not found",
      };
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
    updateStackingRoots();
    installStyles(theme, variant, Boolean(safeMode));
    updatePageKind();
    updateResponsiveLayout();

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
    layoutResizeHandler = () => updateResponsiveLayout();
    window.addEventListener("resize", layoutResizeHandler, { passive: true });

    activeState = {
      theme,
      variant,
      safeMode: Boolean(safeMode),
      requestedMode,
      resolvedMode,
    };
    mutationObserver = new MutationObserver(() => {
      updateStackingRoots();
      updatePageKind();
      updateResponsiveLayout();
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

  const updateEntity = (entity, revision = latestRevision + 1) => {
    if (!Number.isInteger(revision) || revision < 0) {
      throw new Error("Codex Styler rejected an invalid configuration revision");
    }
    if (revision < latestRevision) {
      return { ok: true, stale: true, revision: latestRevision };
    }
    if (!activeState) {
      throw new Error("A theme must be active before updating its companion");
    }
    latestRevision = revision;
    const theme = JSON.parse(JSON.stringify(activeState.theme));
    theme.scene.entities = entity ? [entity] : [];
    assertSafeTheme(theme, activeState.variant);
    activeState.theme = theme;
    removeEntity();
    const entityRoot = document.createElement("div");
    entityRoot.id = ENTITY_ID;
    entityRoot.setAttribute("aria-hidden", "true");
    document.body.appendChild(entityRoot);
    installEntity(entityRoot, theme, activeState.variant);
    return { ok: true, stale: false, revision };
  };

  const apply = async (
    theme,
    variant,
    compatibilityMode = "auto",
    revision = latestRevision + 1,
  ) => {
    assertSafeTheme(theme, variant);
    if (!Number.isInteger(revision) || revision < 0) {
      throw new Error("Codex Styler rejected an invalid configuration revision");
    }
    if (revision < latestRevision) {
      return {
        ok: true,
        stale: true,
        revision: latestRevision,
        themeId: theme.id,
        requestedMode: compatibilityMode,
        resolvedMode: activeState?.resolvedMode ?? "compatibility",
        reason: null,
      };
    }
    latestRevision = revision;
    if (!["auto", "compatibility", "developer"].includes(compatibilityMode)) {
      throw new Error("Codex Styler rejected an invalid runtime strategy");
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
    if (revision !== latestRevision) {
      return {
        ok: true,
        stale: true,
        revision: latestRevision,
        themeId: theme.id,
        requestedMode: compatibilityMode,
        resolvedMode,
        reason: null,
      };
    }
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
    version: 15,
    apply,
    updateEntity,
    pause: remove,
    restore: remove,
  };
})();
