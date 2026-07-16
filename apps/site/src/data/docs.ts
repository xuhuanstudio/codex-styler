export type SiteLocale = "en" | "zh-CN";

export interface DocPage {
  slug: string;
  title: Record<SiteLocale, string>;
  description: Record<SiteLocale, string>;
  eyebrow: Record<SiteLocale, string>;
  body: Record<SiteLocale, Array<{ heading: string; paragraphs: string[] }>>;
}

export const docs: DocPage[] = [
  {
    slug: "getting-started",
    title: {
      en: "Get started with Codex Styler",
      "zh-CN": "开始使用 Codex Styler",
    },
    description: {
      en: "Install Codex Styler, connect to OpenAI Codex Desktop through a temporary loopback session, and apply your first reversible theme.",
      "zh-CN": "安装 Codex Styler，通过临时本机回环会话连接 OpenAI Codex Desktop，并应用第一个可恢复主题。",
    },
    eyebrow: { en: "QUICKSTART / 3 MINUTES", "zh-CN": "快速开始 / 3 分钟" },
    body: {
      en: [
        {
          heading: "Download and install",
          paragraphs: [
            "Use Download Alpha in the site navigation to get the current macOS Apple Silicon DMG. It requires macOS 13 or later. Drag Codex Styler to Applications, then Control-click it and choose Open on first launch.",
            "The Alpha is ad-hoc signed but not signed with an Apple Developer ID or notarized. Do not disable Gatekeeper globally. Stable releases will not ship until macOS notarization and Windows code signing are both in place.",
            "Install OpenAI Codex Desktop separately. Codex Styler does not bundle, replace, patch, or redistribute the Codex application.",
          ],
        },
        {
          heading: "Apply a theme",
          paragraphs: [
            "Open Codex Styler, review the safety guide, choose a starting theme, and select Apply to Codex. If Codex is already open, close it so Styler can relaunch it with a random loopback debugging port.",
            "The connection lives only for that Codex process. Restoring or restarting Codex removes the visual runtime.",
          ],
        },
        {
          heading: "Return to official",
          paragraphs: [
            "Select Restore official at any time. Styler removes its isolated scene root and runtime style node, then leaves your Codex installation untouched.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "下载与安装",
          paragraphs: [
            "通过网站导航中的“下载 Alpha”获取当前 macOS Apple Silicon DMG，需要 macOS 13 或更高版本。把 Codex Styler 拖入“应用程序”，首次启动时按住 Control 点击并选择“打开”。",
            "该 Alpha 采用临时 ad-hoc 签名，但没有 Apple Developer ID 签名和公证。不要全局关闭 Gatekeeper；macOS 公证和 Windows 代码签名完成前不会发布稳定版。",
            "请单独安装 OpenAI Codex Desktop。Codex Styler 不捆绑、不替换、不修改也不分发 Codex 应用。",
          ],
        },
        {
          heading: "应用主题",
          paragraphs: [
            "打开 Codex Styler，阅读安全说明，选择起始主题并点击“应用到 Codex”。如果 Codex 已经打开，请先关闭，以便 Styler 使用随机本机回环端口重新启动。",
            "连接只属于当前 Codex 进程。恢复或正常重启 Codex 都会移除视觉运行时。",
          ],
        },
        {
          heading: "回到官方界面",
          paragraphs: [
            "随时选择“恢复官方界面”。Styler 会删除隔离的场景根节点和样式节点，不会触碰 Codex 安装文件。",
          ],
        },
      ],
    },
  },
  {
    slug: "create-theme",
    title: {
      en: "Create a Codex Desktop theme",
      "zh-CN": "创建 Codex Desktop 主题",
    },
    description: {
      en: "Use the guided editor or the public codex-styler-theme-v1 schema to build a local, data-only Codex Desktop theme.",
      "zh-CN": "使用引导式编辑器或公开的 codex-styler-theme-v1 协议，制作纯数据的本地 Codex Desktop 主题。",
    },
    eyebrow: { en: "THEME FORMAT / V1", "zh-CN": "主题格式 / V1" },
    body: {
      en: [
        {
          heading: "Start visually",
          paragraphs: [
            "Duplicate one of the three built-in themes, then tune background focus, brightness, overlay, semantic surfaces, radius, motion, and companion size in the live preview.",
          ],
        },
        {
          heading: "A theme is data, not code",
          paragraphs: [
            "A .codex-styler-theme package contains theme.json, local PNG, JPEG, or WebP assets, and LICENSES.json. JavaScript, remote URLs, SVG, video, arbitrary CSS, and executable fonts are rejected.",
            "Use the checked-in JSON Schema and the theme validation command before sharing a package.",
          ],
        },
        {
          heading: "Design for restoration",
          paragraphs: [
            "Keep the workspace readable when the background fails or motion is reduced. Every theme must provide light and dark variants and remain usable in isolated safe mode.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "从可视化开始",
          paragraphs: [
            "复制三套内置主题中的任意一套，在实时预览中调整背景焦点、亮度、遮罩、语义表面、圆角、动态和伙伴尺寸。",
          ],
        },
        {
          heading: "主题是数据，不是代码",
          paragraphs: [
            ".codex-styler-theme 包只包含 theme.json、本地 PNG/JPEG/WebP 资源和 LICENSES.json。JavaScript、远程 URL、SVG、视频、任意 CSS 和可执行字体都会被拒绝。",
            "分享之前，请使用仓库内公开的 JSON Schema 和主题校验命令。",
          ],
        },
        {
          heading: "为恢复能力设计",
          paragraphs: [
            "即使背景加载失败或用户开启减少动态，工作区也必须保持清晰。每个主题都必须提供亮色和暗色版本，并可在隔离安全模式下使用。",
          ],
        },
      ],
    },
  },
  {
    slug: "interactive-scenes",
    title: {
      en: "Interactive 2D scenes for Codex Desktop",
      "zh-CN": "Codex Desktop 的 2D 互动场景",
    },
    description: {
      en: "Learn how Codex Styler separates scene layers, entities, renderers, and pointer-aware behaviors without capturing interface clicks.",
      "zh-CN": "了解 Codex Styler 如何拆分场景层、实体、渲染器和光标行为，同时不接管界面点击。",
    },
    eyebrow: { en: "SCENE ENGINE / 2D", "zh-CN": "场景引擎 / 2D" },
    body: {
      en: [
        {
          heading: "One abstraction, many characters",
          paragraphs: [
            "The scene model uses layers, entities, a renderer, and behavior declarations. Quiet Garden ships with a 16-direction original gecko atlas, but the same data model can host another animal, object, illustration style, or future built-in renderer.",
          ],
        },
        {
          heading: "Pointer awareness without interception",
          paragraphs: [
            "The injected scene has pointer-events disabled. A passive window listener measures the cursor angle relative to the entity anchor and maps it to a sprite frame. The entity never blocks a Codex control.",
          ],
        },
        {
          heading: "Motion that respects the device",
          paragraphs: [
            "Reduced-motion preferences freeze direction tracking. Rendering updates only when the pointer direction or viewport changes, avoiding an unnecessary permanent animation loop.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "一种抽象，替换任意角色",
          paragraphs: [
            "场景模型由图层、实体、渲染器和行为声明组成。静谧花园内置原创的 16 方向壁虎图集，但相同数据模型可以承载其他动物、物体、插画风格以及未来的内置渲染器。",
          ],
        },
        {
          heading: "感知光标，但不拦截点击",
          paragraphs: [
            "注入场景禁用 pointer-events。被动监听器计算光标相对实体锚点的角度，再映射到方向帧；互动实体不会遮挡任何 Codex 控件。",
          ],
        },
        {
          heading: "尊重设备的动态",
          paragraphs: [
            "减少动态模式会冻结方向跟随。渲染只在方向或视口变化时更新，避免没有必要的永久动画循环。",
          ],
        },
      ],
    },
  },
  {
    slug: "safety-and-restore",
    title: {
      en: "Safety and one-click restore",
      "zh-CN": "安全机制与一键恢复",
    },
    description: {
      en: "How Codex Styler avoids app bundle patching, restricts theme packages, and restores the official Codex Desktop interface.",
      "zh-CN": "Codex Styler 如何避免修改应用包、限制主题包能力并恢复官方 Codex Desktop 界面。",
    },
    eyebrow: { en: "TRUST MODEL", "zh-CN": "信任模型" },
    body: {
      en: [
        {
          heading: "No app bundle modification",
          paragraphs: [
            "Styler launches the installed Codex executable with a temporary remote debugging port bound to 127.0.0.1. It never edits app.asar, application resources, code signatures, or updater files.",
          ],
        },
        {
          heading: "A deliberately narrow package format",
          paragraphs: [
            "Theme imports are size-limited, type-sniffed, path-checked, and schema-validated. Packages cannot execute scripts or fetch remote resources.",
          ],
        },
        {
          heading: "Automatic verification and fallback",
          paragraphs: [
            "Automatic mode first applies semantic styling, verifies live anchors and computed surface styles, and falls back to the isolated background and scene layer only when the health check fails. Compatibility mode stays isolated; Developer mode bypasses automatic fallback.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "不修改应用包",
          paragraphs: [
            "Styler 使用绑定到 127.0.0.1 的临时调试端口启动已安装的 Codex 可执行文件，不修改 app.asar、应用资源、代码签名或更新文件。",
          ],
        },
        {
          heading: "刻意收窄的主题格式",
          paragraphs: [
            "主题导入会经过大小限制、类型嗅探、路径检查和 schema 校验，主题包不能执行脚本或加载远程资源。",
          ],
        },
        {
          heading: "自动验证与异常回退",
          paragraphs: [
            "自动模式会先应用语义样式、检查实时锚点与最终表面样式，只有健康检查失败时才回退到隔离的背景与场景层。兼容模式始终隔离，开发者模式则跳过自动回退。",
          ],
        },
      ],
    },
  },
  {
    slug: "compatibility",
    title: {
      en: "Codex Styler compatibility",
      "zh-CN": "Codex Styler 兼容性",
    },
    description: {
      en: "Platform, architecture, Codex version, and theme-format compatibility policy for Codex Styler.",
      "zh-CN": "Codex Styler 的平台、架构、Codex 版本和主题格式兼容策略。",
    },
    eyebrow: { en: "COMPATIBILITY MATRIX", "zh-CN": "兼容矩阵" },
    body: {
      en: [
        {
          heading: "Current alpha targets",
          paragraphs: [
            "The first verified target is macOS on Apple Silicon. Windows 11 x64 is the cross-platform beta target. A platform is not listed as supported until it passes installation, launch, sleep/wake, restore, upgrade, and uninstall checks on a real device.",
          ],
        },
        {
          heading: "Codex updates",
          paragraphs: [
            "Codex Desktop may change internal structure. Styler isolates selectors in an adapter and uses live health checks instead of blocking solely by version number. Failed checks fall back to the isolated compatibility layer.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "当前 Alpha 目标",
          paragraphs: [
            "第一个验证目标是 Apple Silicon macOS，Windows 11 x64 是跨平台 Beta 目标。只有在真实设备完成安装、启动、睡眠恢复、还原、升级和卸载测试后，平台才会被列为受支持。",
          ],
        },
        {
          heading: "Codex 更新",
          paragraphs: [
            "Codex Desktop 的内部结构可能变化。Styler 将选择器集中在适配器中，并使用实时健康检查，而不是只根据版本号阻止应用；检查失败时会回退到隔离兼容层。",
          ],
        },
      ],
    },
  },
  {
    slug: "troubleshooting",
    title: {
      en: "Troubleshoot Codex Styler",
      "zh-CN": "排查 Codex Styler 问题",
    },
    description: {
      en: "Resolve Codex detection, connection, theme import, visual compatibility, and restore issues.",
      "zh-CN": "解决 Codex 检测、连接、主题导入、视觉兼容和恢复问题。",
    },
    eyebrow: { en: "SUPPORT", "zh-CN": "问题排查" },
    body: {
      en: [
        {
          heading: "Codex is already running",
          paragraphs: [
            "Close Codex normally, then select Apply again. Styler never force-quits a process it did not start.",
          ],
        },
        {
          heading: "The theme package is rejected",
          paragraphs: [
            "Run the theme validator and inspect the exact path. Common causes are undeclared assets, remote URLs, unsupported file types, unsafe archive paths, or package size limits.",
          ],
        },
        {
          heading: "The interface changed after a Codex update",
          paragraphs: [
            "Restore the official interface, then switch to Compatibility mode if Automatic mode did not already fall back. Include the Codex and Styler versions in a GitHub issue, but do not attach personal workspace content or raw diagnostic logs without reviewing them.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "Codex 已经在运行",
          paragraphs: [
            "正常关闭 Codex，然后再次点击应用。Styler 不会强制退出并非由它启动的进程。",
          ],
        },
        {
          heading: "主题包被拒绝",
          paragraphs: [
            "运行主题校验命令并检查具体路径。常见原因包括未声明资源、远程 URL、不支持的文件类型、不安全归档路径或超出大小限制。",
          ],
        },
        {
          heading: "Codex 更新后界面变化",
          paragraphs: [
            "先恢复官方界面；如果自动模式尚未自行回退，再切换到兼容模式。提交 GitHub Issue 时附上 Codex 和 Styler 版本，但不要在未检查前上传个人工作区内容或原始诊断日志。",
          ],
        },
      ],
    },
  },
  {
    slug: "contributing",
    title: {
      en: "Contribute to Codex Styler",
      "zh-CN": "参与 Codex Styler",
    },
    description: {
      en: "Set up the repository, validate changes, contribute themes, and report compatibility findings.",
      "zh-CN": "配置仓库、验证变更、贡献主题并报告兼容性结果。",
    },
    eyebrow: { en: "OPEN SOURCE", "zh-CN": "开源协作" },
    body: {
      en: [
        {
          heading: "Choose a contribution",
          paragraphs: [
            "Code, adapter fixtures, accessible interface improvements, original themes, documentation, and real-device compatibility reports are all useful. Security reports belong in GitHub private vulnerability reporting.",
          ],
        },
        {
          heading: "Validate before opening a pull request",
          paragraphs: [
            "Run pnpm check and cargo test. Theme contributions must also include licensing metadata, provenance, light and dark variants, reduced-motion behavior, and preview assets.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "选择贡献方向",
          paragraphs: [
            "代码、适配器夹具、无障碍改进、原创主题、文档和真实设备兼容报告都很有价值。安全问题请使用 GitHub 私密漏洞报告。",
          ],
        },
        {
          heading: "提交 Pull Request 前验证",
          paragraphs: [
            "运行 pnpm check 和 cargo test。主题贡献还必须包含许可证信息、来源记录、亮暗版本、减少动态行为和预览资源。",
          ],
        },
      ],
    },
  },
];
