import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { existsSync, readFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Paths ──────────────────────────────────────────────────────
const MY_DIR = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(MY_DIR, "..");
const ASSETS_DIR = join(PKG_ROOT, "assets");

const CONTEXT_DIR = join(getAgentDir(), "context");
const AGENTS_DIR = join(getAgentDir(), "agents");

const CONTEXT_FILES: Record<string, { file: string; label: string }> = {
  code: { file: "code-standards.md", label: "Code Standards" },
  tests: { file: "test-standards.md", label: "Test Standards" },
  docs: { file: "documentation-standards.md", label: "Documentation Standards" },
  security: { file: "security-patterns.md", label: "Security Patterns" },
};

// ─── Auto-install assets on first load ──────────────────────────
function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function installAssets(srcDir: string, destDir: string, label: string) {
  ensureDir(destDir);
  const srcFiles = readdirSafe(srcDir);
  let installed = 0;
  for (const f of srcFiles) {
    if (!f.endsWith(".md")) continue;
    const dest = join(destDir, f);
    if (!existsSync(dest)) {
      cpSync(join(srcDir, f), dest);
      installed++;
    }
  }
  return installed;
}

function readdirSafe(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function installOnce() {
  const installed: string[] = [];

  const agentsSrc = join(ASSETS_DIR, "agents");
  const ctxSrc = join(ASSETS_DIR, "context");

  if (existsSync(agentsSrc)) {
    const n = installAssets(agentsSrc, AGENTS_DIR, "agents");
    if (n > 0) installed.push(`${n} agents → ${AGENTS_DIR}`);
  }
  if (existsSync(ctxSrc)) {
    const n = installAssets(ctxSrc, CONTEXT_DIR, "context");
    if (n > 0) installed.push(`${n} context files → ${CONTEXT_DIR}`);
    // Also copy CONTEXT.md navigation index to pi agent root
    const navSrc = join(ctxSrc, "CONTEXT.md");
    const navDest = join(getAgentDir(), "CONTEXT.md");
    if (existsSync(navSrc) && !existsSync(navDest)) {
      cpSync(navSrc, navDest);
      installed.push(`CONTEXT.md → ${navDest}`);
    }
  }

  return installed;
}

// ─── Context tool + enforcement ─────────────────────────────────
export default function (pi: ExtensionAPI) {
  const loadedContexts = new Set<string>();
  let warned = false;

  // Auto-install assets on session start
  pi.on("session_start", async () => {
    const result = installOnce();
    if (result.length > 0) {
      console.log(`[pi-context-enforcer] Installed: ${result.join("; ")}`);
    }
  });

  // ─── read_context tool ──────────────────────────────────────────
  pi.registerTool({
    name: "read_context",
    label: "Read Context",
    description:
      "MANDATORY: Call BEFORE any write/edit/bash. Reads the relevant " +
      "standards file from the global context directory and records " +
      "that context has been loaded. Without this call, write/edit/bash " +
      "will be blocked at the system level.",
    parameters: Type.Object({
      context_type: Type.Union(
        [
          Type.Literal("code"),
          Type.Literal("tests"),
          Type.Literal("docs"),
          Type.Literal("security"),
          Type.Literal("all"),
        ],
        {
          description:
            "Which context to load. 'code' for code-standards.md, " +
            "'tests' for test-standards.md, 'docs' for doc-standards.md, " +
            "'security' for security-patterns.md, 'all' for everything.",
        },
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const contextTypes =
        params.context_type === "all"
          ? ["code", "tests", "docs", "security"]
          : [params.context_type];

      const parts: string[] = [];
      const errors: string[] = [];

      for (const ct of contextTypes) {
        const entry = CONTEXT_FILES[ct];
        if (!entry) continue;

        const filePath = join(CONTEXT_DIR, entry.file);
        if (!existsSync(filePath)) {
          errors.push(`❌ ${entry.file} not found at ${filePath}`);
          continue;
        }

        const content = readFileSync(filePath, "utf-8");
        loadedContexts.add(ct);
        parts.push(`# ${entry.label}\n\n${content}`);
      }

      const allText = parts.join("\n\n---\n\n");

      const msg =
        errors.length > 0
          ? `Loaded context (${params.context_type}):\n\n${allText}\n\n⚠️ Errors:\n${errors.join("\n")}`
          : `✅ Context loaded (${params.context_type}). Read the content above. You may now proceed with write/edit/bash.`;

      return {
        content: [{ type: "text", text: msg }],
        details: { loaded: Array.from(loadedContexts), context_type: params.context_type },
      };
    },
  });

  // ─── Intercept write/edit/bash ──────────────────────────────────
  pi.on("tool_call", async (event, ctx) => {
    const toolName = event.toolName;
    if (toolName !== "write" && toolName !== "edit" && toolName !== "bash") return;

    let requiredContext: string | null = null;

    if (toolName === "write" || toolName === "edit") {
      const input = event.input as { filePath?: string };
      const path = input?.filePath ?? "";
      if (/test/i.test(path)) requiredContext = "tests";
      else if (/doc/i.test(path) || path.endsWith(".md")) requiredContext = "docs";
      else if (/sec|auth|permission|token/i.test(path)) requiredContext = "security";
      else requiredContext = "code";
    } else if (toolName === "bash") {
      const input = event.input as { command?: string };
      const cmd = input?.command ?? "";
      if (/^(ls|cat|echo|pwd|which|git status|git diff)/i.test(cmd.trim())) return;
      requiredContext = "code";
    }

    if (!requiredContext) return;

    if (!loadedContexts.has(requiredContext)) {
      if (!warned) {
        warned = true;
        ctx.ui.notify(`⚠️ Blocked ${toolName}: load '${requiredContext}' context first`, "warning");
      }
      return {
        block: true,
        reason: `Context '${requiredContext}' not loaded yet. Call read_context({ context_type: "${requiredContext}" }) first, then retry.`,
      };
    }
  });

  // ─── Inject mandatory instructions ──────────────────────────────
  pi.on("before_agent_start", async (event) => {
    if (loadedContexts.size > 0) return;
    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n## ⚡ MANDATORY: Load Context Before Execution\n\n" +
        "Before any write/edit/bash, call `read_context()` to load the relevant standards. " +
        "Enforced at system level — write/edit/bash will be BLOCKED otherwise.\n\n" +
        "| Task Type | Call |\n" +
        "|---|---|\n" +
        "| Write/edit code | `read_context({ context_type: \"code\" })` |\n" +
        "| Write tests | `read_context({ context_type: \"tests\" })` |\n" +
        "| Write docs | `read_context({ context_type: \"docs\" })` |\n" +
        "| Security code | `read_context({ context_type: \"security\" })` |\n" +
        "| Not sure | `read_context({ context_type: \"all\" })` |\n" +
        "| External lib | fetch current docs via Context7 / Firecrawl |\n\n" +
        "Call `read_context()` first, then proceed. Applies to ALL tasks.",
    };
  });
}
