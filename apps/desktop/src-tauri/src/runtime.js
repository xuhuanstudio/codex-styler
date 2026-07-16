(() => {
  if (window.__CODEX_STYLER_RUNTIME__?.version === 3) return;
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

  const finiteBetween = (value, minimum, maximum) =>
    typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;

  const assertSafeImage = (value) => {
    if (value === undefined) return;
    if (typeof value !== "string" || value.length > 28_000_000 || !DATA_IMAGE.test(value)) {
      throw new Error("Codex Styler rejected an unsafe runtime image");
    }
  };

  const assertSafeTheme = (theme, variant) => {
    if (!theme || typeof theme !== "object" || !/^[a-z0-9][a-z0-9.-]{2,63}$/.test(theme.id)) {
      throw new Error("Codex Styler rejected an invalid theme identity");
    }
    if (variant !== "light" && variant !== "dark") {
      throw new Error("Codex Styler rejected an invalid variant");
    }
    const visual = theme.variants?.[variant];
    const background = visual?.background;
    const appearance = visual?.appearance;
    if (!background || !appearance) throw new Error("Codex Styler rejected incomplete theme data");
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
    assertSafeImage(renderer.asset);
  };

  const remove = () => {
    mutationObserver?.disconnect();
    mutationObserver = null;
    activeState = null;
    if (pointerHandler) window.removeEventListener("pointermove", pointerHandler);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    if (healthTimer !== null) clearTimeout(healthTimer);
    pointerHandler = null;
    resizeHandler = null;
    animationFrame = null;
    healthTimer = null;
    document.getElementById(BACKDROP_ID)?.remove();
    document.getElementById(ENTITY_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-codex-styler");
    document.documentElement.removeAttribute("data-codex-styler-mode");
    document.documentElement.removeAttribute("data-codex-styler-fallback");
    document.documentElement.removeAttribute("data-codex-styler-page");
  };

  const installStyles = (theme, variant, safeMode) => {
    const visual = theme.variants[variant];
    const { appearance, background } = visual;
    const surfacePercent = Math.round(appearance.surfaceOpacity * 100);
    const quietSurfacePercent = Math.max(18, Math.round(surfacePercent * 0.54));
    const strongSurfacePercent = Math.min(94, Math.max(58, surfacePercent));
    const overlayPercent = Math.round(background.overlayOpacity * 100);
    const backgroundImage = background.image
      ? `linear-gradient(color-mix(in srgb, ${background.overlay} ${overlayPercent}%, transparent), color-mix(in srgb, ${background.overlay} ${overlayPercent}%, transparent)), url('${background.image}')`
      : `linear-gradient(color-mix(in srgb, ${background.overlay} ${overlayPercent}%, transparent), color-mix(in srgb, ${background.overlay} ${overlayPercent}%, transparent))`;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const semantic = safeMode
      ? ""
      : `
        html[data-codex-styler][data-codex-styler-mode="semantic"] {
          color-scheme: ${variant};
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] body,
        html[data-codex-styler][data-codex-styler-mode="semantic"] body > div:first-child {
          background: transparent !important;
          color: ${appearance.text};
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] aside.app-shell-left-panel {
          color: ${appearance.text} !important;
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
          color: ${appearance.text} !important;
          background-color: color-mix(in srgb, ${appearance.surface} ${quietSurfacePercent}%, ${background.color}) !important;
          background-image: ${backgroundImage} !important;
          background-position: center, ${background.position.x}% ${background.position.y}% !important;
          background-repeat: no-repeat !important;
          background-size: cover !important;
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
          box-shadow: 0 1px 0 color-mix(in srgb, ${appearance.text} 5%, transparent), 0 14px 40px rgb(0 0 0 / 9%) !important;
          backdrop-filter: saturate(1.08) blur(${appearance.focusBlur}px) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .composer-surface-chrome:focus-within {
          border-color: color-mix(in srgb, ${appearance.accent} 55%, ${appearance.border}) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, ${appearance.accent} 14%, transparent), 0 18px 50px rgb(0 0 0 / 12%) !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] .ProseMirror {
          color: ${appearance.text} !important;
          caret-color: ${appearance.accent} !important;
        }
        html[data-codex-styler][data-codex-styler-mode="semantic"] button[class~="bg-token-foreground"] {
          color: ${appearance.surface} !important;
          background: ${appearance.accent} !important;
          box-shadow: 0 6px 18px color-mix(in srgb, ${appearance.accent} 22%, transparent) !important;
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
      #${BACKDROP_ID} {
        position: fixed; inset: 0; z-index: -1; pointer-events: none;
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
        position: absolute; pointer-events: none; user-select: none;
        filter: drop-shadow(0 10px 18px rgb(0 0 0 / 18%));
      }
      #${ENTITY_ID} .cs-entity-image { object-fit: contain; }
      ${semantic}
    `;
    document.head.appendChild(style);
  };

  const updatePageKind = () => {
    const home =
      document.querySelector('[data-testid="home-icon"]') ||
      (document.querySelector('[data-feature="game-source"]') &&
        document.querySelector('.group\\/home-suggestions'));
    document.documentElement.setAttribute(
      "data-codex-styler-page",
      home ? "home" : "task",
    );
  };

  const installEntity = (root, theme, variant) => {
    const entity = theme.scene.entities?.[0];
    if (!entity) return;

    if (entity.renderer.type === "image") {
      const image = document.createElement("img");
      image.className = "cs-entity-image";
      image.src = entity.renderer.asset;
      image.alt = "";
      image.style.width = `${Math.max(24, entity.size)}px`;
      image.style.height = "auto";
      image.style.left = `${entity.anchor.x}%`;
      image.style.top = `${entity.anchor.y}%`;
      image.style.opacity = String(entity.opacity);
      image.style.transform = "translate(-50%, -50%)";
      root.appendChild(image);
      return;
    }

    const canvas = document.createElement("canvas");
    const size = Math.max(24, entity.size);
    const aspect = entity.renderer.frameHeight / entity.renderer.frameWidth;
    const pixelRatio = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.ceil(size * pixelRatio);
    canvas.height = Math.ceil(size * aspect * pixelRatio);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * aspect}px`;
    canvas.style.left = `${entity.anchor.x}%`;
    canvas.style.top = `${entity.anchor.y}%`;
    canvas.style.opacity = String(entity.opacity);
    canvas.style.transform = "translate(-50%, -50%)";
    root.appendChild(canvas);

    const image = new Image();
    image.src = entity.renderer.asset;
    const context = canvas.getContext("2d");
    const targetFps = Math.min(60, Math.max(12, theme.variants[variant].motion?.targetFps || 30));
    const frameInterval = 1000 / targetFps;
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
      const renderer = entity.renderer;
      const column = frame % renderer.columns;
      const row = Math.floor(frame / renderer.columns);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        column * renderer.frameWidth,
        row * renderer.frameHeight,
        renderer.frameWidth,
        renderer.frameHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      lastDraw = timestamp;
      animationFrame = null;
    };
    const scheduleDraw = () => {
      if (animationFrame === null) animationFrame = requestAnimationFrame(draw);
    };
    image.addEventListener("load", scheduleDraw, { once: true });
    if (image.complete) scheduleDraw();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && entity.behaviors.includes("look-at-pointer")) {
      pointerHandler = (event) => {
        const bounds = canvas.getBoundingClientRect();
        const angle = Math.atan2(
          event.clientY - (bounds.top + bounds.height / 2),
          event.clientX - (bounds.left + bounds.width / 2),
        );
        const normalized = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        pendingFrame =
          Math.round(normalized / ((Math.PI * 2) / entity.renderer.directions)) %
          entity.renderer.directions;
        scheduleDraw();
      };
      window.addEventListener("pointermove", pointerHandler, { passive: true });
    }
    resizeHandler = scheduleDraw;
    window.addEventListener("resize", resizeHandler, { passive: true });
  };

  const verifySemanticAdapter = () => {
    const sidebar = document.querySelector("aside.app-shell-left-panel");
    const main = document.querySelector("main.main-surface");
    if (!sidebar) return { ok: false, reason: "sidebar anchor was not found" };
    if (!main) return { ok: false, reason: "main workspace anchor was not found" };
    if (!document.getElementById(STYLE_ID)) {
      return { ok: false, reason: "runtime stylesheet was removed" };
    }
    const mainStyle = getComputedStyle(main);
    if (
      mainStyle.backgroundColor === "rgba(0, 0, 0, 0)" &&
      mainStyle.backgroundImage === "none"
    ) {
      return { ok: false, reason: "semantic surface style did not take effect" };
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
    mutationObserver.observe(document.documentElement, { childList: true, subtree: true });
  };

  const apply = async (theme, variant, compatibilityMode = "auto") => {
    assertSafeTheme(theme, variant);
    if (!["auto", "compatibility", "developer"].includes(compatibilityMode)) {
      throw new Error("Codex Styler rejected an invalid compatibility mode");
    }

    const themeRequestsSemantic = theme.compatibility?.codex?.mode === "semantic";
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
        reason: themeRequestsSemantic ? null : "theme requests isolated rendering",
      };
    }

    const resolvedMode = compatibilityMode === "developer" ? "developer" : "semantic";
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
    version: 3,
    apply,
    pause: remove,
    restore: remove,
  };
})();
