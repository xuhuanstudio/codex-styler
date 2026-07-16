<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/site/public/media/codex-styler-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="apps/site/public/media/codex-styler-logo-light.png">
    <img src="apps/site/public/media/codex-styler-logo-light.png" width="112" alt="Codex Styler 图标">
  </picture>
</p>

<h1 align="center">Codex Styler</h1>

<p align="center">
  <strong>为 OpenAI Codex Desktop 打造的主题与 2D 互动场景编辑器。</strong><br />
  安全、可逆、本地优先，并明确保持非官方身份。
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="https://github.com/xuhuanstudio/codex-styler/releases/download/v0.1.0-alpha.2/Codex-Styler_0.1.0-alpha.2_aarch64-unsigned.dmg">下载 Alpha</a> ·
  <a href="https://xuhuanstudio.github.io/codex-styler/zh-cn/">项目网站</a> ·
  <a href="https://xuhuanstudio.github.io/codex-styler/zh-cn/docs/getting-started/">使用文档</a>
</p>

> [!IMPORTANT]
> Codex Styler 当前处于 Alpha 预览阶段。macOS 下载包采用临时 ad-hoc 签名，但没有 Apple Developer ID 签名和公证，因此不是稳定版；v1 Stable 仍必须通过完整真实设备测试、macOS 公证和 Windows 代码签名。

![Codex Styler 主题编辑器](docs/media/app-overview.png)

## 为什么做 Codex Styler

OpenAI Codex Desktop 已经提供基础外观设置和 Pets。Codex Styler 专注于它们没有覆盖的部分：以图片为主体的空间氛围、克制且可读的材质系统，以及能够响应光标的可替换 2D 实体。

- **可逆运行时：** 使用临时本机回环 CDP 会话启动 Codex，不修改 <code>app.asar</code>、应用资源或签名。
- **引导式创作：** 无需编写 CSS，即可调整背景焦点、亮度、遮罩、表面、圆角、动态和伙伴尺寸。
- **开放场景模型：** 主题声明 <code>layers[]</code>、<code>entities[]</code>、渲染器和行为，不直接依赖 Codex 内部 DOM。
- **纯数据主题包：** 仅允许本地位图和 JSON，不允许脚本、任意 CSS、SVG、视频、远程 URL 或可执行字体。
- **本地优先：** 无账号、无遥测、无云同步、无在线商店，也不在后台联网。
- **从 v1 开始双语：** 桌面应用、GitHub 文档和网站完整支持英文与简体中文。

## 内置主题

| 主题 | 视觉方向 | 互动 |
| --- | --- | --- |
| Native Refined / 原生精修 | 对原生工作空间进行低干扰校准 | 无 |
| Nocturne Studio / 夜曲工作室 | 墨色建筑、烟熏玻璃与琥珀光 | 轻微视差 |
| Quiet Garden Companion / 静谧花园伙伴 | 自然层次与原创壁虎 Moss | 16 方向光标注视 |

所有随项目分发的图片和序列帧都是原创资源。参考仓库只用于研究思路，不复制或重新分发其代码与素材。

## 下载 macOS Alpha

**[下载适用于 macOS Apple Silicon 的 Codex Styler 0.1.0-alpha.2（DMG）](https://github.com/xuhuanstudio/codex-styler/releases/download/v0.1.0-alpha.2/Codex-Styler_0.1.0-alpha.2_aarch64-unsigned.dmg)**

需要 macOS 13 或更高版本以及 Apple Silicon Mac。打开 DMG，把 Codex Styler 拖入“应用程序”；首次启动时按住 Control 点击应用，选择“打开”。不要全局关闭 Gatekeeper。

[预发布页面](https://github.com/xuhuanstudio/codex-styler/releases/tag/v0.1.0-alpha.2)同时提供 SHA-256 校验文件、SPDX SBOM、构建证明、已验证范围和已知限制。本次 Alpha 暂不提供 Windows 与 Intel Mac 安装包。

## 从源码运行

### 环境要求

- Node.js 22 或更高
- pnpm 11 或更高
- Rust stable
- 真实运行时测试需要安装 OpenAI Codex Desktop

~~~bash
pnpm install
pnpm check
pnpm tauri dev
~~~

只运行浏览器版界面：

~~~bash
pnpm dev
~~~

运行双语文档站：

~~~bash
pnpm dev:site
~~~

## 安全模型

Codex Styler 在 <code>127.0.0.1</code> 上申请随机端口，使用这个临时调试端口启动已安装的 Codex 可执行文件，验证返回的页面目标，然后只注入一个可幂等管理的场景根节点和一个样式节点。“恢复官方界面”会删除二者。

默认的**自动模式**会先应用语义样式，并检查 Codex 的实时界面结构和最终表面样式；无论版本号是否已识别，只要检查失败，就立即回退到隔离的背景与场景层。**兼容模式**始终使用隔离层，**开发者模式**则强制启用语义样式且不自动回退。

参阅[安全模型](docs/security-model.md)、[主题包规范](docs/theme-format.md)和[安全策略](SECURITY.md)。

## 主题格式

<code>.codex-styler-theme</code> 是经过严格校验的 ZIP：

~~~text
theme.json
LICENSES.json
assets/*.png | *.jpg | *.webp
previews/*.png | *.jpg | *.webp
~~~

公开格式标识为 <code>codex-styler-theme-v1</code>。JSON Schema 和 TypeScript 接口位于 <code>packages/theme-core</code>。

校验主题：

~~~bash
pnpm theme:validate path/to/theme.json
pnpm theme:validate path/to/theme.codex-styler-theme
~~~

## 项目结构

~~~text
apps/desktop          React 编辑器与 Tauri 桌面外壳
apps/site             Astro 双语网站和文档
packages/theme-core   主题协议、校验、归档与内置主题
docs                  架构、安全、素材和技术决策
~~~

运行时明确划分为桌面管理器、主题引擎、版本化 Codex 适配器和注入式场景运行时。主题包中不会出现 Codex 选择器，兼容性相关逻辑全部集中在适配器。

## 参与贡献

提交 Pull Request 前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。原创主题、无障碍改进、适配器测试夹具、文档和真实设备兼容报告尤其有价值。

安全问题请使用 GitHub 私密漏洞报告，不要创建公开 Issue。

## 状态与路线图

当前仓库已经实现 Foundation 和 macOS 原型层。下一阶段发布门槛：

- 带有清晰未签名提示的 macOS Alpha
- 通过真实设备验证的 Windows 11 x64 Beta
- macOS 与 Windows 均完成签名、公证的 v1 Stable

详见 [ROADMAP.md](ROADMAP.md) 和 [COMPATIBILITY.md](COMPATIBILITY.md)。

## 许可证与商标说明

代码采用 [Apache-2.0](LICENSE)，原创内置素材采用 [CC BY 4.0](ASSET_LICENSES.md)。

Codex Styler 与 OpenAI 无关联，也没有获得 OpenAI 的认可或赞助。OpenAI 和 Codex 是 OpenAI, L.L.C. 的商标，项目仅以描述兼容性的方式使用相关名称。
