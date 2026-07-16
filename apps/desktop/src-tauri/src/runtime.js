(() => {
  if (window.__CODEX_STYLER_RUNTIME__?.version === 1) return;
  window.__CODEX_STYLER_RUNTIME__?.restore?.();

  const ROOT_ID = "codex-styler-scene-root";
  const STYLE_ID = "codex-styler-runtime-style";
  const HEX = /^#[0-9a-f]{6}$/i;
  const DATA_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
  let pointerHandler = null;
  let resizeHandler = null;
  let mutationObserver = null;
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
    if (entity) {
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
          !Number.isInteger(renderer.frameHeight))
      ) {
        throw new Error("Codex Styler rejected invalid sprite atlas data");
      }
      assertSafeImage(renderer.asset);
    }
  };

  const remove = () => {
    mutationObserver?.disconnect();
    mutationObserver = null;
    activeState = null;
    if (pointerHandler) window.removeEventListener("pointermove", pointerHandler);
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    pointerHandler = null;
    resizeHandler = null;
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.documentElement.removeAttribute("data-codex-styler");
  };

  const installStyles = (theme, variant, safeMode) => {
    const visual = theme.variants[variant];
    const appearance = visual.appearance;
    const background = visual.background;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    const semantic = safeMode
      ? ""
      : [
          "aside, main, [role='dialog'], [data-slot] {",
          "border-color: " + appearance.border + " !important;",
          "border-radius: " + appearance.radius + "px;",
          "}",
          "aside, [role='dialog'] {",
          "background: color-mix(in srgb, " + appearance.surface + " " + Math.round(appearance.surfaceOpacity * 100) + "%, transparent) !important;",
          "backdrop-filter: blur(" + appearance.focusBlur + "px) !important;",
          "}",
        ].join("");
    style.textContent = [
      "html[data-codex-styler], html[data-codex-styler] body {",
      "background: transparent !important;",
      "color: " + appearance.text + ";",
      "}",
      "#" + ROOT_ID + " {",
      "position: fixed; inset: 0; z-index: -1; pointer-events: none;",
      "overflow: hidden; background: " + background.color + ";",
      "}",
      "#" + ROOT_ID + " .cs-background {",
      "position: absolute; inset: -20px;",
      "background-color: " + background.color + ";",
      "background-image: " + (background.image ? "url('" + background.image + "')" : "none") + ";",
      "background-position: " + background.position.x + "% " + background.position.y + "%;",
      "background-size: cover;",
      "filter: brightness(" + background.brightness + ") blur(" + background.blur + "px);",
      "}",
      "#" + ROOT_ID + " .cs-overlay {",
      "position: absolute; inset: 0; background: " + background.overlay + ";",
      "opacity: " + background.overlayOpacity + ";",
      "}",
      "#" + ROOT_ID + " canvas { position: absolute; pointer-events: none; }",
      "#" + ROOT_ID + " .cs-entity-image { position: absolute; pointer-events: none; object-fit: contain; }",
      semantic,
    ].join("");
    document.head.appendChild(style);
  };

  const installEntity = (root, theme) => {
    const entity = theme.scene.entities && theme.scene.entities[0];
    if (!entity) return;

    if (entity.renderer.type === "image") {
      const image = document.createElement("img");
      image.className = "cs-entity-image";
      image.src = entity.renderer.asset;
      image.alt = "";
      image.width = Math.max(24, entity.size);
      image.style.width = Math.max(24, entity.size) + "px";
      image.style.height = "auto";
      image.style.left = entity.anchor.x + "%";
      image.style.top = entity.anchor.y + "%";
      image.style.opacity = String(entity.opacity);
      image.style.transform = "translate(-50%, -50%)";
      root.appendChild(image);
      return;
    }

    const canvas = document.createElement("canvas");
    const size = Math.max(24, entity.size);
    const aspect = entity.renderer.frameHeight / entity.renderer.frameWidth;
    canvas.width = Math.ceil(size * devicePixelRatio);
    canvas.height = Math.ceil(size * aspect * devicePixelRatio);
    canvas.style.width = size + "px";
    canvas.style.height = size * aspect + "px";
    canvas.style.left = entity.anchor.x + "%";
    canvas.style.top = entity.anchor.y + "%";
    canvas.style.opacity = String(entity.opacity);
    canvas.style.transform = "translate(-50%, -50%)";
    root.appendChild(canvas);

    const image = new Image();
    image.src = entity.renderer.asset;
    const context = canvas.getContext("2d");
    let frame = 0;

    const draw = () => {
      if (!context || !image.complete || !image.naturalWidth) return;
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
    };
    image.addEventListener("load", draw, { once: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced && entity.behaviors.includes("look-at-pointer")) {
      pointerHandler = (event) => {
        const bounds = canvas.getBoundingClientRect();
        const angle = Math.atan2(
          event.clientY - (bounds.top + bounds.height / 2),
          event.clientX - (bounds.left + bounds.width / 2),
        );
        const normalized = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
        frame =
          Math.round(
            normalized / ((Math.PI * 2) / entity.renderer.directions),
          ) % entity.renderer.directions;
        requestAnimationFrame(draw);
      };
      window.addEventListener("pointermove", pointerHandler, { passive: true });
    }
    resizeHandler = () => requestAnimationFrame(draw);
    window.addEventListener("resize", resizeHandler, { passive: true });
  };

  const apply = (theme, variant, safeMode) => {
    assertSafeTheme(theme, variant);
    remove();
    document.documentElement.setAttribute("data-codex-styler", theme.id);
    installStyles(theme, variant, safeMode);
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    const background = document.createElement("div");
    background.className = "cs-background";
    const overlay = document.createElement("div");
    overlay.className = "cs-overlay";
    root.append(background, overlay);
    document.body.appendChild(root);
    installEntity(root, theme);
    activeState = { theme, variant, safeMode: Boolean(safeMode) };
    mutationObserver = new MutationObserver(() => {
      if (
        activeState &&
        (!document.getElementById(ROOT_ID) || !document.getElementById(STYLE_ID))
      ) {
        const state = activeState;
        apply(state.theme, state.variant, state.safeMode);
      }
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    return { ok: true, themeId: theme.id, safeMode };
  };

  window.__CODEX_STYLER_RUNTIME__ = {
    version: 1,
    apply,
    pause: remove,
    restore: remove,
  };
})();
