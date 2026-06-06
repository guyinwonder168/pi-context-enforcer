# Context Navigation

Load this file at session start to know which context file to read for each task type.

## Quick Routes

Use this table to find the right context file before starting any task:

| Task Type          | Context File                                      | When to load                                    |
|--------------------|---------------------------------------------------|-------------------------------------------------|
| Write/edit code    | `context/code-standards.md`                       | Before ANY code modification                    |
| Write tests        | `context/test-standards.md`                       | Before writing test files                       |
| Write docs         | `context/documentation-standards.md`              | Before writing documentation                    |
| Security review    | `context/security-patterns.md`                    | Before writing auth/security code               |
| Review code        | `context/code-standards.md` + project `AGENTS.md` | Before submitting review feedback               |
| Refactor           | `context/code-standards.md`                       | Before restructuring existing code              |
| Build/setup        | Project `README.md` + `AGENTS.md`                 | Before installing dependencies or build tools   |
| External lib       | Fetch current docs via Context7 / Firecrawl       | Before writing code that uses external packages |

## Loading Order

1. **Project AGENTS.md** (`.pi/agent/AGENTS.md` or project-root `AGENTS.md`) — highest priority, loaded at session start
2. **Skill files** (`.pi/agent/skills/` or `.agents/skills/`) — loaded on-demand via the Skill mechanism
3. **Context files** (`.pi/agent/context/`) — loaded per-task using the Quick Routes table above
4. **External docs** (Context7 / Firecrawl) — fetched per-task for external libraries and APIs

**Project-level AGENTS.md overrides global context.**

## Index

- `context/code-standards.md` — Code quality, naming, structure, patterns
- `context/test-standards.md` — Testing methodology, coverage, patterns
- `context/documentation-standards.md` — Documentation style, format, coverage
- `context/security-patterns.md` — Security rules, secrets, validation
