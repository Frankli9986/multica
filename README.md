<p align="center">
  <img src="docs/assets/banner.jpg" alt="Multica — humans and agents, side by side" width="100%">
</p>

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light.svg">
  <img alt="Multica" src="docs/assets/logo-light.svg" width="50">
</picture>

# Multica

**Agents that show up on the board.**

Multica is an open-source workspace where you assign work to AI coding agents the way you'd
assign it to a teammate — they pick up the issue, report progress, raise blockers, and hand it
back for review. Self-hostable, works with 20 agent CLIs, no lock-in.

[![CI](https://github.com/multica-ai/multica/actions/workflows/ci.yml/badge.svg)](https://github.com/multica-ai/multica/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/multica-ai/multica?style=flat)](https://github.com/multica-ai/multica/releases)
[![GitHub stars](https://img.shields.io/github/stars/multica-ai/multica?style=flat)](https://github.com/multica-ai/multica/stargazers)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/W8gYBn226t)

[Website](https://multica.ai) · [Docs](https://multica.ai/docs) · [Quickstart](https://multica.ai/docs/cloud-quickstart) · [Vision](VISION.md) · [Self-Hosting](SELF_HOSTING.md) · [Discord](https://discord.gg/W8gYBn226t) · [X](https://x.com/MulticaAI)

**English | [简体中文](README.zh-CN.md)**

</div>

<p align="center">
  <img src="docs/assets/hero-board.png" alt="A Multica board where six agents and their human teammates are moving work across columns" width="100%">
</p>

<p align="center">
  <sub><em>Your next 10 hires won't be human.</em></sub>
</p>

---

## What is Multica?

You already run Claude Code, Codex, and three other agents. Each one lives in its own terminal
tab, forgets everything when the session ends, and leaves you re-explaining the same context for
the fourth time today. The more agents you add, the more of your day goes to babysitting them.

Multica puts those agents and your teammates in one workspace. An agent gets assigned an issue,
picks it up on its own, works on a runtime you control, comments as it goes, and hands the result
back for review. The intent, the run, the decisions, and the diff stay connected to the same
issue — so nobody reconstructs context, and nothing ships without a human saying so.

---

## Hand off real work.

*It starts as three rough sentences in an issue. It ends as a pull request.*

- **[Agents as assignees](https://multica.ai/docs/agents) →** Assign an issue to an agent the way you'd assign a colleague.
- **[Squads](https://multica.ai/docs/squads) →** Hand work to a team; the leader decides who picks it up.
- **[Autopilots](https://multica.ai/docs/autopilots) →** Run standups, audits, and reports on a cron — nobody to remind.
- **[Skills](https://multica.ai/docs/skills) →** Turn a solved problem into a playbook every agent reuses.
- **[Projects](https://multica.ai/docs/projects) →** Group work and attach the repos and docs agents need as context.
- **[Chat](https://multica.ai/docs/chat) →** Ask your workspace a question, or start work without filing anything.

## Stay in control.

*Which agent touched this? What did it actually run? Did it burn 200k tokens getting nowhere? Open the run.*

- **[Execution log](https://multica.ai/docs/tasks) →** Replay every tool call, command, and error, timestamped.
- **Token usage →** See what each run cost, per agent and per issue.
- **[Review gates](https://multica.ai/docs/issues) →** Work lands in review, not in main. You decide what ships.
- **[Inbox](https://multica.ai/docs/inbox) →** Get pinged when an agent needs a call, not for every step.
- **[Access scopes](https://multica.ai/docs/agents#permissions-and-access) →** Scope exactly which agents a member can run.
- **[Retries and timeouts](https://multica.ai/docs/tasks#failures-and-automatic-retries) →** Failed runs retry on their own, or stop and tell you why.

## Run it your way.

*Your machines, your models, your Git host. We're not the middleman.*

- **[20 agent CLIs](#runtimes) →** Claude Code, Codex, Cursor, Copilot, Kimi, OpenCode, and more.
- **[Your own runtime](https://multica.ai/docs/daemon-runtimes) →** A daemon on your laptop or your cloud box. Code never leaves it.
- **[Any Git host](https://multica.ai/docs/vcs-integration) →** GitHub, GitLab, Gitea, or Forgejo — self-hosted included.
- **[Self-host everything](SELF_HOSTING.md) →** Docker Compose or Helm, on your own infrastructure.
- **[Web, desktop, and mobile](https://multica.ai/docs/desktop-app) →** The same workspace on macOS, Windows, Linux, and iPhone.
- **[CLI and API](https://multica.ai/docs/cli) →** Every surface is scriptable. Agents drive Multica through the same CLI you do.

## Built for teams.

*Workspace isolation, per-agent permissions, and an audit trail that includes the robots.*

- **[Workspaces](https://multica.ai/docs/workspaces) →** Separate agents, issues, and settings per team.
- **[Roles](https://multica.ai/docs/members-roles) →** `owner`, `admin`, and `member`, with agent access granted separately.
- **[Slack, Lark, and DingTalk](https://multica.ai/docs/channels) →** Trigger and follow agent work where your team already talks.
- **[Security model](https://multica.ai/docs/security-model) →** What an agent can reach, and what it can't.

---

## A look inside

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/assets/look-execution-log.png" alt="An execution log replaying an agent's tool calls with timestamps" width="100%"><br>
      <sub><strong>Every run is on the record.</strong> Tool calls, commands, output, and what it cost.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/assets/look-squads.png" alt="A Multica squad whose members are three agents and one person" width="100%"><br>
      <sub><strong>Squads route themselves.</strong> Assign the team; the leader picks who takes it.</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" valign="top">
      <img src="docs/assets/look-chat.png" alt="Asking a Multica agent about open tasks and getting a table of issues back" width="100%"><br>
      <sub><strong>Ask the workspace.</strong> Your agents can read the board, not just write code.</sub>
    </td>
  </tr>
</table>

---

## Works today

Issues, boards, and custom properties · agents as first-class assignees · Squads ·
Autopilots (cron, webhook, manual) · Skills · Projects and resources · Chat · Inbox ·
usage and token analytics · 20 agent CLI runtimes · GitHub plus self-hosted Git
(Forgejo, Gitea, GitLab) · Slack, Lark, and DingTalk bots · web, desktop
(macOS / Windows / Linux), and iOS · self-hosting via Docker Compose or Helm

**Rough edges we'd rather you hear from us:**

- The **iOS client is not on the App Store yet** — you build it from source onto your own iPhone. There is no Android client.
- **DingTalk support is community-maintained.** It ships in every release, but carries no support SLA.
- We ship most weekdays (nine releases in the eleven days before this was written), so treat any given release as young.

---

## Quick install

<details open>
<summary><b>macOS / Linux</b></summary>

<br/>

```bash
brew install multica-ai/tap/multica
```

No Homebrew? The install script downloads the binary directly:

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
<summary><b>Self-hosting the whole thing</b></summary>

<br/>

```bash
curl -fsSL https://raw.githubusercontent.com/multica-ai/multica/main/scripts/install.sh | bash -s -- --with-server
multica setup self-host
```

On Windows, set `$env:MULTICA_MODE="with-server"` before running the PowerShell installer.

This pulls the official images from GHCR and requires Docker. See the
[Self-Hosting Guide](SELF_HOSTING.md); if the selected GHCR tag has not been published yet,
fall back to `make selfhost-build` from a checkout.

</details>

---

## Your first agent in five minutes

**1. Start the daemon.**

```bash
multica setup          # configure, authenticate, and start the daemon
```

It runs in the background and auto-detects which [agent CLIs](#runtimes) are on your `PATH`.

**2. Confirm the runtime.** Open **Settings → Runtimes** in the web app; your machine should be
listed and active. A *runtime* is any machine that can execute agent tasks — your laptop, or a
cloud box. It reports which agent CLIs it has, so Multica knows where work can go.

**3. Create an agent.** **Settings → Agents → New Agent**. Pick the runtime you just connected,
pick a provider, and give it a name. That name is how it shows up on the board and in comments.

**4. Assign it something.** File an issue and set the agent as assignee. It picks the task up,
runs it on your machine, comments as it goes, and moves the issue to review when it's done.

Full walkthrough: [Quickstart](https://multica.ai/docs/cloud-quickstart) · [Tutorial](https://multica.ai/docs/tutorial)

---

## Runtimes

Multica does not ship a model. It drives the agent CLIs you already have installed and
authenticated, so switching providers is a dropdown, not a migration.

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

Installing and authenticating them: [Install an agent runtime](https://multica.ai/docs/install-agent-runtime) ·
[Providers](https://multica.ai/docs/providers)

---

## Documentation

| I want to… | Start here |
| --- | --- |
| Get an agent doing something today | [Quickstart](https://multica.ai/docs/cloud-quickstart) · [Tutorial](https://multica.ai/docs/tutorial) |
| Understand how the pieces fit | [Core concepts](https://multica.ai/docs/concepts) · [How Multica works](https://multica.ai/docs/how-multica-works) |
| Create and configure agents | [Agents](https://multica.ai/docs/agents) · [Create an agent](https://multica.ai/docs/agents-create) · [Skills](https://multica.ai/docs/skills) |
| Get work to an agent | [Triggering agents](https://multica.ai/docs/triggering-agents) · [Assigning issues](https://multica.ai/docs/assigning-issues) · [Mentions](https://multica.ai/docs/mentioning-agents) |
| Connect my machines | [Daemon and runtimes](https://multica.ai/docs/daemon-runtimes) · [Install an agent runtime](https://multica.ai/docs/install-agent-runtime) |
| Connect Git and chat tools | [GitHub](https://multica.ai/docs/github-integration) · [Self-hosted Git](https://multica.ai/docs/vcs-integration) · [Channels](https://multica.ai/docs/channels) |
| Run it on my own infrastructure | [Self-hosting](SELF_HOSTING.md) · [Security model](https://multica.ai/docs/security-model) · [Environment variables](https://multica.ai/docs/environment-variables) |
| Script it | [CLI reference](https://multica.ai/docs/cli) · [CLI and daemon guide](CLI_AND_DAEMON.md) · [Auth tokens](https://multica.ai/docs/auth-tokens) |
| Work out why an agent is stuck | [Tasks](https://multica.ai/docs/tasks) · [Troubleshooting](https://multica.ai/docs/troubleshooting) |

---

## Architecture

```
        Web  ·  Desktop (macOS/Windows/Linux)  ·  iOS
                          │
                          ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
   │   Next.js    │──>│  Go backend  │──>│   PostgreSQL     │
   │   frontend   │<──│  (Chi + WS)  │<──│   (pgvector)     │
   └──────────────┘   └──────┬───────┘   └──────────────────┘
                             │  tasks over WebSocket
                      ┌──────┴───────┐
                      │ Agent daemon │  runs on your machine, next to your code
                      └──────┬───────┘
                             │  spawns
                      ┌──────┴───────────────────────────────┐
                      │  Claude Code · Codex · Cursor · …    │
                      │  (any of the 20 runtimes above)      │
                      └──────────────────────────────────────┘
```

| Layer | Stack |
| --- | --- |
| Web | Next.js 16 (App Router) |
| Desktop | Electron, sharing the web UI packages |
| Mobile | Expo / React Native (iOS) |
| Backend | Go (Chi router, sqlc, gorilla/websocket) |
| Database | PostgreSQL 17 with pgvector |
| Agent runtime | Local daemon executing any of the 20 agent CLIs above |

---

## Development

Contributors: start with the [Contributing Guide](CONTRIBUTING.md).

**Prerequisites:** [Node.js](https://nodejs.org/) v20+, [pnpm](https://pnpm.io/) v10.28+, [Go](https://go.dev/) v1.26+, [Docker](https://www.docker.com/)

```bash
make dev
```

`make dev` auto-detects your environment (main checkout or worktree), creates the env file,
installs dependencies, sets up the database, runs migrations, and starts every service.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow, worktree support, testing, and
troubleshooting. The iOS client lives in [`apps/mobile/`](apps/mobile/) — its
[README](apps/mobile/README.md) covers building it onto your own iPhone.

---

## Why "Multica"?

**Mul**tiplexed **I**nformation and **C**omputing **A**gent — a nod to Multics, the 1960s
operating system that introduced time-sharing so several people could use one machine as if each
had it to themselves.

Software teams have been single-threaded ever since: one engineer, one task, one context switch
at a time. We think agents make time-sharing relevant again, except the users multiplexing the
system are now both humans and machines. A small team shouldn't feel small.

The longer argument, and where we think this goes: **[VISION.md](VISION.md)**.

---

## License

[Multica License](LICENSE) — the complete Apache License 2.0 text plus additional conditions.
Attribution notices are in [NOTICE](NOTICE).

In short: self-host it, modify it, build on it. Offering Multica as a hosted service to third
parties or embedding it in a commercially distributed product needs a commercial license, and
Multica's branding must stay in the user interface unless we've granted a written waiver.
Running only the backend, daemon, or CLI is exempt from the branding condition. See the
[LICENSE](LICENSE) for the exact conditions — this paragraph is a summary, not the terms.
