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
      "zh-CN":
        "安装 Codex Styler，通过临时本机回环会话连接 OpenAI Codex Desktop，并应用第一个可恢复主题。",
    },
    eyebrow: { en: "QUICKSTART / 3 MINUTES", "zh-CN": "快速开始 / 3 分钟" },
    body: {
      en: [
        {
          heading: "Download and install",
          paragraphs: [
            "Use Download Alpha in the site navigation to choose the macOS Apple Silicon DMG or Windows 11 x64 installer EXE. On macOS, drag Codex Styler to Applications, then Control-click it and choose Open on first launch. On Windows, run the per-user NSIS installer.",
            "The macOS Alpha is ad-hoc signed but not notarized, and the Windows Alpha is not Authenticode-signed. Verify the published checksum and provenance before continuing. Do not disable Gatekeeper or SmartScreen globally.",
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
            "通过网站导航中的“下载 Alpha”选择 macOS Apple Silicon DMG 或 Windows 11 x64 安装 EXE。macOS 上把 Codex Styler 拖入“应用程序”，首次启动时按住 Control 点击并选择“打开”；Windows 上运行按用户安装的 NSIS 安装程序。",
            "macOS Alpha 采用临时 ad-hoc 签名但尚未公证，Windows Alpha 尚无 Authenticode 签名。继续前请核对 Release 中的校验和与构建证明，不要全局关闭 Gatekeeper 或 SmartScreen。",
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
      "zh-CN":
        "使用引导式编辑器或公开的 codex-styler-theme-v1 协议，制作纯数据的本地 Codex Desktop 主题。",
    },
    eyebrow: { en: "THEME FORMAT / V1", "zh-CN": "主题格式 / V1" },
    body: {
      en: [
        {
          heading: "Start visually",
          paragraphs: [
            "Import a local image to generate four curated visual directions from its luminance, dominant color, accent, and contrast. Then refine layout, icon treatment, details, surfaces, radius, motion, and companion placement in the live preview.",
          ],
        },
        {
          heading: "A theme is data, not code",
          paragraphs: [
            "A .codex-styler-theme package contains theme.json, local PNG, JPEG, or WebP assets, and LICENSES.json. JavaScript, remote URLs, SVG, video, arbitrary CSS, and executable fonts are rejected.",
            "The compact appearance colors generate a complete accessible palette for surfaces, controls, interaction states, code, diffs, terminals, charts, and status feedback. Advanced packages may override stable semantic roles without depending on Codex CSS variables.",
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
            "导入本地图片后，根据明暗、主色、强调色和对比度生成四套经过设计的视觉方向，再在实时预览中调整布局、图标处理、细节、表面、圆角、动态和伙伴位置。",
          ],
        },
        {
          heading: "主题是数据，不是代码",
          paragraphs: [
            ".codex-styler-theme 包只包含 theme.json、本地 PNG/JPEG/WebP 资源和 LICENSES.json。JavaScript、远程 URL、SVG、视频、任意 CSS 和可执行字体都会被拒绝。",
            "基础外观色会自动推导出覆盖表面、控件、交互状态、代码、Diff、终端、图表和状态反馈的完整可读色板；高级主题也可覆写稳定的语义角色，而不依赖 Codex 私有 CSS 变量。",
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
      "zh-CN":
        "了解 Codex Styler 如何拆分场景层、实体、渲染器和光标行为，同时不接管界面点击。",
    },
    eyebrow: { en: "SCENE ENGINE / 2D", "zh-CN": "场景引擎 / 2D" },
    body: {
      en: [
        {
          heading: "One abstraction, many characters",
          paragraphs: [
            "The scene model uses layers, entities, a renderer, and behavior declarations. Themes and companions are independent: the five built-in themes recommend Moss, Reset God, or Token Thief as intentional defaults, while Pico, Puddle, and Mochi remain independent choices. An explicit replacement or No companion preference persists across theme changes, and the same model can host another animal, object, illustration style, or future built-in renderer.",
          ],
        },
        {
          heading: "Pointer awareness without interception",
          paragraphs: [
            "The injected scene background has pointer-events disabled. The companion accepts drag gestures without capturing surrounding Codex controls, can snap to a semantic surface, and follows that surface through size changes. Sprite frames use one shared alpha-aware scale and ground line so transparent padding cannot make the character float or jitter.",
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
            "场景模型由图层、实体、渲染器和行为声明组成。主题和伙伴相互独立：五个内置主题分别提供 Moss、Reset God 或 Token Thief 的默认搭配，同时仍可独立选择 Pico、Puddle 和 Mochi。用户明确选择其他伙伴或“不使用伙伴”后，该偏好会在切换主题时继续保留；相同模型还可以承载其他动物、物体、插画风格以及未来的内置渲染器。",
          ],
        },
        {
          heading: "感知光标，但不拦截点击",
          paragraphs: [
            "注入场景的背景禁用 pointer-events；伙伴本身可以接收拖拽手势，但不会遮挡周围的 Codex 控件。伙伴可贴合语义表面并跟随其尺寸变化；所有序列帧共享一套透明像素缩放和落脚线，避免角色悬浮或跳动。",
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
      "zh-CN":
        "Codex Styler 如何避免修改应用包、限制主题包能力并恢复官方 Codex Desktop 界面。",
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
          heading: "Runtime verification and fallback",
          paragraphs: [
            "Enhanced mode applies the complete semantic treatment and verifies live anchors and computed styles. A different Codex version is informational; only a real runtime health failure triggers fallback to the isolated scene layer. Conservative mode always stays isolated.",
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
          heading: "运行时验证与异常回退",
          paragraphs: [
            "增强模式会应用完整语义样式并检查实时锚点与最终样式。Codex 版本不同只作为信息提示；只有真实的运行时健康检查失败才回退到隔离场景层。保守模式始终保持隔离。",
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
            "Alpha installers are available for macOS on Apple Silicon and Windows 11 x64. macOS has the current real-device evidence; the Windows package is produced and structurally checked in CI but remains experimental until installation, launch, sleep/wake, restore, upgrade, and uninstall pass on a real Windows 11 device.",
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
            "当前 Alpha 同时提供 Apple Silicon macOS 与 Windows 11 x64 安装包。macOS 已有现阶段真实设备验证记录；Windows 包由 CI 构建并完成结构校验，但在真实 Windows 11 设备通过安装、启动、睡眠恢复、还原、升级和卸载前仍属于实验性预览。",
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
            "Select Apply and confirm the restart request. Styler sends a normal quit request and continues only after Codex has closed; it never force-quits the process.",
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
            "Restore the official interface, then switch to Conservative mode if Enhanced mode did not already fall back. Include the Codex and Styler versions in a GitHub issue, but do not attach personal workspace content or raw diagnostic logs without reviewing them.",
          ],
        },
      ],
      "zh-CN": [
        {
          heading: "Codex 已经在运行",
          paragraphs: [
            "点击应用并确认重新启动。Styler 会发送正常退出请求，并且只在 Codex 已关闭后继续；它不会强制终止进程。",
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
            "先恢复官方界面；如果增强模式尚未自行回退，再切换到保守模式。提交 GitHub Issue 时附上 Codex 和 Styler 版本，但不要在未检查前上传个人工作区内容或原始诊断日志。",
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
