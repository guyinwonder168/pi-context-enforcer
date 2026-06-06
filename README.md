<p align="center">
  <img src="https://img.shields.io/badge/pi--package-v1.0.0-blue" alt="pi-package">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT">
  <img src="https://img.shields.io/badge/models-all-brightgreen" alt="all models">
</p>

<h1 align="center">pi-context-enforcer</h1>
<p align="center"><em>System-level context enforcement for pi — makes every LLM model behave consistently.</em></p>

---

## Problem

Different LLM models follow instructions differently. Write instructions in `AGENTS.md` and a cheap model ignores them. A frontier model follows them for a while, then forgets mid-session. The result: inconsistent code quality, missed patterns, wasted rework.

## Solution

**Tool-level enforcement, not instruction-level.** A pi extension registers a `read_context()` tool and **blocks** `write`/`edit`/`bash` calls until context is loaded. Every model — DeepSeek, Gemini, GPT, Claude — hits the same gate. No amount of rationalization bypasses it.

```
LLM: write("src/main.py")
     ✋ BLOCKED — "Context 'code' not loaded.
                   Call read_context({ context_type: "code" }) first."
LLM: read_context({ context_type: "code" })
     ✅ Context loaded — content returned, gate records it
LLM: write("src/main.py")
     ✅ Allowed — context was loaded
```

---

## Features

### 1. `read_context()` Gate

Four code standards files, auto-installed on first run:

| File | What it covers |
|------|----------------|
| `code-standards.md` | Code quality, naming, error handling, structure |
| `test-standards.md` | TDD workflow, test patterns, coverage expectations |
| `documentation-standards.md` | Docstring formats, README structure, anti-patterns |
| `security-patterns.md` | Secrets, path traversal, API security checklist |

Before any write/edit/bash, the extension checks whether the relevant context was loaded. If not, the tool call is **blocked** with a clear reason.

### 2. Subagent System

Four agents with model routing, auto-installed on first run:

| Agent | Model | Role | Tools |
|-------|-------|------|-------|
| `scout` | `deepseek-v4-flash` | Fast codebase recon | read, grep, find, ls, bash |
| `planner` | `gpt-5.5` | Architecture & plan | read, grep, find, ls |
| `worker` | `deepseek-v4-pro` | Implementation | all default |
| `reviewer` | `gpt-5.5` | Code review | read, grep, find, ls, bash |

Chained workflow commands:

| Command | Pipeline |
|---------|----------|
| `/implement <query>` | scout → planner → worker |
| `/scout-and-plan <query>` | scout → planner |
| `/implement-and-review <query>` | worker → reviewer → worker |

Each subagent runs as an isolated `pi` process with its own model, tools, context window, and **its own context enforcement** — `read_context()` gates apply recursively.

### 3. Workflow Skills

Ten development methodology skills, auto-discovered by pi:

| Skill | Triggers when |
|-------|---------------|
| `brainstorming` | Before any creative work — refines ideas into designs |
| `writing-plans` | After design approval — breaks work into tasks |
| `subagent-driven-development` | Executes tasks via isolated subagents, 2-stage review |
| `executing-plans` | Alternative: batch execution with human checkpoints |
| `test-driven-development` | During implementation — RED-GREEN-REFACTOR |
| `requesting-code-review` | Between tasks — reviews against plan |
| `verification-before-completion` | Before claiming done — runs tests, checks diagnostics |
| `finishing-a-development-branch` | When tasks complete — merge/PR/discard decision |
| `systematic-debugging` | On bugs — 4-phase root cause process |
| `using-superpowers` | Session bootstrap — loads context system reference |

---

## Installation

```bash
pi install git:github.com/guyinwonder168/pi-context-enforcer
```

For a quick test without installing:

```bash
pi -e git:github.com/guyinwonder168/pi-context-enforcer
```

### What gets installed

