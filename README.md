# pi-context-enforcer

System-level context enforcement for pi coding agent. **Makes all LLM models behave consistently** by enforcing context loading at the tool level — not instruction level.

## What It Does

### 1. Context Enforcement (System-Level)

Registers a `read_context()` tool that the LLM must call before any `write`/`edit`/`bash`. If it doesn't, the extension **blocks the call**:

```
LLM calls write("src/main.py")
  → BLOCKED: "Context 'code' not loaded. Call read_context({ context_type: "code" }) first."
```

This works on **every model** — DeepSeek, Gemini, GPT, Claude — because it's enforced at the tool execution level, not via instruction text.

### 2. Global Code Standards

Four context files are auto-installed to `~/.pi/agent/context/`:

| File | Purpose |
|------|---------|
| `code-standards.md` | Code quality, naming, error handling, structure |
| `test-standards.md` | TDD workflow, test patterns, coverage expectations |
| `documentation-standards.md` | Docstring formats, README structure, anti-patterns |
| `security-patterns.md` | Secrets management, path traversal protection, API security |

The `read_context()` tool reads and returns the relevant file's content while recording that context has been loaded.

### 3. Subagent System

Four agent definitions are auto-installed to `~/.pi/agent/agents/`:

| Agent | Purpose | Model | Tools |
|-------|---------|-------|-------|
| `scout` | Fast codebase recon | deepseek-v4-flash | read, grep, find, ls, bash |
| `planner` | Implementation plans | gpt-5.5 | read, grep, find, ls |
| `worker` | Code implementation | deepseek-v4-pro | all default |
| `reviewer` | Code review | gpt-5.5 | read, grep, find, ls, bash |

Workflow prompt templates (accessible via `/command`):

| Command | Flow |
|---------|------|
| `/implement <query>` | scout → planner → worker |
| `/scout-and-plan <query>` | scout → planner |
| `/implement-and-review <query>` | worker → reviewer → worker |

In a chain, each subagent runs as an isolated `pi` process with its own model, tools, and context window.

### 4. Workflow Skills

Ten Superpowers workflow skills are included, forming a complete development methodology:

| Skill | When It Triggers |
|-------|-----------------|
| `brainstorming` | Before any creative work — refines ideas into designs |
| `writing-plans` | After design approval — breaks work into bite-sized tasks |
| `subagent-driven-development` | Executes tasks via isolated subagents with 2-stage review |
| `executing-plans` | Alternative: batch execution with human checkpoints |
| `test-driven-development` | During implementation — RED-GREEN-REFACTOR |
| `requesting-code-review` | Between tasks — reviews against the plan |
| `verification-before-completion` | Before claiming done — runs tests, checks diagnostics |
| `finishing-a-development-branch` | When tasks complete — merge/PR/discard decision |
| `systematic-debugging` | On bugs — 4-phase root cause process |
| `using-superpowers` | Session bootstrap — loads context + skills references |

## The Complete Flow

```
Session Start
  │
  ├─► using-superpowers skill loads
  │   → Shows Quick Routes (code/tests/docs/security → context file)
  │   → Shows Red Flags for context-skipping rationalization
  │
  ├─► context-enforcer extension loads
  │   → Registers read_context() tool
  │   → Blocks write/edit/bash until context loaded (all models)
  │   → Auto-installs agents + context files (first run only)
  │
  ▼
You: "I want to add a caching layer to the API"

  │
  ├─► Skill: brainstorming
  │   → Explores project, asks questions, proposes 2-3 approaches
  │   → Presents design, gets approval, saves spec
  │
  ├─► Skill: writing-plans
  │   → Breaks design into tasks (2-5 min each)
  │   → Each task: file paths, what to change, verification
  │
  ▼
Two paths:

  PATH A: /implement-and-review add redis caching        PATH B: Manual
    │                                                      │
    ├─ scout (deepseek-v4-flash)                            ├─ read_context("code")
    │   → Fast file search                                  │   → Extension reads context
    │                                                       │   → Records it
    ├─ planner (gpt-5.5) ← FRONTIER                        │
    │   → Architecture plan                                ├─ write/edit/bash
    │                                                       │   → Allowed (context loaded)
    ├─ worker (deepseek-v4-pro)
    │   → read_context("code") enforced                     ├─ Skill: TDD
    │   → Implements plan                                   │   → RED-GREEN-REFACTOR
    │   → Writes, tests, commits
    │                                                       ├─ Skill: code review
    └─ reviewer (gpt-5.5) ← FRONTIER                        │   → Verify against plan
        → Reads diff, checks quality
        → Critical/Warning/Suggestion                       └─ Skill: verification
                                                                 → Tests pass, diagnostics clean

  ▼
Skill: finishing-a-development-branch
  → Full test suite
  → Options: merge / PR / keep / discard
```

## Installation

```bash
pi install git:github.com/guyinwonder168/pi-context-enforcer
```

Or for a quick test:

```bash
pi -e git:github.com/guyinwonder168/pi-context-enforcer
```

### What Gets Installed

| Path | Content |
|------|---------|
| `~/.pi/agent/extensions/pi-context-enforcer/` | Extension (context enforcer + subagent dispatch) |
| `~/.pi/agent/skills/*/` | 10 workflow skills (brainstorming, TDD, code review, etc.) |
| `~/.pi/agent/agents/*.md` | Scout, planner, worker, reviewer definitions |
| `~/.pi/agent/context/*.md` | code-standards, test-standards, docs-standards, security-patterns |
| `~/.pi/agent/CONTEXT.md` | Context navigation index with Quick Routes table |
| `~/.pi/agent/prompts/*.md` | `/implement`, `/scout-and-plan`, `/implement-and-review` |

Agents, context files, and CONTEXT.md are auto-copied on first `session_start`. You can edit them anytime.

## Usage

### In Chat

```
# Read context before any work
read_context({ context_type: "all" })

# Then proceed
write ...
```

### Via Subagent Workflows

```
/implement add input validation to the login form
```

```
/implement-and-review add caching to the database layer
```

```
/scout-and-plan refactor the auth module to use OAuth
```

## How the Models Are Routed

```
Your chat ─── deepseek-v4-flash (cheap orchestrator)
  │
  ├── scout ── deepseek-v4-flash (fast file search)
  ├── planner ── gpt-5.5 (frontier — architecture decisions)
  ├── worker ── deepseek-v4-pro (mid — mechanical implementation)
  └── reviewer ── gpt-5.5 (frontier — bug detection)
```

You only pay frontier costs for planning + review. Everything else runs on cheap models.

## Uninstall

```bash
pi remove pi-context-enforcer
```

Optionally remove auto-installed files:

```bash
rm -rf ~/.pi/agent/agents ~/.pi/agent/context
```

## License

MIT
