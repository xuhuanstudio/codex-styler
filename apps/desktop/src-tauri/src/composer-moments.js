(() => {
  const FACTORY_VERSION = 7;
  if (
    window.__CODEX_STYLER_CREATE_COMPOSER_MOMENTS__?.version === FACTORY_VERSION
  ) {
    return;
  }

  const ROOT_ID = "codex-styler-composer-moments";
  const STYLE_ID = "codex-styler-composer-moments-style";
  const GAME_IDS = new Set(["marbles", "claw", "toss", "balance", "route"]);
  const GAME_ASSET_URLS = window.__CODEX_STYLER_COMPOSER_ASSETS__ || {};
  const gameAssetImages = new Map();
  let runtimeLocale = "en";

  const copy = () => {
    const chinese = runtimeLocale === "zh-CN";
    return chinese
      ? {
          title: "配置玩法",
          trigger: "打开配置玩法",
          close: "关闭",
          marbles: "三段落珠",
          marblesDetail: "依次为模型、推理强度与速度落下一颗配置珠",
          claw: "配置胶囊机",
          clawDetail: "瞄准并抓取一枚写明三项真实参数的胶囊",
          toss: "三环锻造",
          tossDetail: "分别锁定模型、推理强度与速度，再锻造成配置",
          balance: "三轴控制台",
          balanceDetail: "直接调节模型、推理强度与响应速度",
          route: "任务航图",
          routeDetail: "先选模型引擎，再选择与任务意图匹配的航线",
          modePhysics: "物理",
          modeSkill: "操作",
          modeChance: "随机",
          modeTune: "调校",
          modeChoose: "选择",
          marbleHint: "第 1 / 3 段 · 选择模型落点",
          clawHint: "移动抓钩；每枚胶囊都对应完整的三项配置",
          tossHint: "点击转动三环；再次点击依次锁定，回车锻造",
          balanceHint:
            "点击上方选择模型；方向键调推理与速度，M 切换模型，回车确认",
          routeHint: "上下方向键选择模型，左右方向键选择任务航线，回车确认",
          stepModel: "模型落点",
          stepReasoning: "推理落点",
          stepSpeed: "速度落点",
          drop: "落珠",
          spin: "转动三环",
          lock: "锁定",
          forge: "锻造配置",
          selectModel: "选择模型引擎",
          selectedLoadout: "实时配置",
          reduced: "已按减少动态生成方案",
          caught: "已抓取配置",
          rolled: "配置结果",
          unavailable: "未识别到可安全调整的 Codex 配置",
          unavailableDetail:
            "未能安全读取当前配置。玩法不会猜测性修改，你可以明确选择改用官方设置。",
          preparing: "正在读取当前配置",
          preparingDetail: "玩法面板已接管入口，正在校准模型、推理强度与速度。",
          useOfficial: "改用官方设置",
          proposal: "配置结果",
          model: "模型",
          reasoning: "推理强度",
          speed: "速度",
          unchanged: "保持不变",
          apply: "应用这套配置",
          applying: "正在应用并验证…",
          applied: "配置已应用并验证",
          applyFailed: "未能验证配置，已停止继续修改",
          retry: "再玩一次",
          cancel: "取消",
          presetQuick: "快速检查",
          presetBalanced: "日常处理",
          presetDeep: "深度诊断",
          presetPrecision: "审慎复核",
          presetAdaptive: "代码构建",
        }
      : {
          title: "Configuration plays",
          trigger: "Open configuration plays",
          close: "Close",
          marbles: "Triple Drop",
          marblesDetail:
            "Drop one configuration marble for model, reasoning, and speed",
          claw: "Capsule Crane",
          clawDetail: "Aim for a capsule labelled with all three real settings",
          toss: "Loadout Forge",
          tossDetail:
            "Lock model, reasoning, and speed rings, then forge the result",
          balance: "Three-axis Console",
          balanceDetail:
            "Directly tune model, reasoning effort, and response speed",
          route: "Mission Map",
          routeDetail:
            "Choose an engine, then a reasoning-and-speed mission route",
          modePhysics: "Physics",
          modeSkill: "Skill",
          modeChance: "Chance",
          modeTune: "Tune",
          modeChoose: "Choose",
          marbleHint: "Stage 1 of 3 · Choose the model landing",
          clawHint: "Move the crane; every capsule contains a complete loadout",
          tossHint:
            "Spin three rings; click again to lock each, then press Enter",
          balanceHint:
            "Choose a model above; use arrows to tune, M to cycle models, Enter to confirm",
          routeHint:
            "Use up/down for model, left/right for mission route, then press Enter",
          stepModel: "Model landing",
          stepReasoning: "Reasoning landing",
          stepSpeed: "Speed landing",
          drop: "Drop",
          spin: "Spin rings",
          lock: "Lock",
          forge: "Forge loadout",
          selectModel: "Choose model engine",
          selectedLoadout: "Live loadout",
          reduced: "Configuration prepared without motion",
          caught: "Configuration caught",
          rolled: "Configuration result",
          unavailable: "No safely adjustable Codex configuration was found",
          unavailableDetail:
            "The current configuration could not be read safely. Nothing was guessed or changed.",
          preparing: "Reading current configuration",
          preparingDetail:
            "The play panel has taken over while model, reasoning, and speed are calibrated.",
          useOfficial: "Use official settings",
          proposal: "Configuration result",
          model: "Model",
          reasoning: "Reasoning effort",
          speed: "Speed",
          unchanged: "Keep current",
          apply: "Apply configuration",
          applying: "Applying and verifying…",
          applied: "Configuration applied and verified",
          applyFailed:
            "Could not verify the configuration; no further changes were made",
          retry: "Play again",
          cancel: "Cancel",
          presetQuick: "Quick check",
          presetBalanced: "Everyday task",
          presetDeep: "Deep diagnosis",
          presetPrecision: "Careful review",
          presetAdaptive: "Code build",
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

  const colorHue = (color) => {
    const { r, g, b } = parseHex(color);
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const delta = maximum - minimum;
    if (delta === 0) return 210;
    const hue =
      maximum === red
        ? ((green - blue) / delta) % 6
        : maximum === green
          ? (blue - red) / delta + 2
          : (red - green) / delta + 4;
    return (hue * 60 + 360) % 360;
  };

  const gameAsset = (name) => {
    if (!GAME_ASSET_URLS[name] || typeof Image === "undefined") return null;
    if (!gameAssetImages.has(name)) {
      const image = new Image();
      image.decoding = "async";
      image.src = GAME_ASSET_URLS[name];
      gameAssetImages.set(name, image);
    }
    const image = gameAssetImages.get(name);
    return image?.complete && image.naturalWidth > 0 ? image : null;
  };

  const drawGameAsset = (
    context,
    name,
    x,
    y,
    width,
    height,
    tint,
    alpha = 1,
  ) => {
    const image = gameAsset(name);
    if (!image) return false;
    const rotation = Math.round(colorHue(tint) - 210);
    context.save();
    context.globalAlpha = alpha;
    context.filter = `hue-rotate(${rotation}deg) saturate(.82)`;
    context.shadowColor = rgba(tint, 0.24 * alpha);
    context.shadowBlur = Math.min(width, height) * 0.22;
    context.drawImage(image, x, y, width, height);
    context.restore();
    return true;
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
      #@@{ROOT_ID} .csm-close:focus-visible,
      #@@{ROOT_ID} .csm-proposal-actions button:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--csm-accent) 76%, white);
        outline-offset: 2px;
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
      #@@{ROOT_ID} .csm-stage-state {
        position: absolute;
        inset: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-content: center;
        align-items: center;
        gap: 14px;
        padding: 22px 48px 20px 22px;
        background:
          radial-gradient(circle at 18% 50%, color-mix(in srgb, var(--csm-accent) 18%, transparent), transparent 34%),
          linear-gradient(135deg, color-mix(in srgb, var(--csm-surface) 96%, transparent), color-mix(in srgb, var(--csm-accent) 7%, var(--csm-surface)));
      }
      #@@{ROOT_ID} .csm-stage-state-mark {
        position: relative;
        width: 38px;
        height: 38px;
        border: 1px solid color-mix(in srgb, var(--csm-accent) 52%, var(--csm-border));
        border-radius: 50%;
        background: color-mix(in srgb, var(--csm-accent) 12%, var(--csm-surface));
        box-shadow: inset 0 1px color-mix(in srgb, white 12%, transparent);
      }
      #@@{ROOT_ID} .csm-stage-state-mark::before,
      #@@{ROOT_ID} .csm-stage-state-mark::after {
        position: absolute;
        content: "";
      }
      #@@{ROOT_ID} .csm-stage-state-mark::before {
        inset: 7px;
        border: 2px solid color-mix(in srgb, var(--csm-accent) 24%, transparent);
        border-top-color: color-mix(in srgb, var(--csm-accent) 90%, white);
        border-radius: 50%;
        animation: csm-calibrate 900ms linear infinite;
      }
      #@@{ROOT_ID} .csm-stage-state-mark::after {
        inset: 16px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--csm-accent) 78%, white);
        box-shadow: 0 0 12px color-mix(in srgb, var(--csm-accent) 64%, transparent);
      }
      #@@{ROOT_ID} .csm-stage-state-copy { min-width: 0; }
      #@@{ROOT_ID} .csm-stage-state h3,
      #@@{ROOT_ID} .csm-stage-state p { margin: 0; }
      #@@{ROOT_ID} .csm-stage-state h3 {
        color: var(--csm-text);
        font-size: 14px;
        font-weight: 680;
        letter-spacing: -.01em;
      }
      #@@{ROOT_ID} .csm-stage-state p {
        max-width: 48ch;
        margin-top: 5px;
        color: var(--csm-muted);
        font-size: 11px;
        line-height: 1.45;
      }
      #@@{ROOT_ID} .csm-stage-state-actions {
        grid-column: 2;
        display: flex;
        gap: 7px;
        margin-top: 3px;
      }
      #@@{ROOT_ID} .csm-stage-state-actions button {
        min-height: 30px;
        padding: 0 11px;
        border: 1px solid color-mix(in srgb, var(--csm-border) 76%, transparent);
        border-radius: max(9px, calc(var(--csm-radius) - 6px));
        color: var(--csm-text);
        background: color-mix(in srgb, var(--csm-text) 5%, transparent);
        cursor: pointer;
      }
      #@@{ROOT_ID} .csm-stage--unavailable .csm-stage-state-mark::before {
        inset: 13px 8px;
        border: 0;
        border-top: 2px solid var(--csm-muted);
        border-bottom: 2px solid var(--csm-muted);
        border-radius: 0;
        animation: none;
        transform: rotate(45deg);
      }
      #@@{ROOT_ID} .csm-stage--unavailable .csm-stage-state-mark::after {
        display: none;
      }
      @keyframes csm-calibrate { to { transform: rotate(360deg); } }
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
      #@@{ROOT_ID} .csm-proposal {
        position: absolute;
        inset: 0;
        display: grid;
        align-content: center;
        gap: 10px;
        padding: 18px 44px 16px 18px;
        background: color-mix(in srgb, var(--csm-surface) 94%, transparent);
      }
      #@@{ROOT_ID} .csm-proposal h3,
      #@@{ROOT_ID} .csm-proposal p {
        margin: 0;
      }
      #@@{ROOT_ID} .csm-proposal h3 {
        font-size: 14px;
        line-height: 1.25;
      }
      #@@{ROOT_ID} .csm-proposal-name {
        color: color-mix(in srgb, var(--csm-accent) 70%, var(--csm-text));
      }
      #@@{ROOT_ID} .csm-proposal-status {
        color: var(--csm-muted);
        font-size: 11px;
        line-height: 1.4;
      }
      #@@{ROOT_ID} .csm-config-diff {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin: 0;
      }
      #@@{ROOT_ID} .csm-config-diff div {
        min-width: 0;
        padding: 7px 8px;
        border: 1px solid color-mix(in srgb, var(--csm-border) 72%, transparent);
        border-radius: max(9px, calc(var(--csm-radius) - 6px));
        background: color-mix(in srgb, var(--csm-text) 4%, transparent);
      }
      #@@{ROOT_ID} .csm-config-diff dt,
      #@@{ROOT_ID} .csm-config-diff dd {
        overflow: hidden;
        margin: 0;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #@@{ROOT_ID} .csm-config-diff dt {
        color: var(--csm-muted);
        font-size: 9px;
      }
      #@@{ROOT_ID} .csm-config-diff dd {
        margin-top: 3px;
        font-size: 11px;
        font-weight: 650;
      }
      #@@{ROOT_ID} .csm-config-diff s {
        margin-right: 4px;
        color: var(--csm-muted);
        font-weight: 450;
        text-decoration-thickness: 1px;
      }
      #@@{ROOT_ID} .csm-proposal-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #@@{ROOT_ID} .csm-proposal-actions button {
        min-height: 30px;
        padding: 0 11px;
        border: 1px solid color-mix(in srgb, var(--csm-border) 76%, transparent);
        border-radius: max(9px, calc(var(--csm-radius) - 6px));
        color: var(--csm-text);
        background: color-mix(in srgb, var(--csm-text) 5%, transparent);
        cursor: pointer;
      }
      #@@{ROOT_ID} .csm-proposal-actions button[data-primary='true'] {
        border-color: color-mix(in srgb, var(--csm-accent) 64%, var(--csm-border));
        color: color-mix(in srgb, var(--csm-accent) 16%, var(--csm-text));
        background: color-mix(in srgb, var(--csm-accent) 24%, var(--csm-surface));
      }
      #@@{ROOT_ID} .csm-proposal-actions button:disabled {
        cursor: wait;
        opacity: .58;
      }
      @media (max-width: 520px) {
        #@@{ROOT_ID} .csm-config-diff { grid-template-columns: 1fr; }
        #@@{ROOT_ID} .csm-config-diff div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        #@@{ROOT_ID} .csm-config-diff dd { margin-top: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        #@@{ROOT_ID} .csm-stage-state-mark::before { animation: none; }
      }
    `.replaceAll("@@{ROOT_ID}", ROOT_ID);
    document.head.appendChild(style);
  };

  const createFactory = ({ resolveComposer, settingsAdapter }) => {
    let preferences = {
      mode: "disabled",
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
      },
      motionIntensity: 0.5,
      targetFps: 30,
    };
    let root = null;
    let trigger = null;
    let stage = null;
    let canvas = null;
    let stageLabel = null;
    let currentGame = null;
    let currentSnapshot = null;
    let currentPresets = [];
    let currentGameId = null;
    let launchRevision = 0;
    let frameRequest = null;
    const timers = new Set();
    let composer = null;
    let resizeObserver = null;

    const palette = () => preferences.palette;
    const motionScale = () => 0.72 + preferences.motionIntensity * 0.56;

    const presetName = (id) => {
      const labels = copy();
      return {
        quick: labels.presetQuick,
        balanced: labels.presetBalanced,
        deep: labels.presetDeep,
        precision: labels.presetPrecision,
        adaptive: labels.presetAdaptive,
      }[id];
    };

    const optionAt = (options, progress) =>
      options[Math.round((options.length - 1) * clamp(progress, 0, 1))] || null;

    const fieldOptions = (snapshot, field) => {
      const options = snapshot?.[field]?.options || [];
      if (options.length) return options;
      return [snapshot?.[field]?.current].filter(Boolean);
    };

    const currentOptionIndex = (snapshot, field) => {
      const options = fieldOptions(snapshot, field);
      const label = snapshot?.[field]?.current?.label;
      const index = options.findIndex((option) => option.label === label);
      return Math.max(0, index);
    };

    const outcomeFromIndices = (indices, name = null, source = "direct") => {
      const modelOptions = fieldOptions(currentSnapshot, "model");
      const reasoningOptions = fieldOptions(currentSnapshot, "reasoning");
      const speedOptions = fieldOptions(currentSnapshot, "speed");
      const model =
        modelOptions[clamp(indices.model, 0, modelOptions.length - 1)];
      const reasoning =
        reasoningOptions[
          clamp(indices.reasoning, 0, reasoningOptions.length - 1)
        ];
      const speed =
        speedOptions[clamp(indices.speed, 0, speedOptions.length - 1)];
      if (!model || !reasoning || !speed) return null;
      return {
        id: source,
        name:
          name ||
          [model.label, reasoning.label, speed.label]
            .filter(Boolean)
            .join(" · "),
        source,
        configuration: { model, reasoning, speed },
      };
    };

    const buildPresets = (snapshot) => {
      const models = fieldOptions(snapshot, "model");
      const reasoning = fieldOptions(snapshot, "reasoning");
      const speeds = fieldOptions(snapshot, "speed");
      if (!models.length || !reasoning.length || !speeds.length) return [];
      const currentModel = currentOptionIndex(snapshot, "model");
      const definitions = [
        { id: "quick", effort: 0, speed: 1 },
        { id: "balanced", effort: 0.34, speed: 0 },
        { id: "adaptive", effort: 0.58, speed: 1 },
        { id: "precision", effort: 0.78, speed: 0 },
        { id: "deep", effort: 1, speed: 0 },
      ];
      const seen = new Set();
      return definitions
        .map((definition, index) => {
          const model = models[(currentModel + index) % models.length];
          const targetReasoning = optionAt(reasoning, definition.effort);
          const targetSpeed = optionAt(speeds, definition.speed);
          const signature = [
            model?.label,
            targetReasoning?.label,
            targetSpeed?.label,
          ].join("|");
          if (
            !model ||
            !targetReasoning ||
            !targetSpeed ||
            seen.has(signature)
          ) {
            return null;
          }
          seen.add(signature);
          return {
            id: definition.id,
            name: presetName(definition.id),
            source: "profile",
            configuration: {
              model,
              reasoning: targetReasoning,
              speed: targetSpeed,
            },
          };
        })
        .filter(Boolean);
    };

    const selectPreset = (index) =>
      currentPresets[
        ((Math.round(index) % currentPresets.length) + currentPresets.length) %
          currentPresets.length
      ] || null;

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

    const closeStage = (restoreFocus = true, closeNativeMenu = true) => {
      launchRevision += 1;
      stopFrame();
      currentGame?.destroy?.();
      currentGame = null;
      stage?.remove();
      stage = null;
      canvas = null;
      stageLabel = null;
      currentSnapshot = null;
      currentPresets = [];
      currentGameId = null;
      if (closeNativeMenu) void settingsAdapter?.close?.();
      if (restoreFocus) trigger?.focus({ preventScroll: true });
    };

    const position = () => {
      if (!root) return;
      const nextTrigger = settingsAdapter?.resolveTrigger?.();
      if (nextTrigger instanceof HTMLElement) trigger = nextTrigger;
      const nextComposer = resolveComposer();
      if (nextComposer !== composer) {
        resizeObserver?.disconnect();
        composer = nextComposer;
        if (composer) resizeObserver?.observe(composer);
      }
      if (!composer?.isConnected) {
        closeStage(false);
        return;
      }
      const bounds = composer.getBoundingClientRect();

      if (stage) {
        const resultHeight = stage.classList.contains("csm-stage--result")
          ? window.innerWidth <= 520
            ? 286
            : 222
          : 0;
        const stateHeight =
          stage.classList.contains("csm-stage--loading") ||
          stage.classList.contains("csm-stage--unavailable")
            ? 148
            : 0;
        const minimumHeight = Math.max(
          resultHeight,
          stateHeight,
          Math.min(292, Math.max(236, window.innerHeight * 0.31)),
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

    const ensureRoot = () => {
      if (root?.isConnected) return;
      installStyles();
      root = document.createElement("div");
      root.id = ROOT_ID;
      root.dataset.version = String(FACTORY_VERSION);
      document.body.appendChild(root);
      updateRootPalette();
      window.addEventListener("resize", position, { passive: true });
      document.addEventListener("scroll", position, {
        capture: true,
        passive: true,
      });
      document.addEventListener("keydown", onKeyDown, true);
      document.addEventListener(
        "pointerdown",
        onNativeTriggerPointerDown,
        true,
      );
      document.addEventListener("click", onNativeTriggerClick, true);
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

    const gameName = (gameId) => {
      const labels = copy();
      return {
        marbles: labels.marbles,
        claw: labels.claw,
        toss: labels.toss,
        balance: labels.balance,
        route: labels.route,
      }[gameId];
    };

    const gameHint = (gameId) => {
      const labels = copy();
      return {
        marbles: labels.marbleHint,
        claw: labels.clawHint,
        toss: labels.tossHint,
        balance: labels.balanceHint,
        route: labels.routeHint,
      }[gameId];
    };

    const mountStage = (gameId) => {
      if (!root) return null;
      const labels = copy();
      stage = document.createElement("section");
      stage.className = "csm-stage csm-stage--loading";
      stage.setAttribute("role", "application");
      stage.tabIndex = 0;
      stage.setAttribute("aria-label", gameName(gameId));
      const state = document.createElement("div");
      state.className = "csm-stage-state";
      state.setAttribute("role", "status");
      const mark = document.createElement("span");
      mark.className = "csm-stage-state-mark";
      mark.setAttribute("aria-hidden", "true");
      const stateCopy = document.createElement("div");
      stateCopy.className = "csm-stage-state-copy";
      const title = document.createElement("h3");
      title.textContent = labels.preparing;
      const detail = document.createElement("p");
      detail.textContent = labels.preparingDetail;
      stateCopy.append(title, detail);
      state.append(mark, stateCopy);
      const close = document.createElement("button");
      close.type = "button";
      close.className = "csm-close";
      close.setAttribute("aria-label", labels.close);
      close.textContent = "×";
      close.addEventListener("click", () => closeStage());
      stage.append(state, close);
      root.appendChild(stage);
      position();
      stage.focus({ preventScroll: true });
      return stage;
    };

    const showUnavailable = () => {
      if (!stage) return;
      const labels = copy();
      stage.classList.remove("csm-stage--loading");
      stage.classList.add("csm-stage--unavailable");
      const state = stage.querySelector(".csm-stage-state");
      const title = state?.querySelector("h3");
      const detail = state?.querySelector("p");
      if (title) title.textContent = labels.unavailable;
      if (detail) detail.textContent = labels.unavailableDetail;
      const actions = document.createElement("div");
      actions.className = "csm-stage-state-actions";
      const official = document.createElement("button");
      official.type = "button";
      official.textContent = labels.useOfficial;
      official.addEventListener("click", async () => {
        closeStage(false, false);
        await settingsAdapter?.openOfficialMenu?.();
      });
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = labels.cancel;
      cancel.addEventListener("click", () => closeStage());
      actions.append(official, cancel);
      state?.append(actions);
      position();
      official.focus({ preventScroll: true });
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

    const drawPlayfield = (context, width, height, emphasis = 0.5) => {
      const colors = palette();
      const background = context.createLinearGradient(0, 0, width, height);
      background.addColorStop(0, mix(colors.surface, colors.accent, 0.035));
      background.addColorStop(
        0.58,
        mix(colors.surface, colors.accent, 0.075 + emphasis * 0.035),
      );
      background.addColorStop(1, mix(colors.surface, "#000000", 0.14));
      context.beginPath();
      context.rect?.(0, 0, width, height);
      if (!context.rect) roundedRect(context, 0, 0, width, height, 0);
      context.fillStyle = background;
      context.fill();

      const spacing = Math.max(28, Math.min(48, width / 12));
      context.save();
      context.strokeStyle = rgba(colors.text, 0.025 + emphasis * 0.016);
      context.lineWidth = 1;
      for (let x = spacing; x < width; x += spacing) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = spacing; y < height; y += spacing) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();

      const secondaryGlow = context.createRadialGradient(
        width * 0.14,
        height * 0.9,
        4,
        width * 0.14,
        height * 0.9,
        Math.max(width, height) * 0.42,
      );
      secondaryGlow.addColorStop(0, rgba(colors.success, 0.08));
      secondaryGlow.addColorStop(1, rgba(colors.success, 0));
      context.fillStyle = secondaryGlow;
      context.beginPath();
      context.rect?.(0, 0, width, height);
      if (!context.rect) roundedRect(context, 0, 0, width, height, 0);
      context.fill();

      const glow = context.createRadialGradient(
        width * 0.78,
        height * 0.18,
        2,
        width * 0.78,
        height * 0.18,
        Math.max(width, height) * 0.52,
      );
      glow.addColorStop(0, rgba(colors.accent, 0.14 + emphasis * 0.05));
      glow.addColorStop(1, rgba(colors.accent, 0));
      context.beginPath();
      context.arc(
        width * 0.78,
        height * 0.18,
        Math.max(width, height) * 0.52,
        0,
        Math.PI * 2,
      );
      context.fillStyle = glow;
      context.fill();

      roundedRect(context, 6.5, 6.5, width - 13, height - 13, 14);
      context.strokeStyle = rgba(colors.text, 0.075);
      context.lineWidth = 1;
      context.stroke();

      context.save();
      context.globalAlpha = 0.18;
      context.fillStyle = colors.accent;
      for (let x = 18; x < width - 16; x += 36) {
        context.beginPath();
        context.arc(x, height - 9, 0.7, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const defaultIndices = () => ({
      model: currentOptionIndex(currentSnapshot, "model"),
      reasoning: currentOptionIndex(currentSnapshot, "reasoning"),
      speed: currentOptionIndex(currentSnapshot, "speed"),
    });

    const indicesForConfiguration = (configuration = {}) => {
      const indices = {};
      ["model", "reasoning", "speed"].forEach((field) => {
        const options = fieldOptions(currentSnapshot, field);
        const target = configuration[field]?.label;
        indices[field] = Math.max(
          0,
          options.findIndex((option) => option.label === target),
        );
      });
      return indices;
    };

    const drawLoadoutStrip = (
      context,
      width,
      indices,
      activeField = null,
      top = 43,
    ) => {
      const colors = palette();
      const labels = copy();
      const fields = ["model", "reasoning", "speed"];
      const names = {
        model: labels.model,
        reasoning: labels.reasoning,
        speed: labels.speed,
      };
      const gap = 7;
      const left = 14;
      const available = Math.max(120, width - left * 2);
      const cellWidth = (available - gap * 2) / 3;
      fields.forEach((field, index) => {
        const options = fieldOptions(currentSnapshot, field);
        const selected =
          options[clamp(indices[field], 0, Math.max(0, options.length - 1))];
        const x = left + index * (cellWidth + gap);
        const active = field === activeField;
        roundedRect(context, x, top, cellWidth, 38, 10);
        context.fillStyle = active
          ? mix(colors.accent, colors.surface, 0.72)
          : rgba(colors.text, 0.045);
        context.fill();
        context.strokeStyle = active
          ? rgba(colors.accent, 0.84)
          : rgba(colors.border, 0.56);
        context.lineWidth = active ? 1.4 : 1;
        context.stroke();
        context.fillStyle = rgba(colors.mutedText, 0.9);
        context.font = "600 8px ui-sans-serif, system-ui, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        context.fillText(names[field], x + 9, top + 13, cellWidth - 18);
        context.fillStyle = rgba(colors.text, active ? 0.98 : 0.88);
        context.font = active
          ? "700 10px ui-sans-serif, system-ui, sans-serif"
          : "620 10px ui-sans-serif, system-ui, sans-serif";
        context.fillText(
          selected?.label || "—",
          x + 9,
          top + 29,
          cellWidth - 18,
        );
      });
    };

    const nearestOptionIndex = (options, progress) =>
      clamp(
        Math.round(clamp(progress, 0, 1) * Math.max(0, options.length - 1)),
        0,
        Math.max(0, options.length - 1),
      );

    const fieldDiff = (term, current, target) => {
      const wrapper = document.createElement("div");
      const name = document.createElement("dt");
      name.textContent = term;
      const value = document.createElement("dd");
      if (!target?.label || target.label === current?.label) {
        value.textContent = current?.label
          ? `${copy().unchanged} · ${current.label}`
          : copy().unchanged;
      } else {
        const before = document.createElement("s");
        before.textContent = current?.label || "—";
        value.append(before, document.createTextNode(target.label));
      }
      wrapper.append(name, value);
      return wrapper;
    };

    const showProposal = (preset) => {
      if (!stage || !preset) return;
      stage.classList.add("csm-stage--result");
      position();
      stopFrame();
      currentGame?.destroy?.();
      currentGame = null;
      if (canvas) canvas.hidden = true;
      stage.querySelector(".csm-proposal, .csm-static-result")?.remove();
      const labels = copy();
      setStageLabel(labels.proposal);
      const result = document.createElement("div");
      result.className = "csm-proposal";
      result.setAttribute("role", "group");
      result.setAttribute("aria-label", labels.proposal);
      const title = document.createElement("h3");
      const lead = document.createTextNode(labels.proposal + " · ");
      const presetLabel = document.createElement("span");
      presetLabel.className = "csm-proposal-name";
      presetLabel.textContent = preset.name;
      title.append(lead, presetLabel);
      const diff = document.createElement("dl");
      diff.className = "csm-config-diff";
      diff.append(
        fieldDiff(
          labels.model,
          currentSnapshot?.model?.current,
          preset.configuration.model,
        ),
        fieldDiff(
          labels.reasoning,
          currentSnapshot?.reasoning?.current,
          preset.configuration.reasoning,
        ),
        fieldDiff(
          labels.speed,
          currentSnapshot?.speed?.current,
          preset.configuration.speed,
        ),
      );
      const status = document.createElement("p");
      status.className = "csm-proposal-status";
      status.setAttribute("role", "status");
      const actions = document.createElement("div");
      actions.className = "csm-proposal-actions";
      const apply = document.createElement("button");
      apply.type = "button";
      apply.dataset.primary = "true";
      apply.textContent = labels.apply;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = labels.retry;
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.textContent = labels.cancel;
      apply.addEventListener("click", async () => {
        const buttons = [apply, retry, cancel];
        buttons.forEach((button) => {
          button.disabled = true;
        });
        status.textContent = labels.applying;
        const outcome = await settingsAdapter?.apply?.(preset.configuration);
        status.textContent = outcome?.ok ? labels.applied : labels.applyFailed;
        if (outcome?.ok) {
          apply.textContent = labels.applied;
          schedule(() => closeStage(), 1050);
        } else {
          buttons.forEach((button) => {
            button.disabled = false;
          });
          apply.focus({ preventScroll: true });
        }
      });
      retry.addEventListener("click", () => {
        const gameId = currentGameId;
        closeStage(false);
        start(gameId);
      });
      cancel.addEventListener("click", () => closeStage());
      actions.append(apply, retry, cancel);
      result.append(title, diff, status, actions);
      stage.appendChild(result);
      apply.focus({ preventScroll: true });
    };

    const staticResult = () => {
      if (!stage) return;
      canvas.hidden = true;
      setStageLabel(copy().reduced);
      const indices = defaultIndices();
      ["model", "reasoning", "speed"].forEach((field) => {
        const options = fieldOptions(currentSnapshot, field);
        if (options.length > 1)
          indices[field] = (indices[field] + 1) % options.length;
      });
      showProposal(
        outcomeFromIndices(indices, copy().selectedLoadout, "reduced-motion"),
      );
    };

    const drawBall = (context, ball) => {
      const colors = palette();
      if (
        drawGameAsset(
          context,
          "marble",
          ball.x - ball.radius * 1.18,
          ball.y - ball.radius * 1.18,
          ball.radius * 2.36,
          ball.radius * 2.36,
          ball.color,
        )
      ) {
        return;
      }
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
      const fields = ["model", "reasoning", "speed"];
      const selected = defaultIndices();
      let activeStep = 0;
      let ball = null;
      let aimProgress =
        (selected.model + 0.5) /
        Math.max(1, fieldOptions(currentSnapshot, "model").length);
      let lastTime = performance.now();
      let settled = false;

      const activeField = () => fields[activeStep];
      const activeOptions = () => fieldOptions(currentSnapshot, activeField());
      const stepLabel = () => {
        const labels = copy();
        return [labels.stepModel, labels.stepReasoning, labels.stepSpeed][
          activeStep
        ];
      };
      const updateHint = () => {
        setStageLabel(`${activeStep + 1} / 3 · ${stepLabel()}`);
      };
      updateHint();

      const drop = (progress) => {
        if (!viewport || ball) return;
        const options = activeOptions();
        aimProgress = clamp(progress, 0.035, 0.965);
        ball = {
          x: viewport.width * aimProgress,
          y: 101,
          radius: 11,
          vx: (aimProgress - 0.5) * 18 * scale,
          vy: 26 * scale,
          color:
            activeStep === 0
              ? colors.accent
              : activeStep === 1
                ? colors.warning
                : colors.success,
        };
        settled = false;
      };
      const completeStep = () => {
        if (settled) return;
        settled = true;
        const options = activeOptions();
        selected[activeField()] = nearestOptionIndex(
          options,
          ball.x / Math.max(1, viewport.width),
        );
        if (activeStep < 2) {
          schedule(() => {
            activeStep += 1;
            ball = null;
            aimProgress =
              (selected[activeField()] + 0.5) /
              Math.max(1, activeOptions().length);
            settled = false;
            updateHint();
          }, 220);
          return;
        }
        const outcome = outcomeFromIndices(
          selected,
          copy().selectedLoadout,
          "triple-drop",
        );
        schedule(() => showProposal(outcome), 300);
      };
      const resize = () => {
        viewport = prepareCanvas();
      };
      const pointerMove = (event) => {
        if (!viewport || ball) return;
        const bounds = canvas.getBoundingClientRect();
        const options = activeOptions();
        aimProgress = clamp(
          (event.clientX - bounds.left) / Math.max(1, bounds.width),
          0.035,
          0.965,
        );
        selected[activeField()] = nearestOptionIndex(options, aimProgress);
      };
      const pointer = (event) => {
        const bounds = canvas.getBoundingClientRect();
        drop((event.clientX - bounds.left) / Math.max(1, bounds.width));
      };
      const keyboard = (key) => {
        const field = activeField();
        const options = activeOptions();
        if (key === "ArrowLeft" || key === "ArrowRight") {
          selected[field] = clamp(
            selected[field] + (key === "ArrowLeft" ? -1 : 1),
            0,
            options.length - 1,
          );
          aimProgress = (selected[field] + 0.5) / Math.max(1, options.length);
          return true;
        }
        if (key === "Enter" || key === " ") {
          drop(selected[field] / Math.max(1, options.length - 1));
          return true;
        }
        return false;
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const delta = Math.min(0.032, (time - lastTime) / 1000);
        lastTime = time;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        drawPlayfield(context, width, height, 0.72);
        drawLoadoutStrip(context, width, selected, activeField());
        const options = activeOptions();
        const top = 94;
        const floor = height - 30;
        const laneWidth = width / Math.max(1, options.length);
        const boardTop = top + 34;
        const boardHeight = Math.max(36, floor - boardTop - 12);
        const pegRows = Math.max(2, Math.min(4, Math.floor(boardHeight / 31)));
        const pegs = [];
        for (let row = 0; row < pegRows; row += 1) {
          const offset = row % 2 === 0 ? 0.5 : 1;
          const columns = row % 2 === 0 ? options.length : options.length - 1;
          for (let column = 0; column < columns; column += 1) {
            pegs.push({
              x: laneWidth * (column + offset),
              y: boardTop + ((row + 1) / (pegRows + 1)) * boardHeight,
              row,
              column,
            });
          }
        }
        options.forEach((option, index) => {
          const x = index * laneWidth;
          const active = selected[activeField()] === index;
          roundedRect(
            context,
            x + 5,
            boardTop - 6,
            Math.max(8, laneWidth - 10),
            Math.max(28, floor - boardTop + 6),
            11,
          );
          context.fillStyle = active
            ? rgba(colors.accent, 0.14)
            : rgba(colors.text, 0.025);
          context.fill();
          context.strokeStyle = active
            ? rgba(colors.accent, 0.68)
            : rgba(colors.border, 0.38);
          context.stroke();
          context.fillStyle = rgba(colors.text, active ? 0.94 : 0.62);
          context.font = active
            ? "700 9px ui-sans-serif, system-ui, sans-serif"
            : "560 8px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "alphabetic";
          context.fillText(
            option.label,
            x + laneWidth / 2,
            height - 11,
            Math.max(28, laneWidth - 16),
          );
        });
        pegs.forEach((peg) => {
          context.beginPath();
          context.arc(peg.x, peg.y, 3.2, 0, Math.PI * 2);
          context.fillStyle = rgba(colors.text, 0.36);
          context.shadowColor = rgba(colors.accent, 0.3);
          context.shadowBlur = 5;
          context.fill();
          context.shadowBlur = 0;
          context.strokeStyle = rgba(colors.border, 0.72);
          context.stroke();
        });
        if (ball) {
          ball.vy += 620 * scale * delta;
          ball.x += ball.vx * delta;
          ball.y += ball.vy * delta;
          pegs.forEach((peg) => {
            const dx = ball.x - peg.x;
            const dy = ball.y - peg.y;
            const distance = Math.hypot(dx, dy);
            const minimum = ball.radius + 3.2;
            if (distance >= minimum || distance === 0 || ball.vy <= 0) return;
            const nx = dx / distance;
            const ny = dy / distance;
            ball.x = peg.x + nx * minimum;
            ball.y = peg.y + ny * minimum;
            const direction = (peg.row + peg.column + activeStep) % 2 ? 1 : -1;
            ball.vx = ball.vx * 0.72 + (nx * 92 + direction * 18) * scale;
            ball.vy = Math.max(42, Math.abs(ball.vy) * 0.54);
          });
          if (ball.x <= ball.radius || ball.x >= width - ball.radius) {
            ball.x = clamp(ball.x, ball.radius, width - ball.radius);
            ball.vx *= -0.58;
          }
          if (ball.y >= floor - ball.radius) {
            ball.y = floor - ball.radius;
            ball.vy *= -0.34;
            if (Math.abs(ball.vy) < 30) {
              ball.vy = 0;
              completeStep();
            }
          }
          drawBall(context, ball);
        } else {
          const preview = {
            x: width * aimProgress,
            y: 105,
            radius: 10,
            color:
              activeStep === 0
                ? colors.accent
                : activeStep === 1
                  ? colors.warning
                  : colors.success,
          };
          drawBall(context, preview);
          context.beginPath();
          context.moveTo(preview.x, preview.y + preview.radius + 4);
          context.lineTo(preview.x, boardTop - 7);
          context.strokeStyle = rgba(preview.color, 0.48);
          context.setLineDash([3, 4]);
          context.stroke();
          context.setLineDash([]);
        }
        nextFrame(frame);
      };
      nextFrame(frame);
      return { resize, pointer, pointerMove, keyboard, destroy: () => {} };
    };

    const createClaw = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const scale = motionScale();
      const nextFrame = createFrameScheduler();
      const prizes = currentPresets.map((preset, index) => ({
        preset,
        x: (index + 1) / (currentPresets.length + 1),
        y: 0.67 + (index % 2) * 0.055,
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
      const drawPrize = (context, x, y, color, selected, preset) => {
        const width = selected ? 76 : 68;
        const height = selected ? 36 : 32;
        context.save();
        context.translate(x, y);
        const assetSize = selected ? 58 : 50;
        const renderedAsset = drawGameAsset(
          context,
          "capsule",
          -assetSize / 2,
          -assetSize / 2 - 7,
          assetSize,
          assetSize,
          color,
          selected ? 1 : 0.9,
        );
        if (!renderedAsset) {
          roundedRect(
            context,
            -width / 2,
            -height / 2,
            width,
            height,
            height / 2,
          );
          const capsule = context.createLinearGradient(
            -width / 2,
            0,
            width / 2,
            0,
          );
          capsule.addColorStop(0, mix(color, colors.surface, 0.1));
          capsule.addColorStop(0.5, mix(color, "#ffffff", 0.18));
          capsule.addColorStop(0.501, mix(color, colors.surface, 0.32));
          capsule.addColorStop(1, mix(color, "#000000", 0.18));
          context.fillStyle = capsule;
          context.shadowColor = rgba(color, selected ? 0.54 : 0.2);
          context.shadowBlur = selected ? 14 : 6;
          context.fill();
          context.shadowBlur = 0;
          context.strokeStyle = rgba(colors.text, 0.24);
          context.stroke();
        }
        context.fillStyle = rgba(colors.text, 0.9);
        context.font = "700 8px ui-sans-serif, system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(preset.name, 0, renderedAsset ? 26 : -5, width + 8);
        context.fillStyle = rgba(colors.text, 0.68);
        context.font = "560 7px ui-sans-serif, system-ui, sans-serif";
        context.fillText(
          [
            preset.configuration.model?.label,
            preset.configuration.reasoning?.label,
            preset.configuration.speed?.label,
          ]
            .filter(Boolean)
            .join(" · "),
          0,
          renderedAsset ? 37 : 7,
          width + 14,
        );
        context.restore();
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        drawPlayfield(context, width, height, 0.58);
        const nearest = prizes.reduce((best, item) =>
          Math.abs(item.x - clawX) < Math.abs(best.x - clawX) ? item : best,
        );
        drawLoadoutStrip(
          context,
          width,
          indicesForConfiguration(nearest.preset.configuration),
          null,
          42,
        );
        if (phase === "aim") {
          clawX += (targetX - clawX) * clamp(0.1 + scale * 0.06, 0.12, 0.19);
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
            const capturedIndex = Math.max(0, prizes.indexOf(captured));
            schedule(() => showProposal(selectPreset(capturedIndex)), 420);
          }
        }
        const railY = 94;
        const clawTop = railY + 10;
        const clawBottom = clawTop + Math.max(48, height - railY - 58) * drop;
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
        context.lineTo(width * clawX, clawBottom - 11);
        context.stroke();
        if (
          !drawGameAsset(
            context,
            "claw",
            width * clawX - 29,
            clawBottom - 15,
            58,
            58,
            colors.accent,
          )
        ) {
          context.beginPath();
          context.arc(width * clawX - 7, clawBottom + 6, 8, -0.3, 1.3);
          context.arc(width * clawX + 7, clawBottom + 6, 8, 1.84, 3.45);
          context.stroke();
        }
        prizes.forEach((item) => {
          if (item === captured && phase !== "down") return;
          drawPrize(
            context,
            width * item.x,
            height * item.y,
            item.color,
            false,
            item.preset,
          );
        });
        if (captured) {
          drawPrize(
            context,
            width * clawX,
            Math.min(height - 48, clawBottom + 34),
            captured.color,
            true,
            captured.preset,
          );
        }
        if (phase !== "done") nextFrame(frame);
      };
      nextFrame(frame);
      return { resize, pointer, pointerMove, keyboard, destroy: () => {} };
    };

    const createToss = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const nextFrame = createFrameScheduler();
      const fields = ["model", "reasoning", "speed"];
      const selected = defaultIndices();
      const locked = { model: false, reasoning: false, speed: false };
      let spinning = false;
      let phase = 0;

      const resize = () => {
        viewport = prepareCanvas();
      };
      const finish = () => {
        const outcome = outcomeFromIndices(
          selected,
          copy().selectedLoadout,
          "loadout-forge",
        );
        setStageLabel(copy().forge);
        schedule(() => showProposal(outcome), 320);
      };
      const advance = () => {
        if (!spinning) {
          spinning = true;
          setStageLabel(copy().tossHint);
          return;
        }
        const field = fields.find((candidate) => !locked[candidate]);
        if (!field) return;
        locked[field] = true;
        const next = fields.find((candidate) => !locked[candidate]);
        setStageLabel(next ? `${copy().lock} · ${copy()[next]}` : copy().forge);
        if (!next) {
          spinning = false;
          finish();
        }
      };
      const pointer = () => advance();
      const keyboard = (key) => {
        if (key === "ArrowLeft" || key === "ArrowRight") {
          const field =
            fields.find((candidate) => !locked[candidate]) || "model";
          const options = fieldOptions(currentSnapshot, field);
          selected[field] =
            (selected[field] +
              (key === "ArrowLeft" ? -1 : 1) +
              options.length) %
            options.length;
          return true;
        }
        if (key === "Enter" || key === " ") {
          advance();
          return true;
        }
        return false;
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        drawPlayfield(context, width, height, 0.8);
        if (spinning) {
          phase += 1;
          fields.forEach((field, index) => {
            if (locked[field]) return;
            const options = fieldOptions(currentSnapshot, field);
            const cadence = [4, 6, 8][index];
            if (phase % cadence === 0) {
              selected[field] = (selected[field] + 1) % options.length;
            }
          });
        }
        drawLoadoutStrip(
          context,
          width,
          selected,
          fields.find((field) => !locked[field]) || null,
        );
        const labels = copy();
        const names = {
          model: labels.model,
          reasoning: labels.reasoning,
          speed: labels.speed,
        };
        const top = 98;
        const gap = 8;
        const rowHeight = Math.max(34, (height - top - 18 - gap * 2) / 3);
        fields.forEach((field, index) => {
          const options = fieldOptions(currentSnapshot, field);
          const option = options[selected[field]];
          const y = top + index * (rowHeight + gap);
          const isLocked = locked[field];
          roundedRect(context, 18, y, width - 36, rowHeight, 12);
          const reel = context.createLinearGradient(18, y, width - 18, y);
          reel.addColorStop(0, rgba(colors.text, 0.035));
          reel.addColorStop(0.5, rgba(colors.accent, isLocked ? 0.2 : 0.1));
          reel.addColorStop(1, rgba(colors.text, 0.035));
          context.fillStyle = reel;
          context.fill();
          context.strokeStyle = isLocked
            ? rgba(colors.success, 0.78)
            : rgba(colors.border, 0.56);
          context.lineWidth = isLocked ? 1.5 : 1;
          context.stroke();
          context.fillStyle = rgba(colors.mutedText, 0.84);
          context.font = "620 9px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "left";
          context.textBaseline = "middle";
          context.fillText(names[field], 30, y + rowHeight / 2, 72);
          context.fillStyle = rgba(colors.text, 0.96);
          context.font = "720 12px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.fillText(option?.label || "—", width / 2, y + rowHeight / 2);
          context.fillStyle = isLocked
            ? rgba(colors.success, 0.96)
            : rgba(colors.accent, 0.9);
          context.font = "680 8px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "right";
          context.fillText(
            isLocked ? labels.lock : spinning ? "•••" : labels.spin,
            width - 30,
            y + rowHeight / 2,
            78,
          );
        });
        nextFrame(frame);
      };
      nextFrame(frame);
      return { resize, pointer, keyboard, destroy: () => {} };
    };

    const createBalance = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const nextFrame = createFrameScheduler();
      const modelOptions = fieldOptions(currentSnapshot, "model");
      const reasoningOptions = fieldOptions(currentSnapshot, "reasoning");
      const speedOptions = fieldOptions(currentSnapshot, "speed");
      let reasoningIndex = Math.max(
        0,
        reasoningOptions.findIndex(
          (option) =>
            option.label === currentSnapshot?.reasoning?.current?.label,
        ),
      );
      let speedIndex = Math.max(
        0,
        speedOptions.findIndex(
          (option) => option.label === currentSnapshot?.speed?.current?.label,
        ),
      );
      let modelIndex = currentOptionIndex(currentSnapshot, "model");
      const resize = () => {
        viewport = prepareCanvas();
      };
      const choose = (clientX, clientY) => {
        if (!viewport) return;
        const bounds = canvas.getBoundingClientRect();
        const localY = clientY - bounds.top;
        if (localY >= 91 && localY <= 132) {
          modelIndex = nearestOptionIndex(
            modelOptions,
            (clientX - bounds.left - 18) / Math.max(1, bounds.width - 36),
          );
          return;
        }
        const insetX = 56;
        const gridRight = 22;
        reasoningIndex = clamp(
          Math.round(
            clamp(
              (clientX - bounds.left - insetX) /
                Math.max(1, bounds.width - insetX - gridRight),
              0,
              1,
            ) *
              (reasoningOptions.length - 1),
          ),
          0,
          reasoningOptions.length - 1,
        );
        speedIndex = clamp(
          Math.round(
            clamp((localY - 145) / Math.max(1, bounds.height - 175), 0, 1) *
              (speedOptions.length - 1),
          ),
          0,
          speedOptions.length - 1,
        );
      };
      const tunedPreset = () => {
        const reasoning = reasoningOptions[reasoningIndex];
        const speed =
          speedOptions[speedIndex] || currentSnapshot?.speed?.current;
        return {
          id: "tuned",
          name: copy().selectedLoadout,
          source: "three-axis-console",
          configuration: { model: modelOptions[modelIndex], reasoning, speed },
        };
      };
      const pointerMove = (event) => choose(event.clientX, event.clientY);
      const pointer = (event) => {
        choose(event.clientX, event.clientY);
        const bounds = canvas.getBoundingClientRect();
        if (event.clientY - bounds.top > 132) showProposal(tunedPreset());
      };
      const keyboard = (key) => {
        if (key === "ArrowLeft" || key === "ArrowRight") {
          reasoningIndex = clamp(
            reasoningIndex + (key === "ArrowLeft" ? -1 : 1),
            0,
            reasoningOptions.length - 1,
          );
          return true;
        }
        if (key === "ArrowUp" || key === "ArrowDown") {
          speedIndex = clamp(
            speedIndex + (key === "ArrowUp" ? -1 : 1),
            0,
            speedOptions.length - 1,
          );
          return true;
        }
        if (key === "m" || key === "M") {
          modelIndex = (modelIndex + 1) % modelOptions.length;
          return true;
        }
        if (key === "Enter" || key === " ") {
          showProposal(tunedPreset());
          return true;
        }
        return false;
      };
      const frame = () => {
        if (!viewport || !stage) return;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        drawPlayfield(context, width, height, 0.44);
        drawLoadoutStrip(
          context,
          width,
          { model: modelIndex, reasoning: reasoningIndex, speed: speedIndex },
          null,
        );
        const modelLeft = 18;
        const modelTop = 94;
        const modelGap = 6;
        const modelWidth =
          (width - modelLeft * 2 - modelGap * (modelOptions.length - 1)) /
          Math.max(1, modelOptions.length);
        modelOptions.forEach((model, index) => {
          const x = modelLeft + index * (modelWidth + modelGap);
          const active = index === modelIndex;
          roundedRect(context, x, modelTop, modelWidth, 32, 10);
          context.fillStyle = active
            ? rgba(colors.accent, 0.2)
            : rgba(colors.text, 0.035);
          context.fill();
          context.strokeStyle = active
            ? rgba(colors.accent, 0.82)
            : rgba(colors.border, 0.48);
          context.stroke();
          context.fillStyle = rgba(colors.text, active ? 0.96 : 0.64);
          context.font = active
            ? "700 9px ui-sans-serif, system-ui, sans-serif"
            : "560 8px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(
            model.label,
            x + modelWidth / 2,
            modelTop + 16,
            modelWidth - 10,
          );
        });
        const insetX = 56;
        const top = 145;
        const gridWidth = Math.max(80, width - insetX - 22);
        const gridHeight = Math.max(46, height - top - 34);
        const columnWidth = gridWidth / Math.max(1, reasoningOptions.length);
        const rowHeight = gridHeight / Math.max(1, speedOptions.length);
        speedOptions.forEach((speed, row) => {
          reasoningOptions.forEach((reasoning, column) => {
            const x = insetX + column * columnWidth + 3;
            const y = top + row * rowHeight + 3;
            const active = row === speedIndex && column === reasoningIndex;
            roundedRect(
              context,
              x,
              y,
              Math.max(8, columnWidth - 6),
              Math.max(8, rowHeight - 6),
              9,
            );
            context.fillStyle = active
              ? mix(colors.accent, colors.surface, 0.18)
              : rgba(colors.text, 0.045);
            context.shadowColor = rgba(colors.accent, active ? 0.46 : 0);
            context.shadowBlur = active ? 16 : 0;
            context.fill();
            context.shadowBlur = 0;
            context.strokeStyle = active
              ? rgba(colors.accent, 0.86)
              : rgba(colors.border, 0.5);
            context.stroke();
          });
          context.fillStyle = rgba(colors.mutedText, 0.88);
          context.font = "600 9px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "right";
          context.textBaseline = "middle";
          context.fillText(
            speed.label,
            insetX - 9,
            top + row * rowHeight + rowHeight / 2,
            insetX - 14,
          );
        });
        reasoningOptions.forEach((reasoning, column) => {
          context.fillStyle = rgba(colors.mutedText, 0.88);
          context.font = "600 9px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "alphabetic";
          context.fillText(
            reasoning.label,
            insetX + column * columnWidth + columnWidth / 2,
            height - 16,
            Math.max(28, columnWidth - 8),
          );
        });
        context.fillStyle = rgba(colors.mutedText, 0.82);
        context.font = "650 9px ui-sans-serif, system-ui, sans-serif";
        context.textBaseline = "alphabetic";
        context.textAlign = "left";
        context.fillText(copy().speed, 18, top - 13, insetX - 18);
        context.textAlign = "right";
        context.fillText(copy().reasoning, width - 22, top - 13, width / 2);
        nextFrame(frame);
      };
      nextFrame(frame);
      return { resize, pointer, pointerMove, keyboard, destroy: () => {} };
    };

    const createRoute = () => {
      let viewport = prepareCanvas();
      const colors = palette();
      const nextFrame = createFrameScheduler();
      const modelOptions = fieldOptions(currentSnapshot, "model");
      const reasoningOptions = fieldOptions(currentSnapshot, "reasoning");
      const speedOptions = fieldOptions(currentSnapshot, "speed");
      let modelIndex = currentOptionIndex(currentSnapshot, "model");
      let selected = Math.min(1, currentPresets.length - 1);
      const resize = () => {
        viewport = prepareCanvas();
      };
      const nodePositions = () =>
        currentPresets.map((_, index) => ({
          x: ((index + 1) / (currentPresets.length + 1)) * viewport.width,
          y:
            166 +
            Math.max(36, viewport.height - 190) *
              (index % 2 === 0 ? 0.62 : index % 3 === 0 ? 0.82 : 0.28),
        }));
      const routeOutcome = () => {
        const preset = selectPreset(selected);
        const reasoningIndex = Math.max(
          0,
          reasoningOptions.findIndex(
            (option) => option.label === preset?.configuration.reasoning?.label,
          ),
        );
        const speedIndex = Math.max(
          0,
          speedOptions.findIndex(
            (option) => option.label === preset?.configuration.speed?.label,
          ),
        );
        return outcomeFromIndices(
          { model: modelIndex, reasoning: reasoningIndex, speed: speedIndex },
          preset?.name || copy().selectedLoadout,
          "mission-map",
        );
      };
      const choose = (clientX, clientY) => {
        if (!viewport) return;
        const bounds = canvas.getBoundingClientRect();
        const x = clientX - bounds.left;
        const y = clientY - bounds.top;
        if (y >= 91 && y <= 132) {
          modelIndex = nearestOptionIndex(
            modelOptions,
            (x - 18) / Math.max(1, bounds.width - 36),
          );
          return;
        }
        const nodes = nodePositions();
        selected = nodes.reduce(
          (best, node, index) =>
            Math.hypot(node.x - x, node.y - y) < best.distance
              ? { index, distance: Math.hypot(node.x - x, node.y - y) }
              : best,
          { index: selected, distance: Number.POSITIVE_INFINITY },
        ).index;
      };
      const pointerMove = (event) => choose(event.clientX, event.clientY);
      const pointer = (event) => {
        choose(event.clientX, event.clientY);
        const bounds = canvas.getBoundingClientRect();
        if (event.clientY - bounds.top > 132) showProposal(routeOutcome());
      };
      const keyboard = (key) => {
        if (key === "ArrowLeft" || key === "ArrowRight") {
          selected =
            (selected +
              (key === "ArrowLeft" ? -1 : 1) +
              currentPresets.length) %
            currentPresets.length;
          return true;
        }
        if (key === "ArrowUp" || key === "ArrowDown") {
          modelIndex =
            (modelIndex + (key === "ArrowUp" ? -1 : 1) + modelOptions.length) %
            modelOptions.length;
          return true;
        }
        if (key === "Enter" || key === " ") {
          showProposal(routeOutcome());
          return true;
        }
        return false;
      };
      const frame = (time) => {
        if (!viewport || !stage) return;
        const { context, width, height } = viewport;
        context.clearRect(0, 0, width, height);
        drawPlayfield(context, width, height, 0.62);
        const activeOutcome = routeOutcome();
        drawLoadoutStrip(
          context,
          width,
          indicesForConfiguration(activeOutcome?.configuration),
          null,
        );
        const modelLeft = 18;
        const modelTop = 94;
        const modelGap = 6;
        const modelWidth =
          (width - modelLeft * 2 - modelGap * (modelOptions.length - 1)) /
          Math.max(1, modelOptions.length);
        modelOptions.forEach((model, index) => {
          const x = modelLeft + index * (modelWidth + modelGap);
          const active = modelIndex === index;
          roundedRect(context, x, modelTop, modelWidth, 31, 10);
          context.fillStyle = active
            ? rgba(colors.accent, 0.19)
            : rgba(colors.text, 0.035);
          context.fill();
          context.strokeStyle = active
            ? rgba(colors.accent, 0.78)
            : rgba(colors.border, 0.46);
          context.stroke();
          context.fillStyle = rgba(colors.text, active ? 0.96 : 0.65);
          context.font = active
            ? "700 8px ui-sans-serif, system-ui, sans-serif"
            : "560 8px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(
            model.label,
            x + modelWidth / 2,
            modelTop + 15.5,
            modelWidth - 10,
          );
        });
        const nodes = nodePositions();
        context.strokeStyle = rgba(colors.border, 0.7);
        context.lineWidth = 1.5;
        context.beginPath();
        nodes.forEach((node, index) => {
          if (index === 0) context.moveTo(node.x, node.y);
          else context.lineTo(node.x, node.y);
        });
        context.stroke();
        nodes.forEach((node, index) => {
          const active = index === selected;
          const pulse = active ? 1 + Math.sin(time / 220) * 0.08 : 1;
          const assetSize = (active ? 34 : 23) * pulse;
          if (
            !drawGameAsset(
              context,
              "beacon",
              node.x - assetSize / 2,
              node.y - assetSize / 2,
              assetSize,
              assetSize,
              colors.accent,
              active ? 1 : 0.74,
            )
          ) {
            context.beginPath();
            context.arc(
              node.x,
              node.y,
              (active ? 11 : 7) * pulse,
              0,
              Math.PI * 2,
            );
            context.fillStyle = active
              ? mix(colors.accent, "#ffffff", 0.16)
              : mix(colors.accent, colors.surface, 0.42);
            context.shadowColor = rgba(colors.accent, active ? 0.55 : 0.14);
            context.shadowBlur = active ? 14 : 5;
            context.fill();
            context.shadowBlur = 0;
          }
          context.fillStyle = rgba(colors.text, active ? 0.92 : 0.62);
          context.font = active
            ? "670 9px ui-sans-serif, system-ui, sans-serif"
            : "560 8px ui-sans-serif, system-ui, sans-serif";
          context.textAlign = "center";
          context.fillText(
            currentPresets[index]?.name || "",
            node.x,
            node.y + 24,
            Math.max(52, width / Math.max(4, currentPresets.length) - 8),
          );
        });
        nextFrame(frame);
      };
      nextFrame(frame);
      return { resize, pointer, pointerMove, keyboard, destroy: () => {} };
    };

    const start = async (gameId) => {
      if (!GAME_IDS.has(gameId) || !root || !composer?.isConnected) return;
      closeStage(false, false);
      currentGameId = gameId;
      mountStage(gameId);
      const requestedRevision = ++launchRevision;
      await settingsAdapter?.close?.();
      const snapshot = await settingsAdapter?.inspect?.();
      if (
        requestedRevision !== launchRevision ||
        !root?.isConnected ||
        !composer?.isConnected
      ) {
        return;
      }
      currentSnapshot = snapshot || null;
      currentPresets = buildPresets(currentSnapshot);
      if (!currentSnapshot?.available || currentPresets.length === 0) {
        showUnavailable();
        return;
      }
      if (!stage) return;
      stage.classList.remove("csm-stage--loading");
      stage.querySelector(".csm-stage-state")?.remove();
      stageLabel = document.createElement("span");
      stageLabel.className = "csm-stage-label";
      stageLabel.textContent = gameHint(gameId);
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      stage.prepend(canvas, stageLabel);
      position();
      stage.focus({ preventScroll: true });
      if (
        preferences.reduceMotion ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        staticResult();
        return;
      }
      currentGame =
        gameId === "marbles"
          ? createMarbles()
          : gameId === "claw"
            ? createClaw()
            : gameId === "toss"
              ? createToss()
              : gameId === "balance"
                ? createBalance()
                : createRoute();
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
      if (
        document.documentElement.hasAttribute(
          "data-codex-styler-adapter-keyboard",
        )
      ) {
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        onNativeTriggerKeyDown(event);
        if (event.defaultPrevented) return;
      }
      if (event.key === "Escape" && stage) {
        event.preventDefault();
        closeStage();
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") closeStage(false);
    }

    const interceptedTrigger = (event) => {
      if (
        preferences.mode === "disabled" ||
        !settingsAdapter?.isTriggerTarget?.(event.target)
      ) {
        return null;
      }
      const nativeTrigger = settingsAdapter.resolveTrigger?.();
      if (
        nativeTrigger?.dataset?.codexStylerAdapterBypass === "true" ||
        !(nativeTrigger instanceof HTMLElement)
      ) {
        return null;
      }
      return nativeTrigger;
    };

    function onNativeTriggerPointerDown(event) {
      const nativeTrigger = interceptedTrigger(event);
      if (!nativeTrigger) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      trigger = nativeTrigger;
      if (!stage) void start(preferences.mode);
    }

    function onNativeTriggerClick(event) {
      const nativeTrigger = interceptedTrigger(event);
      if (!nativeTrigger) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      trigger = nativeTrigger;
      if (!stage) void start(preferences.mode);
    }

    function onNativeTriggerKeyDown(event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      const nativeTrigger = interceptedTrigger(event);
      if (!nativeTrigger) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      trigger = nativeTrigger;
      if (!stage) void start(preferences.mode);
    }

    const configure = (next = {}) => {
      const nextPalette = next.palette || {};
      runtimeLocale = next.locale === "zh-CN" ? "zh-CN" : "en";
      preferences = {
        mode: GAME_IDS.has(next.mode)
          ? next.mode
          : next.enabled === true
            ? "marbles"
            : "disabled",
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
      if (preferences.mode === "disabled") {
        destroy();
        return;
      }
      ensureRoot();
      updateRootPalette();
      position();
    };

    const refresh = () => {
      if (preferences.mode === "disabled") return;
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
      document.removeEventListener(
        "pointerdown",
        onNativeTriggerPointerDown,
        true,
      );
      document.removeEventListener("click", onNativeTriggerClick, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root?.remove();
      document.getElementById(STYLE_ID)?.remove();
      root = null;
      trigger = null;
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
