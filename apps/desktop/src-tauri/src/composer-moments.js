(() => {
  const FACTORY_VERSION = 1;
  if (
    window.__CODEX_STYLER_CREATE_COMPOSER_MOMENTS__?.version === FACTORY_VERSION
  ) {
    return;
  }

  const ROOT_ID = "codex-styler-composer-moments";
  const STYLE_ID = "codex-styler-composer-moments-style";
  const GAME_IDS = new Set(["marbles", "claw", "toss"]);

  const copy = () => {
    const chinese = document.documentElement.lang
      .toLowerCase()
      .startsWith("zh");
    return chinese
      ? {
          title: "输入时刻",
          trigger: "打开输入时刻",
          close: "关闭",
          marbles: "滚珠漫游",
          marblesDetail: "点击投放主题滚珠",
          claw: "口袋抓取",
          clawDetail: "移动并点击落爪",
          toss: "幸运投掷",
          tossDetail: "点击投出幸运徽章",
          marbleHint: "点击任意位置继续投放",
          clawHint: "移动抓钩，点击落下",
          tossHint: "点击舞台投掷",
          reduced: "已使用减少动态结果",
          caught: "抓到了主题星标",
          rolled: "幸运结果",
        }
      : {
          title: "Composer moments",
          trigger: "Open composer moments",
          close: "Close",
          marbles: "Marble Drift",
          marblesDetail: "Drop theme-tinted marbles",
          claw: "Pocket Claw",
          clawDetail: "Aim, then click to catch",
          toss: "Lucky Toss",
          tossDetail: "Throw a tiny lucky token",
          marbleHint: "Click anywhere to drop another",
          clawHint: "Move the claw, then click to drop",
          tossHint: "Click the stage to toss",
          reduced: "Reduced-motion result",
          caught: "Theme star caught",
          rolled: "Lucky result",
        };
  };

  const clamp = (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value));

  const parseHex = (color) => {
    const match = /^#([0-9a-f]{6})$/i.exec(color || "");
    if (!match) return { r: 90, g: 132, b: 246 };
    return {
      r: parseInt(match[1].slice(0, 2), 16),
      g: parseInt(match[1].slice(2, 4), 16),
      b: parseInt(match[1].slice(4, 6), 16),
    };
  };

  const mix = (left, right, amount) => {
    const a = parseHex(left);
    const b = parseHex(right);
    const channel = (key) =>
      Math.round(a[key] * (1 - amount) + b[key] * amount)
        .toString(16)
        .padStart(2, "0");
    return "#" + channel("r") + channel("g") + channel("b");
  };

  const rgba = (color, alpha) => {
    const value = parseHex(color);
    return (
      "rgba(" + value.r + ", " + value.g + ", " + value.b + ", " + alpha + ")"
    );
  };

  const roundedRect = (context, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  };

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #@@{ROOT_ID} {
        --csm-accent: #5a84f6;
        --csm-surface: #171a21;
        --csm-text: #f4f6fb;
        --csm-muted: #a7adba;
        --csm-border: #3b4250;
        --csm-radius: 16px;
        --csm-surface-opacity: 94%;
        --csm-blur: 16px;
        position: fixed;
        inset: 0;
        z-index: 10;
        pointer-events: none;
        font-family: inherit;
        color: var(--csm-text);
      }
      #@@{ROOT_ID} [hidden] { display: none !important; }
      #@@{ROOT_ID} button {
        box-sizing: border-box;
        font: inherit;
      }
      #@@{ROOT_ID} .csm-trigger {
        position: fixed;
        display: grid;
        place-items: center;
        width: 34px;
        height: 27px;
        padding: 0;
        border: 1px solid color-mix(in srgb, var(--csm-accent) 42%, var(--csm-border));
        border-radius: 999px;
        color: color-mix(in srgb, var(--csm-accent) 76%, var(--csm-text));
        background:
          radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--csm-accent) 24%, transparent), transparent 38%),
          color-mix(in srgb, var(--csm-surface) var(--csm-surface-opacity), transparent);
        box-shadow:
          inset 0 1px color-mix(in srgb, white 8%, transparent),
          0 8px 22px rgb(0 0 0 / 16%);
        backdrop-filter: blur(var(--csm-blur)) saturate(1.12);
        pointer-events: auto;
        cursor: pointer;
        transform-origin: 30% 100%;
        transition:
          transform 150ms cubic-bezier(.22, 1, .36, 1),
          border-color 150ms ease,
          background-color 150ms ease;
      }
      #@@{ROOT_ID} .csm-trigger:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--csm-accent) 68%, var(--csm-border));
      }
      #@@{ROOT_ID} .csm-trigger:active { transform: translateY(0) scale(.94); }
      #@@{ROOT_ID} .csm-trigger:focus-visible,
      #@@{ROOT_ID} .csm-menu button:focus-visible,
      #@@{ROOT_ID} .csm-close:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--csm-accent) 76%, white);
        outline-offset: 2px;
      }
      #@@{ROOT_ID} .csm-spark {
        position: relative;
        width: 13px;
        height: 13px;
      }
      #@@{ROOT_ID} .csm-spark::before,
      #@@{ROOT_ID} .csm-spark::after {
        content: "";
        position: absolute;
        inset: 0;
        margin: auto;
        border-radius: 999px;
        background: currentColor;
      }
      #@@{ROOT_ID} .csm-spark::before { width: 3px; height: 13px; }
      #@@{ROOT_ID} .csm-spark::after { width: 13px; height: 3px; }
      #@@{ROOT_ID} .csm-menu {
        position: fixed;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
        width: min(410px, calc(100vw - 24px));
        padding: 8px;
        border: 1px solid color-mix(in srgb, var(--csm-border) 82%, transparent);
        border-radius: calc(var(--csm-radius) + 2px);
        color: var(--csm-text);
        background:
          linear-gradient(160deg, color-mix(in srgb, var(--csm-accent) 7%, transparent), transparent 52%),
          color-mix(in srgb, var(--csm-surface) var(--csm-surface-opacity), transparent);
        box-shadow:
          inset 0 1px color-mix(in srgb, white 7%, transparent),
          0 22px 58px rgb(0 0 0 / 24%);
        backdrop-filter: blur(var(--csm-blur)) saturate(1.16);
        pointer-events: auto;
        transform-origin: 9% 100%;
      }
      #@@{ROOT_ID} .csm-menu button {
        min-width: 0;
        min-height: 68px;
        padding: 10px;
        border: 1px solid transparent;
        border-radius: max(10px, calc(var(--csm-radius) - 5px));
        color: inherit;
        text-align: left;
        background: color-mix(in srgb, var(--csm-text) 4%, transparent);
        cursor: pointer;
        transition:
          transform 150ms cubic-bezier(.22, 1, .36, 1),
          background-color 150ms ease,
          border-color 150ms ease;
      }
      #@@{ROOT_ID} .csm-menu button:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--csm-accent) 30%, var(--csm-border));
        background: color-mix(in srgb, var(--csm-accent) 12%, transparent);
      }
      #@@{ROOT_ID} .csm-menu strong,
      #@@{ROOT_ID} .csm-menu small {
        display: block;
      }
      #@@{ROOT_ID} .csm-menu strong {
        margin-top: 7px;
        font-size: 12px;
        line-height: 1.15;
      }
      #@@{ROOT_ID} .csm-menu small {
        margin-top: 3px;
        overflow: hidden;
        color: var(--csm-muted);
        font-size: 10px;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #@@{ROOT_ID} .csm-menu-art {
        display: flex;
        align-items: center;
        width: 28px;
        height: 18px;
        color: var(--csm-accent);
      }
      #@@{ROOT_ID} .csm-menu-art--marbles {
        gap: 2px;
      }
      #@@{ROOT_ID} .csm-menu-art--marbles i {
        width: 8px;
        height: 8px;
        border: 1px solid color-mix(in srgb, white 38%, transparent);
        border-radius: 50%;
        background: var(--csm-accent);
        box-shadow: inset 2px 2px 3px rgb(255 255 255 / 25%);
      }
      #@@{ROOT_ID} .csm-menu-art--marbles i:nth-child(2) {
        background: color-mix(in srgb, var(--csm-accent) 58%, white);
        transform: translateY(4px);
      }
      #@@{ROOT_ID} .csm-menu-art--marbles i:nth-child(3) {
        background: color-mix(in srgb, var(--csm-accent) 55%, #f3b94c);
      }
      #@@{ROOT_ID} .csm-menu-art--claw {
        position: relative;
        justify-content: center;
      }
      #@@{ROOT_ID} .csm-menu-art--claw::before {
        content: "";
        width: 2px;
        height: 10px;
        border-radius: 999px;
        background: currentColor;
        transform: translateY(-4px);
      }
      #@@{ROOT_ID} .csm-menu-art--claw::after {
        content: "";
        position: absolute;
        bottom: 1px;
        width: 14px;
        height: 8px;
        border: solid currentColor;
        border-width: 0 2px 2px;
        border-radius: 0 0 9px 9px;
      }
      #@@{ROOT_ID} .csm-menu-art--toss {
        justify-content: center;
      }
      #@@{ROOT_ID} .csm-menu-art--toss::before {
        content: "";
        width: 13px;
        height: 13px;
        border: 2px solid currentColor;
        border-radius: 4px;
        box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--csm-accent) 18%, transparent);
        transform: rotate(17deg);
      }
      #@@{ROOT_ID} .csm-stage {
        position: fixed;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--csm-accent) 38%, var(--csm-border));
        border-radius: calc(var(--csm-radius) + 2px);
        color: var(--csm-text);
        background:
          radial-gradient(circle at 78% 18%, color-mix(in srgb, var(--csm-accent) 14%, transparent), transparent 34%),
          linear-gradient(150deg, color-mix(in srgb, var(--csm-surface) var(--csm-surface-opacity), transparent), color-mix(in srgb, var(--csm-accent) 6%, var(--csm-surface)));
        box-shadow:
          inset 0 1px color-mix(in srgb, white 8%, transparent),
          0 18px 48px rgb(0 0 0 / 20%);
        backdrop-filter: blur(var(--csm-blur)) saturate(1.12);
        pointer-events: auto;
        touch-action: none;
      }
      #@@{ROOT_ID} .csm-stage canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      #@@{ROOT_ID} .csm-stage-label {
        position: absolute;
        left: 12px;
        top: 10px;
        max-width: calc(100% - 64px);
        padding: 5px 8px;
        overflow: hidden;
        border: 1px solid color-mix(in srgb, var(--csm-border) 70%, transparent);
        border-radius: 999px;
        color: var(--csm-muted);
        background: color-mix(in srgb, var(--csm-surface) 78%, transparent);
        font-size: 10px;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
        pointer-events: none;
      }
      #@@{ROOT_ID} .csm-close {
        position: absolute;
        right: 8px;
        top: 7px;
        display: grid;
        place-items: center;
        width: 25px;
        height: 25px;
        padding: 0;
        border: 1px solid color-mix(in srgb, var(--csm-border) 72%, transparent);
        border-radius: 50%;
        color: var(--csm-muted);
        background: color-mix(in srgb, var(--csm-surface) 82%, transparent);
        cursor: pointer;
      }
      #@@{ROOT_ID} .csm-close:hover {
        color: var(--csm-text);
        background: color-mix(in srgb, var(--csm-accent) 13%, var(--csm-surface));
      }
      #@@{ROOT_ID} .csm-static-result {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        gap: 7px;
        text-align: center;
      }
      #@@{ROOT_ID} .csm-static-result b {
        color: color-mix(in srgb, var(--csm-accent) 68%, var(--csm-text));
        font-size: 32px;
        line-height: 1;
      }
      #@@{ROOT_ID} .csm-static-result span {
        color: var(--csm-muted);
        font-size: 11px;
      }
      @media (prefers-reduced-motion: reduce) {
        #@@{ROOT_ID} .csm-trigger,
        #@@{ROOT_ID} .csm-menu button {
          transition: none;
        }
        #@@{ROOT_ID} .csm-trigger:hover,
        #@@{ROOT_ID} .csm-menu button:hover {
          transform: none;
        }
      }
    `.replaceAll("@@{ROOT_ID}", ROOT_ID);
    document.head.appendChild(style);
  };

  const createFactory = ({ resolveComposer }) => {
    let preferences = {
      enabled: false,
      reduceMotion: false,
      palette: {
        accent: "#5a84f6",
        surface: "#171a21",
        text: "#f4f6fb",
        mutedText: "#a7adba",
        border: "#3b4250",
        radius: 16,
        surfaceOpacity: 0.94,
        focusBlur: 16,
        warning: "#e7ad52",
        success: "#58b88a",
        motionIntensity: 0.5,
        targetFps: 30,
      },
    };
    let root = null;
    let trigger = null;
    let menu = null;
    let stage = null;
    let canvas = null;
    let stageLabel = null;
    let currentGame = null;
    let frameRequest = null;
    const timers = new Set();
    let composer = null;
    let resizeObserver = null;
    let lastFocused = null;

    const palette = () => preferences.palette;
    const motionScale = () => 0.72 + preferences.motionIntensity * 0.56;

    const stopFrame = () => {
      if (frameRequest !== null) cancelAnimationFrame(frameRequest);
      frameRequest = null;
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    };

    const createFrameScheduler = () => {
      let lastFrameAt = 0;
      const interval = 1000 / clamp(preferences.targetFps, 24, 60);
      const queue = (callback) => {
        frameRequest = requestAnimationFrame((time) => {
          if (lastFrameAt && time - lastFrameAt < interval - 0.5) {
            queue(callback);
            return;
          }
          lastFrameAt = time;
          callback(time);
        });
      };
      return queue;
    };

    const closeMenu = (restoreFocus = false) => {
      if (!menu) return;
      menu.hidden = true;
      trigger?.setAttribute("aria-expanded", "false");
      if (restoreFocus) trigger?.focus({ preventScroll: true });
    };

    const closeStage = (restoreFocus = true) => {
      stopFrame();
      currentGame?.destroy?.();
      currentGame = null;
      stage?.remove();
      stage = null;
      canvas = null;
      stageLabel = null;
      if (restoreFocus) trigger?.focus({ preventScroll: true });
    };

    const position = () => {
      if (!root || !trigger) return;
      const nextComposer = resolveComposer();
      if (nextComposer !== composer) {
        resizeObserver?.disconnect();
        composer = nextComposer;
        if (composer) resizeObserver?.observe(composer);
      }
      if (!composer?.isConnected) {
        trigger.hidden = true;
        closeMenu();
        closeStage(false);
        return;
      }
      trigger.hidden = false;
      const bounds = composer.getBoundingClientRect();
      const triggerLeft = clamp(
        bounds.left + Math.max(14, Math.min(28, bounds.width * 0.08)),
        8,
        Math.max(8, window.innerWidth - 42),
      );
      trigger.style.left = triggerLeft + "px";
      trigger.style.top =
        clamp(bounds.top - 13, 6, window.innerHeight - 35) + "px";

      if (menu && !menu.hidden) {
        const width = Math.min(410, Math.max(290, bounds.width));
        menu.style.width = width + "px";
        menu.style.left =
          clamp(bounds.left, 8, Math.max(8, window.innerWidth - width - 8)) +
          "px";
        const menuHeight = menu.offsetHeight || 84;
        const preferredTop = bounds.top - menuHeight - 18;
        menu.style.top =
          clamp(
            preferredTop,
            8,
            Math.max(8, window.innerHeight - menuHeight - 8),
          ) + "px";
      }

      if (stage) {
        const minimumHeight = Math.min(
          132,
          Math.max(96, window.innerHeight * 0.16),
        );
        const height = Math.max(bounds.height, minimumHeight);
        const top = clamp(
          bounds.bottom - height,
          8,
          Math.max(8, window.innerHeight - height - 8),
        );
        const left = clamp(bounds.left, 8, window.innerWidth - 8);
        const width = Math.max(
          120,
          Math.min(bounds.width, window.innerWidth - left - 8),
        );
        stage.style.left = left + "px";
        stage.style.top = top + "px";
        stage.style.width = width + "px";
        stage.style.height = height + "px";
        currentGame?.resize?.();
      }
    };

    const updateRootPalette = () => {
      if (!root) return;
      const colors = palette();
      root.style.setProperty("--csm-accent", colors.accent);
      root.style.setProperty("--csm-surface", colors.surface);
      root.style.setProperty("--csm-text", colors.text);
      root.style.setProperty("--csm-muted", colors.mutedText);
      root.style.setProperty("--csm-border", colors.border);
      root.style.setProperty(
        "--csm-radius",
        clamp(colors.radius || 16, 10, 24) + "px",
      );
      root.style.setProperty(
        "--csm-surface-opacity",
        Math.round(clamp(colors.surfaceOpacity || 0.94, 0.76, 1) * 100) + "%",
      );
      root.style.setProperty(
        "--csm-blur",
        clamp(colors.focusBlur || 0, 0, 24) + "px",
      );
    };

    const menuArt = (id) => {
      const art = document.createElement("span");
      art.className = "csm-menu-art csm-menu-art--" + id;
      art.setAttribute("aria-hidden", "true");
      if (id === "marbles") art.innerHTML = "<i></i><i></i><i></i>";
      return art;
    };

    const createMenu = () => {
      const labels = copy();
      const element = document.createElement("div");
      element.className = "csm-menu";
      element.setAttribute("role", "menu");
      element.setAttribute("aria-label", labels.title);
      element.hidden = true;
      [
        ["marbles", labels.marbles, labels.marblesDetail],
        ["claw", labels.claw, labels.clawDetail],
        ["toss", labels.toss, labels.tossDetail],
      ].forEach(([id, title, detail]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.dataset.game = id;
        button.append(menuArt(id));
        const name = document.createElement("strong");
        name.textContent = title;
        const description = document.createElement("small");
        description.textContent = detail;
        button.append(name, description);
        button.addEventListener("click", () => start(id));
        element.appendChild(button);
      });
      return element;
    };

    const ensureRoot = () => {
      if (root?.isConnected) return;
      installStyles();
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.dataset.version = String(FACTORY_VERSION);
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "csm-trigger";
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", copy().trigger);
      trigger.title = copy().trigger;
      const spark = document.createElement("span");
      spark.className = "csm-spark";
      spark.setAttribute("aria-hidden", "true");
      trigger.appendChild(spark);
      menu = createMenu();
      root.append(trigger, menu);
      document.body.appendChild(root);
      updateRootPalette();

      trigger.addEventListener("click", () => {
        if (stage) {
          closeStage();
          return;
        }
        menu.hidden = !menu.hidden;
        trigger.setAttribute("aria-expanded", String(!menu.hidden));
        if (!menu.hidden) {
          lastFocused = document.activeElement;
          position();
          menu.querySelector("button")?.focus({ preventScroll: true });
        }
      });
      window.addEventListener("resize", position, { passive: true });
      document.addEventListener("scroll", position, {
        capture: true,
        passive: true,
      });
      document.addEventListener("keydown", onKeyDown, true);
      document.addEventListener("pointerdown", onDocumentPointerDown, true);
      document.addEventListener("visibilitychange", onVisibilityChange);
      resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(position);
      position();
    };

    const setStageLabel = (text) => {
      if (stageLabel) stageLabel.textContent = text;
    };

    const prepareCanvas = () => {
      if (!stage || !canvas) return null;
      const bounds = stage.getBoundingClientRect();
      const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { context, width, height, dpr };
    };

    const staticResult = (gameId) => {
      if (!stage) return;
      canvas.hidden = true;
      const labels = copy();
      const result = document.createElement("div");
      result.className = "csm-static-result";
      const symbol = document.createElement("b");
      const value =
        gameId === "claw"
          ? "✦"
          : gameId === "toss"
            ? String(1 + Math.floor(Math.random() * 6))
            : "● ● ●";
      symbol.textContent = value;
      const caption = document.createElement("span");
      caption.textContent = labels.reduced;
      result.append(symbol, caption);
      stage.appendChild(result);
      schedule(() => closeStage(), 1900);
    };

    const drawBall = (context, ball) => {
      const colors = palette();
      const gradient = context.createRadialGradient(
        ball.x - ball.radius * 0.32,
        ball.y - ball.radius * 0.38,
        1,
        ball.x,
        ball.y,
        ball.radius,
      );
      gradient.addColorStop(0, mix(ball.color, "#ffffff", 0.62));
      gradient.addColorStop(0.34, ball.color);
      gradient.addColorStop(1, mix(ball.color, "#000000", 0.34));
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = gradient;
      context.shadowColor = rgba(colors.accent, 0.28);
      context.shadowBlur = 10;
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = rgba(colors.text, 0.25);
      context.lineWidth = 1;
      context.stroke();
    };

    const createMarbles = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const scale = motionScale();
      const nextFrame = createFrameScheduler();
      const balls = [];
      let lastTime = performance.now();
      const ballColors = [
        colors.accent,
        mix(colors.accent, colors.warning, 0.62),
        mix(colors.accent, colors.success, 0.58),
        mix(colors.accent, "#ffffff", 0.44),
      ];
      const addBall = (x) => {
        if (!viewport || balls.length >= 12) return;
        const radius = 8 + Math.random() * 5;
        balls.push({
          x: clamp(
            x ?? viewport.width * (0.2 + Math.random() * 0.6),
            radius,
            viewport.width - radius,
          ),
          y: 28,
          radius,
          vx: (Math.random() - 0.5) * 105 * scale,
          vy: (24 + Math.random() * 42) * scale,
          color: ballColors[balls.length % ballColors.length],
        });
      };
      addBall();
      addBall();
      addBall();

      const resize = () => {
        viewport = prepareCanvas();
      };
      const pointer = (event) => {
        const bounds = canvas.getBoundingClientRect();
        addBall(event.clientX - bounds.left);
      };
      const keyboard = (key) => {
        if (key !== "Enter" && key !== " ") return false;
        addBall(
          viewport?.width
            ? viewport.width * (0.38 + Math.random() * 0.24)
            : undefined,
        );
        return true;
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const delta = Math.min(0.032, (time - lastTime) / 1000);
        lastTime = time;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        const floor = height - 14;
        context.strokeStyle = rgba(colors.border, 0.55);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(10, floor);
        context.quadraticCurveTo(width * 0.5, floor + 7, width - 10, floor - 1);
        context.stroke();
        balls.forEach((ball) => {
          ball.vy += 510 * scale * delta;
          ball.x += ball.vx * delta;
          ball.y += ball.vy * delta;
          if (ball.x < ball.radius + 6 || ball.x > width - ball.radius - 6) {
            ball.x = clamp(ball.x, ball.radius + 6, width - ball.radius - 6);
            ball.vx *= -0.74;
          }
          if (ball.y > floor - ball.radius) {
            ball.y = floor - ball.radius;
            ball.vy *= -0.62;
            ball.vx *= 0.985;
            if (Math.abs(ball.vy) < 18) ball.vy = 0;
          }
          drawBall(context, ball);
        });
        nextFrame(frame);
      };
      nextFrame(frame);
      schedule(() => closeStage(), 5600);
      return { resize, pointer, keyboard, destroy: () => {} };
    };

    const createClaw = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const scale = motionScale();
      const nextFrame = createFrameScheduler();
      const prizes = Array.from({ length: 6 }, (_, index) => ({
        x: 0.13 + index * 0.145,
        y: 0.79 + (index % 2) * 0.05,
        color:
          index % 3 === 0
            ? colors.warning
            : index % 3 === 1
              ? colors.accent
              : colors.success,
      }));
      let clawX = 0.5;
      let targetX = 0.5;
      let drop = 0;
      let phase = "aim";
      let captured = null;
      let startedAt = performance.now();

      const resize = () => {
        viewport = prepareCanvas();
      };
      const pointerMove = (event) => {
        if (!viewport || phase !== "aim") return;
        const bounds = canvas.getBoundingClientRect();
        targetX = clamp(
          (event.clientX - bounds.left) / bounds.width,
          0.09,
          0.91,
        );
      };
      const pointer = () => {
        if (phase === "aim") phase = "down";
      };
      const keyboard = (key) => {
        if (phase !== "aim") return false;
        if (key === "ArrowLeft" || key === "ArrowRight") {
          targetX = clamp(
            targetX + (key === "ArrowLeft" ? -0.1 : 0.1),
            0.09,
            0.91,
          );
          return true;
        }
        if (key === "Enter" || key === " ") {
          phase = "down";
          return true;
        }
        return false;
      };
      const drawPrize = (context, x, y, color, selected) => {
        const radius = selected ? 11 : 9;
        context.save();
        context.translate(x, y);
        context.rotate(Math.PI / 4);
        roundedRect(context, -radius, -radius, radius * 2, radius * 2, 4);
        context.fillStyle = mix(color, colors.surface, 0.18);
        context.shadowColor = rgba(color, selected ? 0.54 : 0.2);
        context.shadowBlur = selected ? 14 : 6;
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = rgba(colors.text, 0.24);
        context.stroke();
        context.restore();
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        if (phase === "aim") {
          clawX += (targetX - clawX) * clamp(0.1 + scale * 0.06, 0.12, 0.19);
          if (Math.abs(targetX - clawX) < 0.004) {
            targetX = 0.13 + Math.random() * 0.74;
          }
        } else if (phase === "down") {
          drop = Math.min(1, drop + 0.035 * scale);
          if (drop >= 1) {
            captured = prizes.reduce((best, item) =>
              Math.abs(item.x - clawX) < Math.abs(best.x - clawX) ? item : best,
            );
            phase = "up";
          }
        } else if (phase === "up") {
          drop = Math.max(0, drop - 0.03 * scale);
          if (drop <= 0) {
            phase = "done";
            setStageLabel(copy().caught);
            schedule(() => closeStage(), 1200);
          }
        }
        const railY = 26;
        const clawTop = railY + 10;
        const clawBottom = clawTop + (height - 70) * drop;
        context.strokeStyle = rgba(colors.border, 0.62);
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(12, railY);
        context.lineTo(width - 12, railY);
        context.stroke();
        context.strokeStyle = colors.accent;
        context.lineWidth = 2.4;
        context.beginPath();
        context.moveTo(width * clawX, railY);
        context.lineTo(width * clawX, clawBottom);
        context.stroke();
        context.beginPath();
        context.arc(width * clawX - 7, clawBottom + 6, 8, -0.3, 1.3);
        context.arc(width * clawX + 7, clawBottom + 6, 8, 1.84, 3.45);
        context.stroke();
        prizes.forEach((item) => {
          if (item === captured && phase !== "down") return;
          drawPrize(
            context,
            width * item.x,
            height * item.y,
            item.color,
            false,
          );
        });
        if (captured) {
          drawPrize(
            context,
            width * clawX,
            clawBottom + 17,
            captured.color,
            true,
          );
        }
        if (phase !== "done") nextFrame(frame);
      };
      nextFrame(frame);
      schedule(() => {
        if (phase === "aim") phase = "down";
      }, 4600);
      return { resize, pointer, pointerMove, keyboard, destroy: () => {} };
    };

    const createToss = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const scale = motionScale();
      const nextFrame = createFrameScheduler();
      let token = null;
      let result = 1 + Math.floor(Math.random() * 6);
      let lastTime = performance.now();
      let settledAt = null;
      const resize = () => {
        viewport = prepareCanvas();
      };
      const launch = (x) => {
        if (!viewport || token) return;
        const originX = clamp(x, 34, viewport.width - 34);
        token = {
          x: originX,
          y: viewport.height - 22,
          vx: (viewport.width * 0.5 - originX) * 1.1 * scale,
          vy: (-270 - Math.random() * 80) * scale,
          angle: 0,
          spin:
            (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 4) * scale,
        };
      };
      const pointer = (event) => {
        const bounds = canvas.getBoundingClientRect();
        launch(event.clientX - bounds.left);
      };
      const keyboard = (key) => {
        if (key !== "Enter" && key !== " ") return false;
        launch(viewport?.width ? viewport.width * 0.5 : 0);
        return true;
      };
      const drawToken = (context, value) => {
        context.save();
        context.translate(token.x, token.y);
        context.rotate(token.angle);
        const size = 17;
        const gradient = context.createLinearGradient(-size, -size, size, size);
        gradient.addColorStop(0, mix(colors.accent, "#ffffff", 0.6));
        gradient.addColorStop(0.5, mix(colors.accent, colors.warning, 0.35));
        gradient.addColorStop(1, mix(colors.accent, "#000000", 0.28));
        roundedRect(context, -size, -size, size * 2, size * 2, 8);
        context.fillStyle = gradient;
        context.shadowColor = rgba(colors.accent, 0.42);
        context.shadowBlur = 14;
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = rgba(colors.text, 0.38);
        context.stroke();
        context.fillStyle = mix(colors.text, colors.accent, 0.18);
        context.font = "700 13px ui-sans-serif, system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(value), 0, 1);
        context.restore();
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const delta = Math.min(0.032, (time - lastTime) / 1000);
        lastTime = time;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        const targetY = height - 18;
        context.strokeStyle = rgba(colors.border, 0.46);
        context.setLineDash([3, 5]);
        context.beginPath();
        context.ellipse(width / 2, targetY, 34, 7, 0, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
        if (token) {
          token.vy += 520 * scale * delta;
          token.x += token.vx * delta;
          token.y += token.vy * delta;
          token.angle += token.spin * delta;
          if (token.y > targetY - 17) {
            token.y = targetY - 17;
            token.vy *= -0.48;
            token.vx *= 0.72;
            token.spin *= 0.7;
            if (Math.abs(token.vy) < 34 && !settledAt) {
              settledAt = time;
              token.vy = 0;
              token.vx = 0;
              token.spin = 0;
              token.angle =
                Math.round(token.angle / (Math.PI / 2)) * (Math.PI / 2);
              setStageLabel(copy().rolled + ": " + result);
              schedule(() => closeStage(), 1500);
            }
          }
          if (token.x < 20 || token.x > width - 20) {
            token.x = clamp(token.x, 20, width - 20);
            token.vx *= -0.66;
          }
          drawToken(context, result);
        } else {
          context.fillStyle = rgba(colors.accent, 0.7);
          context.font = "600 11px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.fillText(copy().tossHint, width / 2, height / 2 + 10);
        }
        if (!settledAt) nextFrame(frame);
      };
      nextFrame(frame);
      schedule(() => closeStage(), 7200);
      return { resize, pointer, keyboard, destroy: () => {} };
    };

    const start = (gameId) => {
      if (!GAME_IDS.has(gameId) || !root || !composer?.isConnected) return;
      closeMenu();
      closeStage(false);
      const labels = copy();
      stage = document.createElement("section");
      stage.className = "csm-stage";
      stage.setAttribute("role", "application");
      stage.tabIndex = 0;
      stage.setAttribute(
        "aria-label",
        gameId === "marbles"
          ? labels.marbles
          : gameId === "claw"
            ? labels.claw
            : labels.toss,
      );
      stageLabel = document.createElement("span");
      stageLabel.className = "csm-stage-label";
      stageLabel.textContent =
        gameId === "marbles"
          ? labels.marbleHint
          : gameId === "claw"
            ? labels.clawHint
            : labels.tossHint;
      const close = document.createElement("button");
      close.type = "button";
      close.className = "csm-close";
      close.setAttribute("aria-label", labels.close);
      close.textContent = "×";
      close.addEventListener("click", () => closeStage());
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      stage.append(canvas, stageLabel, close);
      root.appendChild(stage);
      position();
      stage.focus({ preventScroll: true });
      if (
        preferences.reduceMotion ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        staticResult(gameId);
        return;
      }
      currentGame =
        gameId === "marbles"
          ? createMarbles()
          : gameId === "claw"
            ? createClaw()
            : createToss();
      stage.addEventListener("pointermove", (event) =>
        currentGame?.pointerMove?.(event),
      );
      stage.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        currentGame?.pointer?.(event);
      });
      stage.addEventListener("keydown", (event) => {
        if (currentGame?.keyboard?.(event.key)) event.preventDefault();
      });
    };

    function onKeyDown(event) {
      if (event.key === "Escape") {
        if (stage) {
          event.preventDefault();
          closeStage();
        } else if (menu && !menu.hidden) {
          event.preventDefault();
          closeMenu();
          if (lastFocused instanceof HTMLElement) {
            lastFocused.focus({ preventScroll: true });
          } else {
            trigger?.focus({ preventScroll: true });
          }
        }
        return;
      }
      if (!menu || menu.hidden) return;
      const buttons = [...menu.querySelectorAll("button")];
      if (!buttons.length) return;
      const currentIndex = Math.max(0, buttons.indexOf(document.activeElement));
      const direction =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (direction) {
        event.preventDefault();
        buttons[
          (currentIndex + direction + buttons.length) % buttons.length
        ].focus({ preventScroll: true });
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        buttons[event.key === "Home" ? 0 : buttons.length - 1].focus({
          preventScroll: true,
        });
      }
    }

    function onDocumentPointerDown(event) {
      if (!menu || menu.hidden) return;
      const target = event.target;
      if (
        target instanceof Node &&
        (menu.contains(target) || trigger?.contains(target))
      ) {
        return;
      }
      closeMenu();
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") closeStage(false);
    }

    const configure = (next = {}) => {
      const nextPalette = next.palette || {};
      preferences = {
        enabled: next.enabled === true,
        reduceMotion: next.reduceMotion === true,
        palette: {
          accent: nextPalette.accent || preferences.palette.accent,
          surface: nextPalette.surface || preferences.palette.surface,
          text: nextPalette.text || preferences.palette.text,
          mutedText: nextPalette.mutedText || preferences.palette.mutedText,
          border: nextPalette.border || preferences.palette.border,
          radius: Number.isFinite(nextPalette.radius)
            ? nextPalette.radius
            : preferences.palette.radius,
          surfaceOpacity: Number.isFinite(nextPalette.surfaceOpacity)
            ? nextPalette.surfaceOpacity
            : preferences.palette.surfaceOpacity,
          focusBlur: Number.isFinite(nextPalette.focusBlur)
            ? nextPalette.focusBlur
            : preferences.palette.focusBlur,
          warning: nextPalette.warning || preferences.palette.warning,
          success: nextPalette.success || preferences.palette.success,
        },
        motionIntensity: Number.isFinite(next.motionIntensity)
          ? clamp(next.motionIntensity, 0, 1)
          : preferences.motionIntensity,
        targetFps: Number.isFinite(next.targetFps)
          ? clamp(next.targetFps, 24, 60)
          : preferences.targetFps,
      };
      if (!preferences.enabled) {
        destroy();
        return;
      }
      ensureRoot();
      updateRootPalette();
      position();
    };

    const refresh = () => {
      if (!preferences.enabled) return;
      ensureRoot();
      position();
    };

    const destroy = () => {
      stopFrame();
      currentGame?.destroy?.();
      currentGame = null;
      resizeObserver?.disconnect();
      resizeObserver = null;
      window.removeEventListener("resize", position);
      document.removeEventListener("scroll", position, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onDocumentPointerDown, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root?.remove();
      document.getElementById(STYLE_ID)?.remove();
      root = null;
      trigger = null;
      menu = null;
      stage = null;
      canvas = null;
      stageLabel = null;
      composer = null;
    };

    return { configure, refresh, destroy, start };
  };

  createFactory.version = FACTORY_VERSION;
  window.__CODEX_STYLER_CREATE_COMPOSER_MOMENTS__ = createFactory;
})();
