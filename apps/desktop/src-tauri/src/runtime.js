(() => {
  if (window.__CODEX_STYLER_RUNTIME__?.version === 36) return;
  window.__CODEX_STYLER_RUNTIME__?.restore?.();

  const BACKDROP_ID = "codex-styler-scene-root";
  const ENTITY_ID = "codex-styler-entity-root";
  const STYLE_ID = "codex-styler-runtime-style";
  const CONTRAST_REPAIR_STYLE_ID = "codex-styler-contrast-repair-style";
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
  let scenePointerHandler = null;
  let sceneResetHandler = null;
  let sceneAnimationFrame = null;
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

  const ENTITY_SAFE_INSET = 8;
  const clampEntityCenter = (value, extent, viewportExtent) => {
    const viewport = Math.max(0, viewportExtent);
    const halfExtent = Math.max(0, extent) / 2;
    const minimum = ENTITY_SAFE_INSET + halfExtent;
    const maximum = viewport - ENTITY_SAFE_INSET - halfExtent;
    if (minimum > maximum) return viewport / 2;
    return Math.max(minimum, Math.min(maximum, value));
  };
  const safeFreeEntityPosition = (
    x,
    y,
    width,
    height,
    viewportWidth,
    viewportHeight,
  ) => ({
    x: clampEntityCenter(x, width, viewportWidth),
    y: clampEntityCenter(y, height, viewportHeight),
  });
  const safeAttachedEntityPosition = (
    target,
    attachment,
    width,
    height,
    viewportWidth,
    viewportHeight,
  ) => {
    const rawY =
      (attachment.edge === "bottom" ? target.bottom : target.top) +
      attachment.offset.y;
    const minimumY =
      attachment.edge === "top"
        ? ENTITY_SAFE_INSET + height
        : ENTITY_SAFE_INSET;
    const maximumY =
      attachment.edge === "top"
        ? viewportHeight - ENTITY_SAFE_INSET
        : viewportHeight - ENTITY_SAFE_INSET - height;
    const y =
      minimumY > maximumY
        ? attachment.edge === "top"
          ? viewportHeight - ENTITY_SAFE_INSET
          : ENTITY_SAFE_INSET
        : Math.max(minimumY, Math.min(maximumY, rawY));
    return {
      x: clampEntityCenter(
        target.left + target.width * attachment.align + attachment.offset.x,
        width,
        viewportWidth,
      ),
      y,
    };
  };

  const resolveMaterialCharacter = (appearance) => {
    const opacity = Math.min(
      appearance.surfaceOpacity,
      appearance.focusOpacity,
    );
    if (appearance.focusBlur <= 4 && opacity >= 0.93) return "solid";
    if (appearance.focusBlur >= 16 || opacity <= 0.82) return "frosted";
    return "layered";
  };

  // Keep these thresholds aligned with resolveThemeMotionProfile in the
  // desktop preview. Motion may change paint and transform only; it must not
  // alter Codex layout measurements or hit targets.
  const resolveMotionProfile = (intensity) => {
    const normalized = Math.max(0, Math.min(1, intensity));
    if (normalized <= 0.05) {
      return {
        character: "still",
        duration: 0,
        lift: 0,
        pressScale: 1,
        overlayOpacity: 1,
      };
    }
    if (normalized < 0.4) {
      return {
        character: "calm",
        duration: 140,
        lift: 1,
        pressScale: 0.995,
        overlayOpacity: 0.96,
      };
    }
    if (normalized < 0.72) {
      return {
        character: "fluid",
        duration: 190,
        lift: 2,
        pressScale: 0.99,
        overlayOpacity: 0.9,
      };
    }
    return {
      character: "expressive",
      duration: 240,
      lift: 3,
      pressScale: 0.985,
      overlayOpacity: 0.84,
    };
  };

  const rgb = (hex) =>
    [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const toHex = (channels) =>
    `#${channels
      .map((value) =>
        Math.max(0, Math.min(255, Math.round(value)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
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
  const mix = (from, to, amount) => {
    const start = rgb(from);
    const end = rgb(to);
    const progress = Math.max(0, Math.min(1, amount));
    return toHex(
      start.map((value, index) => value + (end[index] - value) * progress),
    );
  };
  const composite = (foreground, background, opacity) =>
    mix(background, foreground, opacity);
  const adjustBrightness = (color, brightness) =>
    toHex(rgb(color).map((value) => value * Math.max(0, brightness)));
  const cssColorToHex = (value) => {
    if (typeof value !== "string") return null;
    if (HEX.test(value)) return value;
    const match = value.match(
      /^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/i,
    );
    return match
      ? toHex([Number(match[1]), Number(match[2]), Number(match[3])])
      : null;
  };
  const minimumContrast = (foreground, backgrounds) =>
    Math.min(
      ...backgrounds.map((background) => contrast(foreground, background)),
    );
  const readable = (preferred, backgrounds, minimum = 4.5) => {
    const samples = Array.isArray(backgrounds) ? backgrounds : [backgrounds];
    if (minimumContrast(preferred, samples) >= minimum) return preferred;
    const candidates = ["#151515", "#f7f7f5", "#000000", "#ffffff", "#767676"]
      .filter((anchor) => minimumContrast(anchor, samples) >= minimum)
      .map((anchor) => {
        let low = 0;
        let high = 1;
        for (let iteration = 0; iteration < 18; iteration += 1) {
          const middle = (low + high) / 2;
          if (
            minimumContrast(mix(preferred, anchor, middle), samples) >= minimum
          ) {
            high = middle;
          } else {
            low = middle;
          }
        }
        return { color: mix(preferred, anchor, high), change: high };
      })
      .sort((left, right) => left.change - right.change);
    if (candidates[0]) return candidates[0].color;

    let best = preferred;
    let bestRatio = minimumContrast(preferred, samples);
    for (let value = 0; value <= 255; value += 1) {
      const gray = toHex([value, value, value]);
      const ratio = minimumContrast(gray, samples);
      if (ratio > bestRatio) {
        best = gray;
        bestRatio = ratio;
      }
    }
    return best;
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
      !finiteBetween(appearance.focusOpacity, 0, 1) ||
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
    const layers = theme.scene?.layers;
    if (!Array.isArray(layers) || layers.length > 8) {
      throw new Error("Codex Styler rejected an invalid scene layer list");
    }
    layers.forEach((layer) => {
      if (
        !layer ||
        !["image", "gradient", "vignette"].includes(layer.type) ||
        !finiteBetween(layer.opacity, 0, 1) ||
        !finiteBetween(layer.parallax, -30, 30) ||
        !["normal", "multiply", "screen", "overlay", "soft-light"].includes(
          layer.blendMode,
        )
      ) {
        throw new Error("Codex Styler rejected invalid scene layer data");
      }
      assertSafeImage(layer.asset);
    });
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
    if (scenePointerHandler)
      window.removeEventListener("pointermove", scenePointerHandler);
    if (sceneResetHandler) {
      window.removeEventListener("blur", sceneResetHandler);
      document.removeEventListener("pointerleave", sceneResetHandler, true);
    }
    if (sceneAnimationFrame !== null) cancelAnimationFrame(sceneAnimationFrame);
    scenePointerHandler = null;
    sceneResetHandler = null;
    sceneAnimationFrame = null;
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
    document.getElementById(CONTRAST_REPAIR_STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-codex-styler");
    document.documentElement.removeAttribute("data-codex-styler-mode");
    document.documentElement.removeAttribute("data-codex-styler-fallback");
    document.documentElement.removeAttribute("data-codex-styler-page");
    document.documentElement.removeAttribute("data-codex-styler-layout");
    document.documentElement.removeAttribute("data-codex-styler-icons");
    document.documentElement.removeAttribute("data-codex-styler-decorations");
    document.documentElement.removeAttribute("data-codex-styler-geometry");
    document.documentElement.removeAttribute("data-codex-styler-material");
    document.documentElement.removeAttribute("data-codex-styler-typography");
    document.documentElement.removeAttribute("data-codex-styler-motion");
    document.documentElement.removeAttribute("data-codex-styler-variant");
    document.documentElement.removeAttribute("data-codex-styler-contrast");
    document.documentElement.removeAttribute(
      "data-codex-styler-contrast-repair",
    );
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

  const hasImageBackdrop = (theme, variant) =>
    Boolean(
      theme.variants[variant].background.image ||
      theme.scene.layers.some(
        (layer) =>
          layer.type === "image" && Boolean(layer.asset) && layer.opacity > 0,
      ),
    );

  const surfaceSamples = (surface, backdrops, opacity) =>
    backdrops.map((backdrop) => composite(surface, backdrop, opacity));

  const resolveContrastSystem = (theme, variant) => {
    const visual = theme.variants[variant];
    const { appearance, background } = visual;
    const imageBacked = hasImageBackdrop(theme, variant);
    const backdropRange = imageBacked
      ? ["#000000", "#ffffff"]
      : [adjustBrightness(background.color, background.brightness)];
    const backdrops = backdropRange.map((sample) =>
      composite(background.overlay, sample, background.overlayOpacity),
    );
    const authoredSurfaceOpacity = imageBacked
      ? Math.max(0.72, appearance.surfaceOpacity)
      : appearance.surfaceOpacity;
    let quietSurfaceOpacity = imageBacked
      ? Math.max(0.64, authoredSurfaceOpacity * 0.78)
      : Math.max(0.38, authoredSurfaceOpacity * 0.62);
    let quietBackgrounds = surfaceSamples(
      appearance.surface,
      backdrops,
      quietSurfaceOpacity,
    );
    let textPrimary = readable(appearance.text, quietBackgrounds);
    let textSecondary = readable(appearance.mutedText, quietBackgrounds);

    while (
      quietSurfaceOpacity < 0.96 &&
      (minimumContrast(textPrimary, quietBackgrounds) < 4.5 ||
        minimumContrast(textSecondary, quietBackgrounds) < 4.5)
    ) {
      quietSurfaceOpacity = Math.min(0.96, quietSurfaceOpacity + 0.02);
      quietBackgrounds = surfaceSamples(
        appearance.surface,
        backdrops,
        quietSurfaceOpacity,
      );
      textPrimary = readable(appearance.text, quietBackgrounds);
      textSecondary = readable(appearance.mutedText, quietBackgrounds);
    }

    const strongSurfaceOpacity = Math.min(
      0.98,
      Math.max(
        authoredSurfaceOpacity,
        appearance.focusOpacity,
        quietSurfaceOpacity + (imageBacked ? 0.12 : 0.08),
      ),
    );
    const strongBackgrounds = surfaceSamples(
      appearance.surface,
      backdrops,
      strongSurfaceOpacity,
    );
    const semanticBackgrounds = [
      ...quietBackgrounds,
      ...strongBackgrounds,
      appearance.surface,
    ];
    textPrimary = readable(appearance.text, semanticBackgrounds);
    textSecondary = readable(appearance.mutedText, semanticBackgrounds);
    const textTertiary = readable(
      appearance.palette?.textTertiary || appearance.mutedText,
      semanticBackgrounds,
      3,
    );
    return {
      hasImageBackdrop: imageBacked,
      quietSurfaceOpacity,
      strongSurfaceOpacity,
      quietBackgrounds,
      strongBackgrounds,
      textPrimary,
      textSecondary,
      textTertiary,
      tone:
        minimumContrast("#ffffff", quietBackgrounds) >=
        minimumContrast("#000000", quietBackgrounds)
          ? "light"
          : "dark",
    };
  };

  const resolveEmergencyContrastSystem = (theme, variant) => {
    const visual = theme.variants[variant];
    const { appearance, background } = visual;
    const imageBacked = hasImageBackdrop(theme, variant);
    const backdropRange = imageBacked
      ? ["#000000", "#ffffff"]
      : [adjustBrightness(background.color, background.brightness)];
    const backdrops = backdropRange.map((sample) =>
      composite(background.overlay, sample, background.overlayOpacity),
    );
    const quietSurfaceOpacity = imageBacked ? 0.96 : 0.94;
    const strongSurfaceOpacity = 0.99;
    const quietBackgrounds = surfaceSamples(
      appearance.surface,
      backdrops,
      quietSurfaceOpacity,
    );
    const strongBackgrounds = surfaceSamples(
      appearance.surface,
      backdrops,
      strongSurfaceOpacity,
    );
    const semanticBackgrounds = [
      ...quietBackgrounds,
      ...strongBackgrounds,
      appearance.surface,
    ];
    return {
      quietSurfaceOpacity,
      strongSurfaceOpacity,
      quietBackgrounds,
      strongBackgrounds,
      textPrimary: readable(appearance.text, semanticBackgrounds),
      textSecondary: readable(appearance.mutedText, semanticBackgrounds),
      textTertiary: readable(
        appearance.palette?.textTertiary || appearance.mutedText,
        semanticBackgrounds,
        3,
      ),
    };
  };

  const installContrastRepair = () => {
    if (!activeState?.theme || !activeState?.variant) return false;
    const { theme, variant } = activeState;
    const appearance = theme.variants[variant].appearance;
    const repair = resolveEmergencyContrastSystem(theme, variant);
    const quietSurfacePercent = Math.round(repair.quietSurfaceOpacity * 100);
    const strongSurfacePercent = Math.round(repair.strongSurfaceOpacity * 100);
    document.getElementById(CONTRAST_REPAIR_STYLE_ID)?.remove();
    const style = document.createElement("style");
    style.id = CONTRAST_REPAIR_STYLE_ID;
    style.textContent = `
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] body,
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] body > [${APP_ROOT_ATTRIBUTE}] {
        --codex-styler-text-primary: ${repair.textPrimary} !important;
        --codex-styler-text-secondary: ${repair.textSecondary} !important;
        --codex-styler-text-tertiary: ${repair.textTertiary} !important;
        --color-text-foreground: ${repair.textPrimary} !important;
        --color-text-foreground-secondary: ${repair.textSecondary} !important;
        --color-text-foreground-tertiary: ${repair.textTertiary} !important;
        --color-token-foreground: ${repair.textPrimary} !important;
        --color-token-foreground-secondary: ${repair.textSecondary} !important;
        --color-token-foreground-tertiary: ${repair.textTertiary} !important;
        --color-token-text-primary: ${repair.textPrimary} !important;
        --color-token-text-secondary: ${repair.textSecondary} !important;
        --color-token-text-tertiary: ${repair.textTertiary} !important;
        --color-token-description-foreground: ${repair.textSecondary} !important;
        --color-token-disabled-foreground: ${repair.textTertiary} !important;
        --color-token-input-foreground: ${repair.textPrimary} !important;
        --color-token-input-placeholder-foreground: ${repair.textTertiary} !important;
        --color-token-icon-foreground: ${repair.textPrimary} !important;
      }
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] main.main-surface {
        color: ${repair.textPrimary} !important;
        background: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, transparent) !important;
      }
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] aside.app-shell-left-panel,
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] main.main-surface > header:not(.app-header-tint),
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] main.main-surface article,
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] main.main-surface [data-message-author-role],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] .composer-surface-chrome,
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] [role="dialog"],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] [role="menu"],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] [role="listbox"],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] [data-pip-obstacle="thread-summary-panel"],
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] :is(input, textarea, select) {
        color: ${repair.textPrimary} !important;
        background: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
      }
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] :is(
        [class~="text-foreground"],
        [class~="text-primary"],
        [class~="text-token-foreground"],
        [class~="text-token-text-primary"],
        [class~="text-token-input-foreground"]
      ) {
        color: ${repair.textPrimary} !important;
      }
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] :is(
        [class~="text-secondary"],
        [class~="text-foreground-secondary"],
        [class~="text-token-foreground-secondary"],
        [class~="text-token-text-secondary"],
        [class~="text-token-description-foreground"]
      ) {
        color: ${repair.textSecondary} !important;
      }
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] :is(
        [class~="text-tertiary"],
        [class~="text-foreground-tertiary"],
        [class~="text-token-foreground-tertiary"],
        [class~="text-token-text-tertiary"],
        [class~="text-token-disabled-foreground"]
      ),
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] :is(input, textarea)::placeholder,
      html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-contrast-repair="active"] [contenteditable="true"] [data-placeholder]::before {
        color: ${repair.textTertiary} !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    document.documentElement.setAttribute(
      "data-codex-styler-contrast-repair",
      "active",
    );
    return true;
  };

  const semanticPalette = (appearance, background, contrastSystem) => {
    const custom = appearance.palette || {};
    const strength = {
      none: {
        raised: 0.04,
        overlay: 0.07,
        control: 0.05,
        controlHover: 0.08,
        controlActive: 0.12,
      },
      subtle: {
        raised: 0.06,
        overlay: 0.1,
        control: 0.08,
        controlHover: 0.13,
        controlActive: 0.18,
      },
      expressive: {
        raised: 0.1,
        overlay: 0.16,
        control: 0.12,
        controlHover: 0.2,
        controlActive: 0.28,
      },
    }[appearance.decorations || "none"] || {
      raised: 0.04,
      overlay: 0.07,
      control: 0.05,
      controlHover: 0.08,
      controlActive: 0.12,
    };
    const textPrimary = contrastSystem.textPrimary;
    const textSecondary = contrastSystem.textSecondary;
    const textTertiary = contrastSystem.textTertiary;
    const preferredIconColor = (emphasis = false) => {
      const style = appearance.iconStyle || "native";
      const base = emphasis ? textPrimary : textSecondary;
      if (style === "native") return base;
      const accentAmount =
        style === "themed" ? (emphasis ? 0.72 : 0.58) : emphasis ? 0.5 : 0.36;
      return mix(base, appearance.accent, accentAmount);
    };
    const readableSurface = (surface, minimum = 4.5) =>
      contrast(textPrimary, surface) >= minimum &&
      contrast(textSecondary, surface) >= minimum &&
      contrast(textTertiary, surface) >= 3;
    const safeSurface = (candidate, fallback, minimum = 4.5) => {
      if (candidate && readableSurface(candidate, minimum)) {
        return candidate;
      }
      return readableSurface(fallback, minimum) ? fallback : appearance.surface;
    };
    const safeForeground = (candidate, backgrounds, fallback, minimum = 4.5) =>
      readable(candidate || fallback, backgrounds, minimum);
    const statusDefaults =
      contrastSystem.tone === "light"
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
    const preferredFeedbackColor = (role) => {
      if (role === "success") return custom.success || statusDefaults.success;
      if (role === "warning") return custom.warning || statusDefaults.warning;
      if (role === "danger") return custom.danger || statusDefaults.danger;
      if (role === "info") return custom.info || appearance.accent;
      if (role === "added")
        return custom.added || custom.success || statusDefaults.success;
      if (role === "modified")
        return custom.modified || custom.warning || statusDefaults.warning;
      return custom.deleted || custom.danger || statusDefaults.danger;
    };
    const onAccent = safeForeground(
      custom.onAccent,
      [appearance.accent],
      readable(appearance.surface, appearance.accent),
    );
    const canvas = safeSurface(custom.canvas, background.color);
    const surfaceRaised = safeSurface(
      custom.surfaceRaised,
      mix(appearance.surface, appearance.accent, strength.raised),
    );
    const surfaceOverlay = safeSurface(
      custom.surfaceOverlay,
      mix(appearance.surface, appearance.accent, strength.overlay),
    );
    const surfaceSunken = safeSurface(
      custom.surfaceSunken,
      mix(appearance.surface, background.color, 0.12),
    );
    const control = safeSurface(
      custom.control,
      mix(appearance.surface, appearance.accent, strength.control),
    );
    const controlHover = safeSurface(
      custom.controlHover,
      mix(appearance.surface, appearance.accent, strength.controlHover),
    );
    const controlActive = safeSurface(
      custom.controlActive,
      mix(appearance.surface, appearance.accent, strength.controlActive),
    );
    const boundaryBackgrounds = [
      appearance.surface,
      surfaceRaised,
      surfaceOverlay,
      surfaceSunken,
      control,
      controlHover,
      controlActive,
    ];
    // Mirrors the desktop preview contract: quiet separators stay subtle,
    // while regular and strong component boundaries cannot disappear.
    const border = readable(appearance.border, boundaryBackgrounds, 1.5);
    const borderSubtle = readable(
      custom.borderSubtle || mix(appearance.surface, border, 0.72),
      boundaryBackgrounds,
      1.25,
    );
    const borderStrong = readable(
      custom.borderStrong || mix(border, textPrimary, 0.3),
      boundaryBackgrounds,
      custom.borderStrong ? 3 : 2.5,
    );
    const icon = readable(preferredIconColor(), boundaryBackgrounds, 3);
    const iconEmphasis = readable(
      preferredIconColor(true),
      boundaryBackgrounds,
      3,
    );
    const feedbackSurfaces = boundaryBackgrounds;
    // Mirrors the foreground-bearing inline diff (11%) and status (16%)
    // surfaces. Stronger editor fills use normal text, not the status hue.
    const feedbackTintAmounts = [0.11, 0.16];
    const tintedFeedbackBackgrounds = (foreground) =>
      feedbackSurfaces.flatMap((surface) =>
        feedbackTintAmounts.map((amount) => mix(surface, foreground, amount)),
      );
    const feedbackColor = (role) => {
      let resolved = readable(
        preferredFeedbackColor(role),
        feedbackSurfaces,
        4.5,
      );
      for (let iteration = 0; iteration < 8; iteration += 1) {
        const next = readable(
          resolved,
          [...feedbackSurfaces, ...tintedFeedbackBackgrounds(resolved)],
          4.5,
        );
        if (next === resolved) break;
        resolved = next;
      }
      return resolved;
    };
    const success = feedbackColor("success");
    const warning = feedbackColor("warning");
    const danger = feedbackColor("danger");
    const info = feedbackColor("info");
    return {
      canvas,
      surface: appearance.surface,
      surfaceRaised,
      surfaceOverlay,
      surfaceSunken,
      control,
      controlHover,
      controlActive,
      textPrimary,
      textSecondary,
      textTertiary,
      icon,
      iconEmphasis,
      accent: appearance.accent,
      onAccent,
      border,
      borderSubtle,
      borderStrong,
      focus: safeForeground(
        custom.focus || appearance.accent,
        contrastSystem.strongBackgrounds,
        statusDefaults.info,
      ),
      success,
      warning,
      danger,
      info,
      added: feedbackColor("added"),
      modified: feedbackColor("modified"),
      deleted: feedbackColor("deleted"),
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
    --codex-styler-icon: ${palette.icon};
    --codex-styler-icon-emphasis: ${palette.iconEmphasis};
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
    --color-icon-primary: var(--codex-styler-icon-emphasis);
    --color-icon-secondary: var(--codex-styler-icon);
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
    --color-token-foreground-secondary: var(--codex-styler-text-secondary);
    --color-token-foreground-tertiary: var(--codex-styler-text-tertiary);
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
    const { background } = visual;
    const authoredAppearance = visual.appearance;
    const motionProfile = resolveMotionProfile(visual.motion.intensity);
    const motionDuration = motionProfile.duration;
    const interactionLift = motionProfile.lift;
    const contrastSystem = resolveContrastSystem(theme, variant);
    const protectedText = contrastSystem.textPrimary;
    const quietSurfacePercent = Math.round(
      contrastSystem.quietSurfaceOpacity * 100,
    );
    const strongSurfacePercent = Math.round(
      contrastSystem.strongSurfaceOpacity * 100,
    );
    const accentText = readable(
      authoredAppearance.surface,
      authoredAppearance.accent,
    );
    const palette = semanticPalette(
      authoredAppearance,
      background,
      contrastSystem,
    );
    const appearance = { ...authoredAppearance, border: palette.border };
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const semantic = safeMode
      ? ""
      : `
        html[data-codex-styler][data-codex-styler-mode="semantic"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] {
          color-scheme: ${variant} !important;
          --codex-styler-motion-duration: ${motionDuration}ms;
          --codex-styler-motion-lift: ${motionProfile.lift}px;
          --codex-styler-motion-press-scale: ${motionProfile.pressScale};
          --codex-styler-motion-overlay-opacity: ${motionProfile.overlayOpacity};
          --codex-styler-scrollbar-thumb: color-mix(in srgb, var(--codex-styler-accent) 26%, var(--codex-styler-border-strong));
          --codex-styler-scrollbar-thumb-hover: color-mix(in srgb, var(--codex-styler-accent) 52%, var(--codex-styler-border-strong));
          --codex-styler-material-raised: color-mix(in srgb, var(--codex-styler-surface-raised) 92%, transparent);
          --codex-styler-material-overlay: color-mix(in srgb, var(--codex-styler-surface-overlay) 96%, transparent);
          --codex-styler-material-sunken: color-mix(in srgb, var(--codex-styler-surface-sunken) 92%, transparent);
          --codex-styler-material-border: var(--codex-styler-border);
          --codex-styler-material-filter: saturate(1.04) blur(${Math.max(4, Math.round(appearance.focusBlur * 0.65))}px);
          --codex-styler-material-raised-shadow: 0 10px 28px rgb(0 0 0 / 9%);
          --codex-styler-material-overlay-shadow: inset 0 1px color-mix(in srgb, var(--codex-styler-text-primary) 5%, transparent), 0 20px 54px rgb(0 0 0 / 17%);
          ${codexColorTokenDeclarations(palette)}
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-material="solid"] {
          --codex-styler-material-raised: var(--codex-styler-surface-raised);
          --codex-styler-material-overlay: var(--codex-styler-surface-overlay);
          --codex-styler-material-sunken: var(--codex-styler-surface-sunken);
          --codex-styler-material-border: var(--codex-styler-border-strong);
          --codex-styler-material-filter: none;
          --codex-styler-material-raised-shadow: 0 5px 16px rgb(0 0 0 / 8%);
          --codex-styler-material-overlay-shadow: 0 14px 34px rgb(0 0 0 / 16%);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-material="frosted"] {
          --codex-styler-material-raised: linear-gradient(145deg, color-mix(in srgb, var(--codex-styler-surface-raised) 86%, transparent), color-mix(in srgb, var(--codex-styler-surface-overlay) 70%, transparent));
          --codex-styler-material-overlay: linear-gradient(145deg, color-mix(in srgb, var(--codex-styler-surface-overlay) 88%, transparent), color-mix(in srgb, var(--codex-styler-surface-raised) 68%, transparent));
          --codex-styler-material-sunken: color-mix(in srgb, var(--codex-styler-surface-sunken) 82%, transparent);
          --codex-styler-material-border: color-mix(in srgb, var(--codex-styler-accent) 22%, var(--codex-styler-border));
          --codex-styler-material-filter: saturate(1.14) blur(${Math.max(14, appearance.focusBlur)}px);
          --codex-styler-material-raised-shadow: inset 0 1px color-mix(in srgb, var(--codex-styler-text-primary) 7%, transparent), 0 15px 38px rgb(0 0 0 / 13%);
          --codex-styler-material-overlay-shadow: inset 0 1px color-mix(in srgb, var(--codex-styler-text-primary) 9%, transparent), 0 24px 64px rgb(0 0 0 / 21%);
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] {
          --codex-styler-scrollbar-thumb: color-mix(in srgb, var(--codex-styler-accent) 38%, var(--codex-styler-border-strong));
          --codex-styler-scrollbar-thumb-hover: color-mix(in srgb, var(--codex-styler-accent) 64%, var(--codex-styler-border-strong));
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] {
          --codex-styler-scrollbar-thumb: color-mix(in srgb, var(--codex-styler-accent) 54%, var(--codex-styler-border-strong));
          --codex-styler-scrollbar-thumb-hover: color-mix(in srgb, var(--codex-styler-accent) 78%, var(--codex-styler-text-primary));
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-typography="balanced"] {
          --codex-styler-content-leading: 1.5;
          --codex-styler-heading-leading: 1.28;
          --codex-styler-heading-weight: 650;
          --codex-styler-heading-tracking: -.008em;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-typography="editorial"] {
          --codex-styler-content-leading: 1.58;
          --codex-styler-heading-leading: 1.2;
          --codex-styler-heading-weight: 690;
          --codex-styler-heading-tracking: -.018em;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-typography="cinematic"] {
          --codex-styler-content-leading: 1.64;
          --codex-styler-heading-leading: 1.16;
          --codex-styler-heading-weight: 720;
          --codex-styler-heading-tracking: -.026em;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] {
          background: transparent !important;
          color: var(--codex-styler-text-primary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}],
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}],
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] * {
          scrollbar-width: thin;
          scrollbar-color: var(--codex-styler-scrollbar-thumb) transparent;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-track,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-track {
          background: transparent;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-thumb,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-thumb {
          min-width: 28px;
          min-height: 28px;
          border: 2px solid transparent;
          border-radius: 999px;
          background: var(--codex-styler-scrollbar-thumb) padding-box;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-thumb:hover,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-thumb:hover {
          background: var(--codex-styler-scrollbar-thumb-hover) padding-box;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-button,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-corner,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] *::-webkit-scrollbar-corner {
          background: transparent;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel {
          color: var(--codex-styler-text-primary) !important;
          background: linear-gradient(180deg, color-mix(in srgb, ${appearance.surface} ${Math.min(99, strongSurfacePercent + 2)}%, transparent), color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent)) !important;
          border-color: ${appearance.border} !important;
          backdrop-filter: saturate(1.08) blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel nav {
          background: transparent !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel button {
          transition: color var(--codex-styler-motion-duration) ease, background var(--codex-styler-motion-duration) ease, box-shadow var(--codex-styler-motion-duration) ease !important;
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
          color: var(--codex-styler-text-primary) !important;
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
          background: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, transparent) !important;
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
          background: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
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
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome {
          background: var(--codex-styler-material-raised) !important;
          border-color: var(--codex-styler-material-border) !important;
          border-radius: ${appearance.radius}px !important;
          color: var(--codex-styler-text-primary) !important;
          box-shadow: var(--codex-styler-material-raised-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="dialog"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="alertdialog"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="menu"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [role="listbox"] {
          background: var(--codex-styler-material-overlay) !important;
          border-color: var(--codex-styler-material-border) !important;
          border-radius: ${appearance.radius}px !important;
          color: var(--codex-styler-text-primary) !important;
          box-shadow: var(--codex-styler-material-overlay-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome:focus-within {
          border-color: color-mix(in srgb, ${appearance.accent} 55%, ${appearance.border}) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, ${appearance.accent} 14%, transparent), 0 18px 50px rgb(0 0 0 / 12%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .ProseMirror {
          color: var(--codex-styler-text-primary) !important;
          caret-color: ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] button[class~="bg-token-foreground"] {
          color: ${accentText} !important;
          background: ${appearance.accent} !important;
          box-shadow: 0 6px 18px color-mix(in srgb, ${appearance.accent} 22%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] {
          color: var(--codex-styler-text-primary) !important;
          background: var(--codex-styler-material-overlay) !important;
          border: 1px solid var(--codex-styler-material-border) !important;
          border-radius: ${Math.max(12, appearance.radius + 4)}px !important;
          box-shadow: var(--codex-styler-material-overlay-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] > div,
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] section {
          border-color: color-mix(in srgb, ${appearance.border} 72%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item"],
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item-button"] {
          border-radius: ${Math.max(8, appearance.radius - 3)}px !important;
          transition: background var(--codex-styler-motion-duration) ease, transform var(--codex-styler-motion-duration) ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item-button"]:hover {
          background: color-mix(in srgb, ${appearance.accent} 11%, transparent) !important;
          transform: translateX(${Math.round(interactionLift * 0.5)}px);
        }
        /* Full-page settings replaces Codex's semantic <main> with a routed
           div. Keep that route inside the same material and palette system
           instead of letting it fall back to the native Codex surface. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="settings"] body > [${APP_ROOT_ATTRIBUTE}] .main-surface {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, transparent) !important;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, ${appearance.border} 84%, transparent) !important;
          backdrop-filter: saturate(1.04) blur(${Math.max(2, Math.round(appearance.focusBlur * 0.35))}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="settings"] body > [${APP_ROOT_ATTRIBUTE}] .main-surface > :is(nav, [role="tablist"], [role="tabpanel"], section) {
          color: var(--codex-styler-text-primary) !important;
          background: var(--codex-styler-material-raised) !important;
          box-shadow: inset 0 0 0 1px var(--codex-styler-material-border), var(--codex-styler-material-raised-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(input, textarea, select) {
          color: var(--codex-styler-text-primary) !important;
          caret-color: ${appearance.accent} !important;
          border-color: ${appearance.border} !important;
          background-color: color-mix(in srgb, ${appearance.surface} ${strongSurfacePercent}%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [contenteditable="true"] {
          caret-color: ${appearance.accent} !important;
        }
        /* Codex's own appearance can leave utility classes with a stale
           foreground after a Styler theme changes. Exact semantic roles take
           precedence here; links, statuses, diffs, and accents keep meaning. */
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(
          [class~="text-foreground"],
          [class~="text-primary"],
          [class~="text-token-foreground"],
          [class~="text-token-text-primary"],
          [class~="text-token-input-foreground"]
        ) {
          color: var(--codex-styler-text-primary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(
          [class~="text-secondary"],
          [class~="text-foreground-secondary"],
          [class~="text-token-foreground-secondary"],
          [class~="text-token-text-secondary"],
          [class~="text-token-description-foreground"]
        ) {
          color: var(--codex-styler-text-secondary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(
          [class~="text-tertiary"],
          [class~="text-foreground-tertiary"],
          [class~="text-token-foreground-tertiary"],
          [class~="text-token-text-tertiary"],
          [class~="text-token-disabled-foreground"]
        ) {
          color: var(--codex-styler-text-tertiary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(
          [class~="text-icon-primary"],
          [class~="text-token-icon-foreground"]
        ) {
          color: var(--codex-styler-text-primary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(input, textarea)::placeholder {
          color: var(--codex-styler-text-tertiary) !important;
          opacity: 1 !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] [contenteditable="true"] [data-placeholder]::before {
          color: var(--codex-styler-text-tertiary) !important;
          opacity: 1 !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(a, [role="link"]) {
          color: var(--codex-styler-info) !important;
          text-decoration-color: color-mix(in srgb, ${appearance.accent} 55%, transparent);
          text-underline-offset: 3px;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is(a, [role="link"]):hover {
          color: color-mix(in srgb, var(--codex-styler-info) 72%, var(--codex-styler-text-primary)) !important;
          text-decoration-color: ${appearance.accent};
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          button,
          a,
          input,
          textarea,
          select,
          [role="button"],
          [role="tab"],
          [role="option"],
          [role="switch"]
        ) {
          transition: color var(--codex-styler-motion-duration) ease, background-color var(--codex-styler-motion-duration) ease, border-color var(--codex-styler-motion-duration) ease, box-shadow var(--codex-styler-motion-duration) ease, transform var(--codex-styler-motion-duration) ease !important;
        }
        @media (hover: hover) and (pointer: fine) {
          html[data-codex-styler][data-codex-styler-mode="semantic"]:not([data-codex-styler-motion="still"]) body > [${APP_ROOT_ATTRIBUTE}] :is(
            aside.app-shell-left-panel nav button,
            .composer-surface-chrome button,
            [role="tab"],
            [role="option"]
          ):not(:disabled):not([aria-disabled="true"]):hover {
            transform: translateY(calc(-1 * var(--codex-styler-motion-lift))) scale(1) !important;
          }
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"]:not([data-codex-styler-motion="still"]) body > [${APP_ROOT_ATTRIBUTE}] :is(
          aside.app-shell-left-panel nav button,
          .composer-surface-chrome button,
          [role="tab"],
          [role="option"]
        ):not(:disabled):not([aria-disabled="true"]):active {
          transform: translateY(0) scale(var(--codex-styler-motion-press-scale)) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          button,
          a,
          input,
          textarea,
          select,
          [role="button"],
          [role="tab"],
          [role="option"],
          [role="switch"]
        ):focus-visible {
          outline: 2px solid color-mix(in srgb, ${appearance.accent} 74%, var(--codex-styler-focus)) !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px color-mix(in srgb, ${appearance.accent} 14%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="tablist"] {
          border-color: color-mix(in srgb, ${appearance.border} 78%, transparent) !important;
          background: color-mix(in srgb, ${appearance.surface} ${Math.max(48, quietSurfacePercent - 12)}%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"] {
          color: var(--codex-styler-text-secondary) !important;
          border-color: transparent !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"]:hover {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.accent} 8%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"][aria-selected="true"] {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.accent} 13%, transparent) !important;
          box-shadow: inset 0 -2px ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="option"][aria-selected="true"] {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.accent} 14%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          input[type="checkbox"],
          input[type="radio"],
          input[type="range"]
        ) {
          accent-color: ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] [role="switch"][aria-checked="true"] {
          border-color: color-mix(in srgb, ${appearance.accent} 72%, ${appearance.border}) !important;
          background-color: color-mix(in srgb, ${appearance.accent} 74%, var(--codex-styler-surface-raised)) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          button,
          input,
          textarea,
          select,
          [role="button"],
          [role="tab"],
          [role="option"],
          [role="switch"],
          [role="checkbox"],
          [role="radio"]
        ):is(:disabled, [aria-disabled="true"]) {
          color: var(--codex-styler-text-tertiary) !important;
          border-color: color-mix(in srgb, ${appearance.border} 54%, transparent) !important;
          background-color: color-mix(in srgb, var(--codex-styler-control) 48%, transparent) !important;
          box-shadow: none !important;
          filter: saturate(.72);
          opacity: .58 !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          button,
          [role="button"],
          [role="option"],
          [role="switch"],
          [role="checkbox"],
          [role="radio"]
        ):is(
          [aria-pressed="true"],
          [aria-checked="true"],
          [data-state="active"],
          [data-state="open"],
          [data-state="checked"],
          [data-state="on"]
        ) {
          color: var(--codex-styler-text-primary) !important;
          border-color: color-mix(in srgb, ${appearance.accent} 54%, ${appearance.border}) !important;
          background-color: var(--codex-styler-control-active) !important;
          box-shadow: inset 0 -2px color-mix(in srgb, ${appearance.accent} 82%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          input,
          textarea,
          select,
          [role="textbox"],
          [role="combobox"]
        )[aria-invalid="true"] {
          border-color: color-mix(in srgb, var(--codex-styler-danger) 70%, ${appearance.border}) !important;
          background-color: color-mix(in srgb, var(--codex-styler-danger) 7%, var(--codex-styler-control)) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--codex-styler-danger) 12%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :is([role="dialog"], [role="menu"], [role="listbox"]) button:hover {
          background-color: color-mix(in srgb, ${appearance.accent} 10%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(
          [role="dialog"],
          [role="alertdialog"],
          [role="menu"],
          [role="listbox"],
          [role="tooltip"],
          [role="alert"],
          [role="status"],
          [data-sonner-toast]
        ) {
          color: var(--codex-styler-text-primary) !important;
          border-color: color-mix(in srgb, ${appearance.border} 88%, transparent) !important;
          background: color-mix(in srgb, var(--codex-styler-surface-overlay) 96%, transparent) !important;
          box-shadow: 0 20px 62px rgb(0 0 0 / 22%), inset 0 1px color-mix(in srgb, ${protectedText} 6%, transparent) !important;
          backdrop-filter: saturate(1.08) blur(${Math.max(12, appearance.focusBlur + 4)}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"]:is(
          [data-codex-styler-motion="fluid"],
          [data-codex-styler-motion="expressive"]
        ) body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(
          [role="dialog"],
          [role="alertdialog"],
          [role="menu"],
          [role="listbox"]
        ) {
          animation: codex-styler-surface-enter var(--codex-styler-motion-duration) cubic-bezier(.2, .72, .2, 1) both !important;
        }
        @keyframes codex-styler-surface-enter {
          from {
            opacity: var(--codex-styler-motion-overlay-opacity);
          }
          to {
            opacity: 1;
          }
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] [role="tooltip"] {
          border-radius: ${Math.max(6, appearance.radius - 5)}px !important;
          box-shadow: 0 10px 28px rgb(0 0 0 / 20%), inset 0 1px color-mix(in srgb, ${protectedText} 6%, transparent) !important;
        }

        /*
         * Icon treatments are semantic and geometry-safe. They cover native
         * navigation, top bars, tabs, composer actions, side panels and
         * transient overlays without changing SVG dimensions, padding or
         * stroke geometry. Destructive, invalid and branded actions keep
         * their native meaning instead of being recolored by the theme.
         */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] body > [${APP_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] body > [${APP_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > :is(span, div):first-child > svg:only-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="contained"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > :is(span, div):first-child > svg:only-child {
          overflow: visible;
          border-radius: max(3px, calc(${appearance.radius}px * 0.28));
          color: var(--codex-styler-icon) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, ${appearance.accent} 10%, transparent);
          filter: drop-shadow(0 2px 5px color-mix(in srgb, ${appearance.accent} 20%, transparent));
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] body > [${APP_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] body > [${APP_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > :is(span, div):first-child > svg:only-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > svg:first-child,
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-icons="themed"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]):not([aria-invalid="true"]):not([data-variant="destructive"]):not([data-tone="danger"]):not([data-state="error"]):not([data-brand]):not([class*="destructive"]):not([class*="danger"]):not([class*="text-red"]) > :is(span, div):first-child > svg:only-child {
          overflow: visible;
          border-radius: 999px;
          color: var(--codex-styler-icon-emphasis) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, ${appearance.accent} 13%, transparent), 0 0 12px color-mix(in srgb, ${appearance.accent} 18%, transparent);
          filter: drop-shadow(0 3px 7px color-mix(in srgb, ${appearance.accent} 30%, transparent));
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
          border: 1px solid var(--codex-styler-material-border) !important;
          border-radius: ${Math.max(16, appearance.radius + 5)}px !important;
          color: ${protectedText} !important;
          background: var(--codex-styler-material-raised) !important;
          box-shadow: var(--codex-styler-material-raised-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
          transition: transform var(--codex-styler-motion-duration) ease, border-color var(--codex-styler-motion-duration) ease, box-shadow var(--codex-styler-motion-duration) ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] .group\\/home-suggestions button:hover {
          transform: translateY(-${interactionLift}px) !important;
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
          border: 1px solid var(--codex-styler-material-border) !important;
          border-bottom: 0 !important;
          border-radius: ${Math.max(14, appearance.radius + 3)}px ${Math.max(14, appearance.radius + 3)}px 0 0;
          background: var(--codex-styler-material-raised) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
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
          border-radius: ${Math.max(8, appearance.radius - 2)}px !important;
          background: color-mix(in srgb, var(--codex-styler-control-active) 72%, transparent) !important;
          box-shadow: inset 0 1px color-mix(in srgb, ${appearance.accent} 10%, transparent), 0 8px 22px rgb(0 0 0 / 7%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="task"][data-codex-styler-decorations="expressive"] [data-message-author-role="user"] {
          border-left-color: color-mix(in srgb, ${appearance.accent} 82%, var(--codex-styler-text-primary)) !important;
          box-shadow: inset 0 1px color-mix(in srgb, ${appearance.accent} 18%, transparent), 0 12px 30px rgb(0 0 0 / 11%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] pre {
          overflow: auto;
          border: 1px solid var(--codex-styler-material-border) !important;
          background: var(--codex-styler-material-sunken) !important;
          box-shadow: inset 0 1px color-mix(in srgb, ${protectedText} 4%, transparent) !important;
          scrollbar-color: color-mix(in srgb, ${appearance.accent} 42%, transparent) transparent;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] pre,
        html[data-codex-styler][data-codex-styler-mode="semantic"] code,
        html[data-codex-styler][data-codex-styler-mode="semantic"] kbd {
          border-color: color-mix(in srgb, ${appearance.border} 75%, transparent) !important;
          border-radius: ${Math.max(6, appearance.radius - 4)}px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] :not(pre) > code,
        html[data-codex-styler][data-codex-styler-mode="semantic"] kbd {
          color: var(--codex-styler-text-primary) !important;
          background: var(--codex-styler-material-raised) !important;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, ${appearance.border} 70%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] blockquote {
          border-inline-start-color: color-mix(in srgb, ${appearance.accent} 68%, ${appearance.border}) !important;
          background: color-mix(in srgb, ${appearance.accent} 6%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] hr {
          border-color: color-mix(in srgb, ${appearance.border} 72%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] table {
          overflow: hidden;
          border: 1px solid var(--codex-styler-material-border) !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          border-radius: ${Math.max(8, appearance.radius - 2)}px !important;
          color: var(--codex-styler-text-primary) !important;
          background: var(--codex-styler-material-raised) !important;
          box-shadow: var(--codex-styler-material-raised-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(th, td) {
          border-color: color-mix(in srgb, ${appearance.border} 68%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] th {
          color: var(--codex-styler-text-secondary) !important;
          background: color-mix(in srgb, ${appearance.accent} 7%, var(--codex-styler-surface-sunken)) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] tbody tr:hover > :is(th, td) {
          background: color-mix(in srgb, ${appearance.accent} 6%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] details {
          overflow: hidden;
          border-color: var(--codex-styler-material-border) !important;
          border-radius: ${Math.max(8, appearance.radius - 2)}px !important;
          color: var(--codex-styler-text-primary) !important;
          background: var(--codex-styler-material-raised) !important;
          box-shadow: var(--codex-styler-material-raised-shadow) !important;
          backdrop-filter: var(--codex-styler-material-filter) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] summary {
          color: var(--codex-styler-text-primary) !important;
          cursor: pointer;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] details[open] > summary {
          border-bottom-color: color-mix(in srgb, ${appearance.border} 66%, transparent) !important;
          background: color-mix(in srgb, ${appearance.accent} 5%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(progress, meter, [role="progressbar"]) {
          accent-color: ${appearance.accent} !important;
          --codex-styler-progress-accent: ${appearance.accent};
          --codex-styler-progress-track: color-mix(in srgb, ${appearance.border} 52%, transparent);
          overflow: hidden;
          border-radius: 999px !important;
          background: var(--codex-styler-progress-track) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] progress::-webkit-progress-bar {
          border-radius: 999px;
          background: var(--codex-styler-progress-track) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] progress::-webkit-progress-value {
          border-radius: 999px;
          background: var(--codex-styler-progress-accent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] mark {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.accent} 24%, transparent) !important;
          border-radius: 4px;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] ins {
          color: var(--codex-styler-added) !important;
          background: color-mix(in srgb, var(--codex-styler-added) 11%, transparent) !important;
          text-decoration: none !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] del {
          color: var(--codex-styler-deleted) !important;
          background: color-mix(in srgb, var(--codex-styler-deleted) 11%, transparent) !important;
          text-decoration-color: color-mix(in srgb, var(--codex-styler-deleted) 68%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(samp, output) {
          color: var(--codex-styler-text-secondary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] pre :is(samp, output) {
          font-family: inherit !important;
        }
        /* Theme typography is content-scoped and geometry-safe: it changes
           reading rhythm without replacing fonts, resizing text, or moving
           controls. Codex keeps ownership of the underlying typefaces. */
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(article, [data-message-author-role]) :is(p, li, blockquote),
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] .ProseMirror,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is([role="dialog"], [role="tabpanel"]) :is(p, li) {
          line-height: var(--codex-styler-content-leading) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(article, [data-message-author-role]) :is(h1, h2, h3),
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is([role="dialog"], [role="tabpanel"]) :is(h1, h2, h3) {
          font-weight: var(--codex-styler-heading-weight) !important;
          line-height: var(--codex-styler-heading-leading) !important;
          letter-spacing: var(--codex-styler-heading-tracking) !important;
        }
        html:lang(zh)[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(article, [data-message-author-role]) :is(h1, h2, h3),
        html:lang(zh)[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is([role="dialog"], [role="tabpanel"]) :is(h1, h2, h3) {
          letter-spacing: normal !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(fieldset, [role="tree"], [role="grid"]) {
          border-color: color-mix(in srgb, ${appearance.border} 78%, transparent) !important;
          color: var(--codex-styler-text-primary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(legend, figcaption, dt, [role="columnheader"], [role="rowheader"]) {
          color: var(--codex-styler-text-secondary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(dd, output, samp, [role="cell"], [role="gridcell"]) {
          color: var(--codex-styler-text-primary) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is([role="treeitem"], [role="row"]) {
          border-radius: ${Math.max(6, appearance.radius - 5)}px !important;
          transition: background-color 150ms ease, color 150ms ease !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is([role="treeitem"], [role="row"]):hover {
          background: color-mix(in srgb, ${appearance.accent} 6%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
          [role="treeitem"][aria-selected="true"],
          [role="row"][aria-selected="true"],
          [aria-current]:not([aria-current="false"])
        ) {
          color: var(--codex-styler-text-primary) !important;
          background: color-mix(in srgb, ${appearance.accent} 12%, transparent) !important;
          box-shadow: inset 3px 0 color-mix(in srgb, ${appearance.accent} 76%, ${appearance.border}) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] [role="tab"][aria-selected="true"],
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] pre {
          border-color: color-mix(in srgb, ${appearance.accent} 28%, ${appearance.border}) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] [role="tab"][aria-selected="true"] {
          box-shadow: inset 0 -2px ${appearance.accent}, 0 0 16px color-mix(in srgb, ${appearance.accent} 12%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] pre {
          border-color: color-mix(in srgb, ${appearance.accent} 42%, ${appearance.border}) !important;
          box-shadow: inset 3px 0 ${appearance.accent}, inset 0 1px color-mix(in srgb, ${protectedText} 5%, transparent) !important;
        }
        /* Geometry is derived from the portable radius instead of theme ids,
           so imported themes receive the same coherent component treatment. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="precise"] body > [${APP_ROOT_ATTRIBUTE}] [role="tablist"] {
          border-radius: ${Math.max(6, appearance.radius - 4)}px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="precise"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"] {
          border-radius: ${Math.max(4, appearance.radius - 6)}px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="precise"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"][aria-selected="true"] {
          box-shadow: inset 3px 0 ${appearance.accent}, inset 0 0 0 1px color-mix(in srgb, ${appearance.accent} 24%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="precise"] :is(
          .composer-surface-chrome,
          [role="dialog"],
          [role="menu"],
          [role="listbox"],
          [data-pip-obstacle="thread-summary-panel"]
        ) {
          border-radius: ${Math.max(7, appearance.radius - 3)}px !important;
          box-shadow: inset 2px 0 color-mix(in srgb, ${appearance.accent} 30%, transparent), 0 16px 42px rgb(0 0 0 / 14%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="soft"] body > [${APP_ROOT_ATTRIBUTE}] [role="tablist"] {
          padding: 3px !important;
          border-radius: 999px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="soft"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"] {
          border-radius: 999px !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="soft"] body > [${APP_ROOT_ATTRIBUTE}] [role="tab"][aria-selected="true"] {
          box-shadow: inset 0 -2px ${appearance.accent}, 0 7px 18px color-mix(in srgb, ${appearance.accent} 16%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-geometry="soft"] :is(
          .composer-surface-chrome,
          [role="dialog"],
          [role="menu"],
          [role="listbox"],
          [data-pip-obstacle="thread-summary-panel"]
        ) {
          border-radius: ${Math.min(28, appearance.radius + 4)}px !important;
          box-shadow: inset 0 1px color-mix(in srgb, ${protectedText} 7%, transparent), 0 22px 58px rgb(0 0 0 / 19%), 0 0 0 3px color-mix(in srgb, ${appearance.accent} 6%, transparent) !important;
        }
        /* Decoration depth is intentionally geometry-safe and comes after
           shape rules so the selected detail level remains visible on every
           Codex focus surface. It never changes layout, stacking or size. */
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="subtle"] :is(
          .composer-surface-chrome,
          [role="dialog"],
          [role="alertdialog"],
          [role="menu"],
          [role="listbox"],
          [data-pip-obstacle="thread-summary-panel"]
        ) {
          border-color: color-mix(in srgb, ${appearance.accent} 28%, ${appearance.border}) !important;
          box-shadow: inset 0 1px color-mix(in srgb, ${appearance.accent} 12%, transparent), 0 16px 42px rgb(0 0 0 / 13%), 0 0 0 2px color-mix(in srgb, ${appearance.accent} 5%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="settings"][data-codex-styler-decorations="subtle"] body > [${APP_ROOT_ATTRIBUTE}] .main-surface > :is(nav, [role="tablist"], [role="tabpanel"], section) {
          box-shadow: inset 0 0 0 1px color-mix(in srgb, ${appearance.accent} 22%, ${appearance.border}), inset 0 1px color-mix(in srgb, ${appearance.accent} 8%, transparent) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] :is(
          .composer-surface-chrome,
          [role="dialog"],
          [role="alertdialog"],
          [role="menu"],
          [role="listbox"],
          [data-pip-obstacle="thread-summary-panel"]
        ) {
          border-color: color-mix(in srgb, ${appearance.accent} 48%, ${appearance.border}) !important;
          box-shadow: inset 0 2px color-mix(in srgb, ${appearance.accent} 20%, transparent), 0 24px 64px rgb(0 0 0 / 20%), 0 0 0 3px color-mix(in srgb, ${appearance.accent} 8%, transparent) !important;
          backdrop-filter: saturate(1.14) blur(${Math.max(12, appearance.focusBlur + 6)}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="settings"][data-codex-styler-decorations="expressive"] body > [${APP_ROOT_ATTRIBUTE}] .main-surface > :is(nav, [role="tablist"], [role="tabpanel"], section) {
          background: color-mix(in srgb, var(--codex-styler-surface-raised) 84%, transparent) !important;
          box-shadow: inset 3px 0 color-mix(in srgb, ${appearance.accent} 68%, ${appearance.border}), inset 0 1px color-mix(in srgb, ${appearance.accent} 14%, transparent), 0 18px 46px rgb(0 0 0 / 13%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-decorations="expressive"] :is(
          [role="treeitem"][aria-selected="true"],
          [role="row"][aria-selected="true"],
          [aria-current]:not([aria-current="false"])
        ) {
          box-shadow: inset 3px 0 ${appearance.accent}, inset 0 0 0 1px color-mix(in srgb, ${appearance.accent} 18%, transparent), 0 8px 20px rgb(0 0 0 / 9%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] ::selection {
          color: var(--codex-styler-text-primary);
          background: color-mix(in srgb, ${appearance.accent} 28%, transparent);
          text-shadow: none;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] ::target-text {
          color: var(--codex-styler-text-primary);
          background: color-mix(in srgb, ${appearance.accent} 24%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${APP_ROOT_ATTRIBUTE}] :is(
            button,
            a,
            input,
            textarea,
            select,
            [role="button"],
            [role="tab"],
            [role="option"],
            [role="switch"],
            [role="treeitem"],
            [role="row"]
          ) {
            transition: none !important;
          }
          html[data-codex-styler][data-codex-styler-mode="semantic"] [data-pip-obstacle="thread-summary-panel"] [data-slot="thread-summary-panel-item-button"]:hover,
          html[data-codex-styler][data-codex-styler-mode="semantic"][data-codex-styler-page="home"] .group\\/home-suggestions button:hover {
            transform: none !important;
          }
          html[data-codex-styler][data-codex-styler-mode="semantic"] body > [${OVERLAY_ROOT_ATTRIBUTE}] :is(
            [role="dialog"],
            [role="alertdialog"],
            [role="menu"],
            [role="listbox"]
          ) {
            animation: none !important;
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
      #${BACKDROP_ID} .cs-layer {
        position: absolute; inset: -18px;
        pointer-events: none;
        background-position: center;
        background-size: cover;
        transform: scale(1.015);
      }
      #${BACKDROP_ID} [data-parallax] {
        will-change: transform;
        transition: transform var(--codex-styler-motion-duration) cubic-bezier(.2, .8, .2, 1);
      }
      #${BACKDROP_ID} .cs-layer-gradient {
        background:
          linear-gradient(135deg, color-mix(in srgb, ${appearance.accent} 22%, transparent), transparent 42%),
          radial-gradient(circle at 78% 18%, color-mix(in srgb, ${appearance.accent} 18%, transparent), transparent 38%);
      }
      #${BACKDROP_ID} .cs-layer-vignette {
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 44%, rgb(0 0 0 / 72%) 118%);
        transform: none;
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
      document.querySelector(`body > [${APP_ROOT_ATTRIBUTE}] .main-surface`);
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
    const positionAtAnchor = () => {
      const point = safeFreeEntityPosition(
        (entity.anchor.x / 100) * window.innerWidth,
        (entity.anchor.y / 100) * window.innerHeight,
        size,
        logicalHeight,
        window.innerWidth,
        window.innerHeight,
      );
      canvas.style.left = `${point.x}px`;
      canvas.style.top = `${point.y}px`;
      canvas.style.transform = "translate(-50%, -50%)";
    };
    const position = () => {
      const attachment = entity.attachment;
      if (!attachment) {
        positionAtAnchor();
        if (watchedTarget) attachmentObserver?.unobserve(watchedTarget);
        watchedTarget = null;
        return;
      }
      const target = entityTarget(attachment.target);
      if (!target) {
        positionAtAnchor();
        if (watchedTarget) attachmentObserver?.unobserve(watchedTarget);
        watchedTarget = null;
        return;
      }
      if (watchedTarget !== target) {
        if (watchedTarget) attachmentObserver?.unobserve(watchedTarget);
        watchedTarget = target;
        attachmentObserver?.observe(target);
      }
      const bounds = target.getBoundingClientRect();
      const point = safeAttachedEntityPosition(
        bounds,
        attachment,
        size,
        logicalHeight,
        window.innerWidth,
        window.innerHeight,
      );
      canvas.style.left = `${point.x}px`;
      canvas.style.top = `${point.y}px`;
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
      const point = safeFreeEntityPosition(
        event.clientX,
        event.clientY,
        size,
        logicalHeight,
        window.innerWidth,
        window.innerHeight,
      );
      entity.anchor = {
        x: window.innerWidth > 0 ? (point.x / window.innerWidth) * 100 : 50,
        y: window.innerHeight > 0 ? (point.y / window.innerHeight) * 100 : 50,
      };
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
          ? (renderer.framesPerPage ?? renderer.columns * renderer.rows)
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
        renderer.type === "sprite-atlas" ? localFrame % renderer.columns : 0;
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
        ? (renderer.framesPerPage ?? renderer.columns * renderer.rows)
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
          smoothedDirection = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
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
    const scrollHandler = () => position();
    document.addEventListener("scroll", scrollHandler, {
      capture: true,
      passive: true,
    });
    entityCleanup = () => {
      cancelIdle();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      for (const entry of pageCache.values())
        entry.image.removeAttribute("src");
      pageCache.clear();
      attachmentObserver?.disconnect();
      document.removeEventListener("scroll", scrollHandler, true);
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
      return {
        ok: false,
        reason: "runtime stylesheet was removed",
        repairable: false,
      };
    }
    if (
      !document.documentElement.hasAttribute("data-codex-styler-variant") ||
      !document.documentElement.hasAttribute("data-codex-styler-contrast")
    ) {
      return {
        ok: false,
        reason: "adaptive contrast state was removed",
        repairable: false,
      };
    }
    const appRoot = document.querySelector(`body > [${APP_ROOT_ATTRIBUTE}]`);
    if (!appRoot) {
      return {
        ok: false,
        reason: "application root was not found",
        repairable: false,
      };
    }
    if (!sidebar || !main) {
      const alternateSurface = appRoot.querySelector(
        '.main-surface, [role="dialog"], [role="alertdialog"]',
      );
      if (alternateSurface || appRoot.childElementCount > 0) {
        return { ok: true, reason: null, repairable: false };
      }
      return {
        ok: false,
        reason: "a visible application surface was not found",
        repairable: false,
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
        repairable: true,
      };
    }
    if (activeState?.theme && activeState?.variant) {
      const contrastSystem = document.documentElement.hasAttribute(
        "data-codex-styler-contrast-repair",
      )
        ? resolveEmergencyContrastSystem(activeState.theme, activeState.variant)
        : resolveContrastSystem(activeState.theme, activeState.variant);
      if (
        minimumContrast(
          contrastSystem.textPrimary,
          contrastSystem.quietBackgrounds,
        ) < 4.45
      ) {
        return {
          ok: false,
          reason: "adaptive text contrast could not be guaranteed",
          repairable: true,
        };
      }
      const primaryText =
        main.querySelector(
          '[class~="text-token-foreground"], [class~="text-token-text-primary"], [class~="text-foreground"], [class~="text-primary"]',
        ) || main;
      const computedForeground = cssColorToHex(
        getComputedStyle(primaryText).color,
      );
      if (
        computedForeground &&
        minimumContrast(computedForeground, contrastSystem.quietBackgrounds) <
          4.2
      ) {
        return {
          ok: false,
          reason: "Codex native foreground overrode adaptive theme colors",
          repairable: true,
        };
      }
    }
    return { ok: true, reason: null, repairable: false };
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
    const contrastSystem = resolveContrastSystem(theme, variant);
    document.documentElement.setAttribute("data-codex-styler-variant", variant);
    document.documentElement.setAttribute(
      "data-codex-styler-contrast",
      contrastSystem.tone,
    );
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
    document.documentElement.setAttribute(
      "data-codex-styler-geometry",
      appearance.radius <= 11
        ? "precise"
        : appearance.radius >= 17
          ? "soft"
          : "balanced",
    );
    document.documentElement.setAttribute(
      "data-codex-styler-material",
      resolveMaterialCharacter(appearance),
    );
    document.documentElement.setAttribute(
      "data-codex-styler-typography",
      appearance.layout === "editorial"
        ? "editorial"
        : appearance.layout === "immersive"
          ? "cinematic"
          : "balanced",
    );
    document.documentElement.setAttribute(
      "data-codex-styler-motion",
      resolveMotionProfile(theme.variants[variant].motion.intensity).character,
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
    const backgroundLayer = theme.scene.layers.find(
      (layer) =>
        layer.type === "image" &&
        layer.asset === theme.variants[variant].background.image,
    );
    if (backgroundLayer) {
      background.dataset.layerId = backgroundLayer.id;
      background.dataset.parallax = String(backgroundLayer.parallax);
      background.style.opacity = String(backgroundLayer.opacity);
      background.style.mixBlendMode = backgroundLayer.blendMode;
    }
    const overlay = document.createElement("div");
    overlay.className = "cs-overlay";
    backdrop.append(background);
    theme.scene.layers.forEach((layer) => {
      if (
        layer.type === "image" &&
        layer.asset === theme.variants[variant].background.image
      ) {
        return;
      }
      const element = document.createElement("div");
      element.className = `cs-layer cs-layer-${layer.type}`;
      element.dataset.layerId = layer.id;
      element.dataset.parallax = String(layer.parallax);
      element.style.opacity = String(layer.opacity);
      element.style.mixBlendMode = layer.blendMode;
      if (layer.type === "image" && layer.asset) {
        element.style.backgroundImage = `url('${layer.asset}')`;
      }
      backdrop.appendChild(element);
    });
    backdrop.append(overlay);
    document.body.appendChild(backdrop);

    const sceneLayers = Array.from(
      backdrop.querySelectorAll("[data-parallax]"),
    );
    const motionIntensity = theme.variants[variant].motion?.intensity ?? 0;
    const globalParallax = Math.max(
      0,
      theme.variants[variant].motion?.parallax ?? 0,
    );
    if (
      motionIntensity > 0 &&
      globalParallax > 0 &&
      sceneLayers.some((element) => Number(element.dataset.parallax) !== 0)
    ) {
      let pointerX = 0;
      let pointerY = 0;
      scenePointerHandler = (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (sceneAnimationFrame !== null) return;
        sceneAnimationFrame = requestAnimationFrame(() => {
          sceneAnimationFrame = null;
          const x = pointerX / Math.max(1, window.innerWidth) - 0.5;
          const y = pointerY / Math.max(1, window.innerHeight) - 0.5;
          sceneLayers.forEach((element) => {
            const authoredDepth = Number(element.dataset.parallax || 0);
            const cappedDepth =
              Math.sign(authoredDepth) *
              Math.min(Math.abs(authoredDepth), globalParallax);
            const depth = cappedDepth * motionIntensity;
            if (depth === 0) {
              element.style.transform = "";
              return;
            }
            element.style.transform = `translate(${-x * depth}px, ${-y * depth}px) scale(1.015)`;
          });
        });
      };
      sceneResetHandler = () => {
        if (sceneAnimationFrame !== null) {
          cancelAnimationFrame(sceneAnimationFrame);
          sceneAnimationFrame = null;
        }
        sceneLayers.forEach((element) => {
          element.style.transform = "";
        });
      };
      window.addEventListener("pointermove", scenePointerHandler, {
        passive: true,
      });
      window.addEventListener("blur", sceneResetHandler);
      document.addEventListener("pointerleave", sceneResetHandler, true);
    }

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
            if (
              verification.repairable &&
              !document.documentElement.hasAttribute(
                "data-codex-styler-contrast-repair",
              ) &&
              installContrastRepair()
            ) {
              healthTimer = setTimeout(() => {
                healthTimer = null;
                const repairedVerification = verifySemanticAdapter();
                if (
                  !repairedVerification.ok &&
                  activeState?.resolvedMode === "semantic"
                ) {
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
                    repairedVerification.reason,
                  );
                }
              }, 120);
              return;
            }
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
      throw new Error(
        "Codex Styler rejected an invalid configuration revision",
      );
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
      throw new Error(
        "Codex Styler rejected an invalid configuration revision",
      );
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
    let verification = verifySemanticAdapter();
    let contrastRepairApplied = false;
    if (verification.repairable && installContrastRepair()) {
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
      verification = verifySemanticAdapter();
      contrastRepairApplied = verification.ok;
    }
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
      contrastRepairApplied,
    };
  };

  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    window.__CODEX_STYLER_RUNTIME_INTERNALS__ = { semanticPalette };
  }

  window.__CODEX_STYLER_RUNTIME__ = {
    version: 36,
    apply,
    updateEntity,
    pause: remove,
    restore: remove,
  };
})();