| Path | Content |
|------|---------|
| `extensions/` | Context enforcer `read_context()` tool + write/edit/bash interceptor |
| `extensions/subagent/` | Subagent dispatch (scout → planner → worker → reviewer) |
| `skills/` (10) | Brainstorming, TDD, code review, systematic debugging, etc. |
| `prompts/` (3) | `/implement`, `/scout-and-plan`, `/implement-and-review` commands |
| `~/.pi/agent/agents/` | Scout, planner, worker, reviewer definitions *(auto-copied)* |
| `~/.pi/agent/context/` | Code, test, docs, security standards *(auto-copied)* |
| `~/.pi/agent/CONTEXT.md` | Context navigation index with Quick Routes *(auto-copied)* |

No manual setup required after `pi install`.

---

## Usage

### Single step: read context

```
read_context({ context_type: "all" })
```

Then proceed with any task. All standards are loaded, gate is open for all task types.

### Multi-step: full development cycle

```
You: "I want to add input validation to the API"

     ↓ Skill: brainstorming explores, asks questions, proposes design
     ↓ Skill: writing-plans breaks into tasks
     ↓ read_context({ context_type: "code" })
     ↓ write/edit/bash — all allowed
     ↓ Skill: verification-before-completion (tests, diagnostics)
     ↓ Skill: finishing-a-development-branch (merge/PR)
```

### Subagent workflow

```
/implement-and-review add input validation to the login form

     ↓ scout: finds relevant API files, data flow
     ↓ planner: produces step-by-step implementation plan
     ↓ worker: implements (read_context() enforced)
     ↓ reviewer: reads diff, returns quality report
```

---

## Model Routing

```
Your chat ─── deepseek-v4-flash (cheap orchestrator)
  │
  ├── scout ── deepseek-v4-flash (cheap — file search)
  ├── planner ── gpt-5.5 (frontier — architecture decisions)
  ├── worker ── deepseek-v4-pro (mid — mechanical implementation)
  └── reviewer ── gpt-5.5 (frontier — bug detection)
```

You only pay frontier costs for the two steps that need them (planning + review). Everything else runs on cheap models. Agent model assignments can be changed by editing `~/.pi/agent/agents/*.md` frontmatter.

---

## Uninstall

```bash
pi remove pi-context-enforcer
rm -rf ~/.pi/agent/agents ~/.pi/agent/context ~/.pi/agent/CONTEXT.md
```

---

## How it works

The extension hooks three pi lifecycle events:

1. **`session_start`** — auto-copies agent definitions and context files if they don't exist yet
2. **`tool_call`** — intercepts `write`/`edit`/`bash`, checks if the relevant context was loaded via `read_context()`, blocks the call if not
3. **`before_agent_start`** — injects the context-loading instruction into the system prompt at every turn

Because the enforcement is at the **tool execution level**, no model can bypass it by ignoring instructions.

---

## Credits

This package builds on concepts and code from two foundational open-source projects:

### [Superpowers](https://github.com/obra/superpowers) by [Jesse Vincent](https://github.com/obra) and [Prime Radiant](https://primeradiant.com/) *(219k ★)*

The 10 workflow skills bundled in this package (brainstorming, writing-plans, TDD, code review, systematic debugging, etc.) are adapted from [Superpowers](https://github.com/obra/superpowers) — a complete software development methodology for coding agents. We use their proven skill format (frontmatter, checklists, process diagrams, red flags tables) with modifications to reference the global context system.

Superpowers is MIT-licensed. See their [repository](https://github.com/obra/superpowers) for the original skills and documentation.

### [OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl) by [Darren Hinde](https://github.com/darrenhinde) *(4.3k ★)*

The context enforcement pattern (`read_context()` gate, pre-execution context loading, critical constraint rules) is inspired by [OpenAgentsControl](https://github.com/darrenhinde/OpenAgentsControl). OAC pioneered the approach of using subagents (ContextScout) to discover context before execution, hard enforcement rules with auto-stop consequences, and context bundling for subagent delegation. We adapted these concepts into a lightweight pi extension with system-level tool blocking.

OAC is MIT-licensed. See their [repository](https://github.com/darrenhinde/OpenAgentsControl) for the full context management system and agent framework.

---

## License

MIT
