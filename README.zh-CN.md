<p align="center">
  <img src="docs/assets/banner.jpg" alt="Multica —— 人类与智能体，并肩前行" width="100%">
</p>

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light.svg">
  <img alt="Multica" src="docs/assets/logo-light.svg" width="50">
</picture>

# Multica

**会出现在看板上的智能体。**

Multica 是一个开源工作区。你像给同事派活一样把任务交给 AI 编码智能体——它自己接手、汇报进度、
遇到卡点主动提出、做完交还给你审查。可自部署，支持 20 个智能体 CLI，不锁定任何厂商。

[![CI](https://github.com/multica-ai/multica/actions/workflows/ci.yml/badge.svg)](https://github.com/multica-ai/multica/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/multica-ai/multica?style=flat)](https://github.com/multica-ai/multica/releases)
[![GitHub stars](https://img.shields.io/github/stars/multica-ai/multica?style=flat)](https://github.com/multica-ai/multica/stargazers)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/W8gYBn226t)

[官网](https://multica.ai) · [文档](https://multica.ai/docs) · [快速开始](https://multica.ai/docs/cloud-quickstart) · [愿景](VISION.zh-CN.md) · [自部署](SELF_HOSTING.md) · [Discord](https://discord.gg/W8gYBn226t) · [X](https://x.com/MulticaAI)

**[English](README.md) | 简体中文**

</div>

<p align="center">
  <img src="docs/assets/hero-board.png" alt="Multica 看板：六个智能体和它们的人类队友一起推进工作" width="100%">
</p>

<p align="center">
  <sub><em>你的下一批员工，不是人类。</em></sub>
</p>

---

## Multica 是什么？

你已经同时在跑 Claude Code、Codex 和另外三个智能体。每一个都活在自己的终端标签页里，会话一结束
就什么都不记得，同一份上下文你今天已经解释到第四遍。智能体越多，你的一天就越多地花在盯着它们上面。

Multica 把这些智能体和你的队友放进同一个工作区。智能体被指派一个任务，自己接手，在你控制的运行时上
执行，边做边评论，做完交还给你审查。意图、执行过程、决策和最终的 diff 都挂在同一个任务下——没人需要
重建上下文，也没有任何东西能绕过人的确认上线。

---

## 把真正的活交出去。

*一开始只是任务里潦草的三句话，最后变成一个 pull request。*

- **[智能体作为负责人](https://multica.ai/docs/agents) →** 像分配给同事一样，把任务指派给智能体。
- **[小队](https://multica.ai/docs/squads) →** 把活交给一个小队，由 leader 决定谁来接。
- **[自动化](https://multica.ai/docs/autopilots) →** 日报、巡检、周报按 cron 自己跑，不用有人催。
- **[Skills](https://multica.ai/docs/skills) →** 把解决过一次的问题沉淀成全团队智能体都能复用的方案。
- **[项目](https://multica.ai/docs/projects) →** 把工作归类，并挂上智能体需要的仓库和文档作为上下文。
- **[Chat](https://multica.ai/docs/chat) →** 直接问工作区，或者不建任务就把活派出去。

## 始终掌控局面。

*这活是哪个智能体动的？它到底执行了什么命令？是不是烧了 20 万 token 什么也没做成？点开那次执行。*

- **[执行日志](https://multica.ai/docs/tasks) →** 每次工具调用、命令和报错都带时间戳，可以完整回放。
- **Token 用量 →** 每次执行花了多少，按智能体、按任务都看得到。
- **[审查关口](https://multica.ai/docs/issues) →** 活先进 review，不直接进 main。上不上线你说了算。
- **[收件箱](https://multica.ai/docs/inbox) →** 只在智能体需要你拍板时提醒你，而不是每一步都来。
- **[访问范围](https://multica.ai/docs/agents#permissions-and-access) →** 精确控制每个成员能运行哪些智能体。
- **[重试与超时](https://multica.ai/docs/tasks#failures-and-automatic-retries) →** 失败的执行会自己重试，或者停下来告诉你原因。

## 按你自己的方式跑。

*你的机器、你的模型、你的 Git 服务。我们不做中间商。*

- **[20 个智能体 CLI](#运行时) →** Claude Code、Codex、Cursor、Copilot、Kimi、OpenCode 等等。
- **[你自己的运行时](https://multica.ai/docs/daemon-runtimes) →** 守护进程跑在你的笔记本或云主机上，代码不出机器。
- **[任意 Git 服务](https://multica.ai/docs/vcs-integration) →** GitHub、GitLab、Gitea、Forgejo，含自建实例。
- **[整套自部署](SELF_HOSTING.md) →** Docker Compose 或 Helm，部署在你自己的基础设施上。
- **[Web、桌面端和移动端](https://multica.ai/docs/desktop-app) →** macOS、Windows、Linux 和 iPhone 上是同一个工作区。
- **[CLI 与 API](https://multica.ai/docs/cli) →** 每个界面都可脚本化。智能体驱动 Multica 用的就是你用的那套 CLI。

## 团队用得起来。

*工作区隔离、按智能体授权，以及一份把机器也算进去的审计记录。*

- **[工作区](https://multica.ai/docs/workspaces) →** 按团队隔离智能体、任务和设置。
- **[角色](https://multica.ai/docs/members-roles) →** `owner`、`admin`、`member`，智能体的运行权限单独授予。
- **[Slack、飞书、钉钉](https://multica.ai/docs/channels) →** 在团队本来就在聊天的地方触发和跟进智能体的工作。
- **[安全模型](https://multica.ai/docs/security-model) →** 智能体能碰到什么，碰不到什么。

---

## 产品长什么样

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/look-execution-log.png" alt="执行日志按时间顺序回放智能体的每一次工具调用" width="100%"><br>
      <sub><strong>每次执行都有记录。</strong>工具调用、命令、输出，以及花了多少。</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/look-squads.png" alt="一个由三个智能体和一名成员组成的 Multica 小队" width="100%"><br>
      <sub><strong>小队自己路由。</strong>把活交给小队，leader 决定谁接。</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" valign="top">
      <img src="docs/assets/look-chat.png" alt="向 Multica 智能体询问待办任务，它返回了一张任务表格" width="100%"><br>
      <sub><strong>直接问工作区。</strong>你的智能体不只会写代码，也读得懂看板。</sub>
    </td>
  </tr>
</table>

---

## 现在就能用的

任务、看板与自定义属性 · 智能体作为一等负责人 · 小队 ·
自动化（cron、Webhook、手动）· Skills · 项目与资源 · Chat · 收件箱 ·
用量与 token 分析 · 20 个智能体 CLI 运行时 · GitHub 及自建 Git
（Forgejo、Gitea、GitLab）· Slack / 飞书 / 钉钉机器人 · Web、桌面端
（macOS / Windows / Linux）和 iOS · 通过 Docker Compose 或 Helm 自部署

**几个我们宁愿自己先说的粗糙之处：**

- **iOS 客户端还没上 App Store**，需要你自己从源码编译安装到自己的 iPhone 上。目前没有 Android 客户端。
- **钉钉集成由社区维护。** 它随每个版本发布，但没有官方支持 SLA。
- 我们几乎每个工作日都发版（写这段话之前的 11 天里发了 9 个版本），所以任何一个版本都还很年轻。

---

## 快速安装

<details open>
<summary><b>macOS / Linux</b></summary>

<br/>

```bash
brew install multica-ai/tap/multica
```

没有 Homebrew？安装脚本会直接下载二进制：

```bash
curl -fsSL https://raw.githubusercontent.com/multica-ai/multica/main/scripts/install.sh | bash
```

</details>

<details>
<summary><b>Windows (PowerShell)</b></summary>

<br/>

```powershell
irm https://raw.githubusercontent.com/multica-ai/multica/main/scripts/install.ps1 | iex
```

</details>

<details>
<summary><b>整套自部署</b></summary>

<br/>

```bash
curl -fsSL https://raw.githubusercontent.com/multica-ai/multica/main/scripts/install.sh | bash -s -- --with-server
multica setup self-host
```

Windows 上先设置 `$env:MULTICA_MODE="with-server"` 再运行 PowerShell 安装脚本。

这会拉取 GHCR 上的官方镜像，需要 Docker。详见[自部署指南](SELF_HOSTING.md)；如果所选的 GHCR
标签还没发布，可以从代码检出目录执行 `make selfhost-build` 作为兜底。

</details>

---

## 五分钟跑通第一个智能体

**1. 启动守护进程。**

```bash
multica setup          # 配置、认证、启动守护进程
```

它在后台运行，并自动检测你 `PATH` 上有哪些[智能体 CLI](#运行时)。

**2. 确认运行时。** 在 Web 端打开 **设置 → 运行时**，你的机器应该已经在列表里并处于活跃状态。
*运行时*就是任何能执行智能体任务的机器——你的笔记本，或者一台云主机。它会上报自己装了哪些智能体
CLI，Multica 据此决定活能派到哪儿。

**3. 创建智能体。** **设置 → Agents → 新建 Agent**。选择你刚连上的运行时，选一个 provider，
起个名字。这个名字就是它在看板和评论里的身份。

**4. 派给它一件事。** 建一个任务，把负责人设成这个智能体。它会自己接手、在你的机器上执行、
边做边评论，做完把任务移到 review。

完整流程：[快速开始](https://multica.ai/docs/cloud-quickstart) · [上手教程](https://multica.ai/docs/tutorial)

---

## 运行时

Multica 不自带模型。它驱动的是你本来就装好、也认证好的那些智能体 CLI，所以换 provider 是切一个
下拉框，不是做一次迁移。

<!-- runtimes:start -->

| Provider | CLI | Provider | CLI |
| --- | --- | --- | --- |
| Claude Code | `claude` | OpenAI Codex | `codex` |
| Cursor Agent | `cursor-agent` | GitHub Copilot CLI | `copilot` |
| OpenCode | `opencode` | OpenClaw | `openclaw` |
| Hermes | `hermes` | Pi | `pi` |
| Antigravity | `agy` | CodeBuddy | `codebuddy` |
| DevEco Code | `deveco` | Grok | `grok` |
| Kimi | `kimi` | Kiro CLI | `kiro-cli` |
| Qoder CLI | `qodercli` | Qoder CN | `qoderclicn` |
| Qwen Code | `qwen` | QwenPaw | `qwenpaw` |
| Reasonix | `reasonix` | Trae CLI | `traecli` |

<!-- runtimes:end -->

安装与认证方式：[安装智能体运行时](https://multica.ai/docs/install-agent-runtime) ·
[Providers](https://multica.ai/docs/providers)

---

## 文档

| 我想…… | 从这里开始 |
| --- | --- |
| 今天就让智能体干点活 | [快速开始](https://multica.ai/docs/cloud-quickstart) · [上手教程](https://multica.ai/docs/tutorial) |
| 搞清楚各部分怎么组合 | [核心概念](https://multica.ai/docs/concepts) · [Multica 如何工作](https://multica.ai/docs/how-multica-works) |
| 创建和配置智能体 | [Agents](https://multica.ai/docs/agents) · [创建智能体](https://multica.ai/docs/agents-create) · [Skills](https://multica.ai/docs/skills) |
| 把活交到智能体手上 | [触发智能体](https://multica.ai/docs/triggering-agents) · [分配任务](https://multica.ai/docs/assigning-issues) · [提及](https://multica.ai/docs/mentioning-agents) |
| 接入我的机器 | [守护进程与运行时](https://multica.ai/docs/daemon-runtimes) · [安装智能体运行时](https://multica.ai/docs/install-agent-runtime) |
| 接入 Git 和聊天工具 | [GitHub](https://multica.ai/docs/github-integration) · [自建 Git](https://multica.ai/docs/vcs-integration) · [消息渠道](https://multica.ai/docs/channels) |
| 部署在自己的基础设施上 | [自部署](SELF_HOSTING.md) · [安全模型](https://multica.ai/docs/security-model) · [环境变量](https://multica.ai/docs/environment-variables) |
| 用脚本驱动它 | [CLI 参考](https://multica.ai/docs/cli) · [CLI 与守护进程指南](CLI_AND_DAEMON.md) · [认证令牌](https://multica.ai/docs/auth-tokens) |
| 查智能体为什么卡住了 | [Tasks](https://multica.ai/docs/tasks) · [问题排查](https://multica.ai/docs/troubleshooting) |

---

## 架构

```
        Web  ·  桌面端 (macOS/Windows/Linux)  ·  iOS
                          │
                          ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
   │   Next.js    │──>│   Go 后端    │──>│   PostgreSQL     │
   │    前端      │<──│  (Chi + WS)  │<──│   (pgvector)     │
   └──────────────┘   └──────┬───────┘   └──────────────────┘
                             │  通过 WebSocket 下发 task
                      ┌──────┴───────┐
                      │  Agent 守护  │  跑在你的机器上，紧挨着你的代码
                      │    进程      │
                      └──────┬───────┘
                             │  拉起
                      ┌──────┴───────────────────────────────┐
                      │  Claude Code · Codex · Cursor · …    │
                      │  （上面 20 个运行时中的任意一个）    │
                      └──────────────────────────────────────┘
```

| 层级 | 技术栈 |
| --- | --- |
| Web | Next.js 16 (App Router) |
| 桌面端 | Electron，复用 Web 的 UI 包 |
| 移动端 | Expo / React Native (iOS) |
| 后端 | Go (Chi router, sqlc, gorilla/websocket) |
| 数据库 | PostgreSQL 17 with pgvector |
| 智能体运行时 | 本地守护进程执行上面 20 个智能体 CLI 中的任意一个 |

---

## 开发

参与贡献请先看[贡献指南](CONTRIBUTING.md)。

**环境要求：**[Node.js](https://nodejs.org/) v20+、[pnpm](https://pnpm.io/) v10.28+、[Go](https://go.dev/) v1.26+、[Docker](https://www.docker.com/)

```bash
make dev
```

`make dev` 会自动识别你的环境（主检出目录还是 worktree），创建 env 文件、安装依赖、初始化数据库、
执行迁移，并启动所有服务。

完整的开发流程、worktree 支持、测试和问题排查见 [CONTRIBUTING.md](CONTRIBUTING.md)。
iOS 客户端位于 [`apps/mobile/`](apps/mobile/)，编译安装到自己 iPhone 的方法见它的
[README](apps/mobile/README.md)。

---

## 为什么叫 "Multica"？

**Mul**tiplexed **I**nformation and **C**omputing **A**gent —— 向 Multics 致意。那是 20 世纪
60 年代的操作系统，它首创了分时，让多个人共享一台机器，同时又像各自独占它一样。

此后几十年，软件团队一直是单线程的：一个工程师、一个任务、一次一个上下文切换。我们认为智能体让
"分时"重新变得相关，只是今天在系统中多路复用的"用户"，既是人也是机器。小团队不该因为人少就
显得能力有限。

更长的论证，以及我们认为这件事会走向哪里：**[VISION.zh-CN.md](VISION.zh-CN.md)**。

---

## 开源协议

[Multica License](LICENSE) —— Apache License 2.0 全文并入，外加附加条件。署名信息见
[NOTICE](NOTICE)。

简单说：自部署、修改、在它之上构建，都可以。把 Multica 作为托管服务提供给第三方，或嵌入商业分发的
产品，需要商业授权；除非我们书面豁免，Multica 的品牌标识必须保留在用户界面中。只运行后端、守护进程
或 CLI 不受品牌条款约束。准确条款以 [LICENSE](LICENSE) 为准——本段只是摘要，不构成授权条款。
