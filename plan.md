Implementation Plan: Agent Orchestration Layer (GitHub + Claude API)
Goals

Run “fleet-style” AI assistance for planning → coding → validation → PR output without blowing context/quota.

Make AI runs opt-in (labels/commands/manual dispatch) and non-blocking for merges.

Keep runs scoped, bounded, reproducible, with clear logs and artifacts.

Non-Goals

Fully autonomous merging to main.

Long-running “keep working until done” loops.

Repo-wide codebase ingestion.

High-Level Architecture
Components

Trigger Layer (GitHub Actions)

Starts runs when explicitly requested.

Passes run configuration (feature request, scope hints, constraints) to orchestrator.

Orchestrator (Node.js or Python)

Core state machine:

intake → plan → select scope → implement → test → iterate (bounded) → summarize

Calls Anthropic API.

Applies patches, runs tests, and produces artifacts.

Execution Environment

GitHub-hosted runner (Ubuntu).

Repository checked out at PR SHA.

Orchestrator runs locally on the runner.

Outputs

Patch applied to a branch (or attached as artifact if you don’t want auto-push).

Comment back to PR with plan/results + links to logs/artifacts.

Optional: open/update PR if running on an issue.

Trigger Design (Opt-in Only)
Supported Triggers (choose 1–2 to start)

PR label: ai-implement

PR comment slash command: /ai implement or /ai plan

Manual dispatch: workflow_dispatch with inputs

Rules

Do not run automatically on every push.

Do not require AI jobs as branch protection checks.

Add concurrency so repeated pushes cancel in-progress runs.

Run Modes

Define modes so the same system can do “plan only” or “implement”.

Plan Mode

Generate architecture + file list + test strategy.

No code changes.

Implement Mode

Uses a plan (generated or provided) + scope hints.

Produces a minimal diff, runs tests, and reports results.

Fix Mode

When tests fail, attempt up to N fix iterations.

Stop and report if still failing.

Guardrails & Limits (Critical)
Context/Safety

Max files per run (e.g., 10–20).

Max bytes per file (e.g., 60–120 KB).

Exclude: node_modules/, dist/, .next/, lockfiles unless explicitly needed.

Strip secrets from logs; never include GitHub tokens in model context.

Cost/Looping

Max iterations:

Implement loop: 1

Fix loop: 2

Max diff size:

<= 300 lines (configurable)

Max tokens per call (configurable in orchestrator).

If scope grows beyond limits, stop and ask for human input.

Determinism

Record:

trigger type

commit SHA

plan

files used as context

model + parameters

test command(s) run

Upload artifacts (plan JSON, diff patch, logs).

State Machine
State 0: Intake

Inputs:

Mode: plan/implement/fix

Feature description (issue body / PR description / comment text)

Optional scope hints (paths)

Constraints (max files, max iterations, test command)

Output:

Normalized “RunSpec” object.

State 1: Planning (Planner Agent)

Prompt:

Produce:

approach summary

key decisions

proposed file changes

test plan

risk notes

Must return machine-readable JSON.

Output:

plan.json

State 2: Scope Resolution (Resolver)

Use plan.json + optional user hints.

Build a concrete file list:

existing files to read

new files to create

Enforce allow/deny patterns + size limits.

Output:

scope.json (list of files + rationale)

State 3: Implementation (Implementer Agent)

Inputs to model:

Feature request

plan.json and scope.json

Contents of scoped files only

Repo constraints (lint/test commands, code style rules)

Output:

Unified diff patch (or a structured “file edits” JSON).

State 4: Apply Patch

Apply patch to working tree.

If patch fails:

attempt 1 rebase/retry with a “patch failed” prompt

else stop.

State 5: Validate

Run minimal test commands:

Prefer targeted tests first (based on plan)

Then broader suite if configured

Capture output and truncate logs for model input if needed.

State 6: Fix Loop (bounded)

If failing and remaining attempts > 0:

Provide only:

failing test summary

relevant file snippets

last diff summary

Ask for a minimal fix diff.

Apply + retest.

Stop after max attempts.

State 7: Report

Post a PR comment with:

what changed

tests run + results

next steps / manual follow-ups

Upload artifacts:

plan.json, scope.json

changes.patch

test-output.txt (trimmed)

run-metadata.json

Optional:

Push changes to a branch and update PR.

Model Interaction Contract
Use Structured Outputs

Require JSON for planning and scope steps.

plan.json schema (example)
{
  "summary": "string",
  "steps": ["string"],
  "files_to_modify": [{"path": "string", "reason": "string"}],
  "files_to_create": [{"path": "string", "purpose": "string"}],
  "tests": [{"command": "string", "reason": "string"}],
  "risks": ["string"]
}

scope.json schema (example)
{
  "included_files": [{"path": "string", "max_bytes": 80000}],
  "excluded_patterns": ["node_modules/**", ".next/**"],
  "notes": "string"
}

Diff Format

Require a unified diff:

diff --git a/... b/...

Correct paths

No binary changes

Minimal changes only

Repository Integration (GitHub Actions)
Workflow: ai-orchestrator.yml

Triggers:

issue_comment (for /ai implement)

pull_request (for label ai-implement)

workflow_dispatch (manual)

Steps:

Checkout

Setup Node/Python

Install deps (if needed)

Run orchestrator script

Upload artifacts

Comment results back to PR

(Optional) Push branch / update PR

Add:

concurrency cancel in progress

permissions minimal:

contents: write only if pushing changes

pull-requests: write for commenting

otherwise read-only

Secrets:

ANTHROPIC_API_KEY

GITHUB_TOKEN (provided)

Optional budget guard variables

Implementation Details
Language Choice

Node.js recommended (fits GitHub Actions + TS ecosystem).

Python also fine; pick based on your team.

Suggested Project Layout
tools/ai-orchestrator/
  src/
    index.ts
    github.ts
    anthropic.ts
    planner.ts
    implementer.ts
    scope.ts
    patch.ts
    testRunner.ts
    report.ts
    schemas.ts
  prompts/
    planner.md
    implementer.md
    fixer.md
  package.json
  tsconfig.json

Key Modules

github.ts

fetch PR info, labels, comment body

post PR comment

create/update branch (optional)

anthropic.ts

API client wrapper

retries with backoff

token caps + logging

scope.ts

file inclusion logic

size limits + exclusions

patch.ts

apply diff

detect failures

summarize diff for reporting

testRunner.ts

run commands

capture stdout/stderr

truncate logs intelligently

report.ts

build markdown report

attach artifacts links

CI / Safety Defaults (Recommended)

Default to Plan Mode unless explicitly asked for implement.

Default to no branch push; upload patch artifact instead.

Allow “push changes” only when:

label ai-apply is present

or manual dispatch input is true

Step-by-Step Build Plan
Phase 1 — Scaffold + “Plan Mode”

Create orchestrator project (tools/ai-orchestrator)

Implement GitHub trigger parsing (comment/label/dispatch)

Implement Anthropic client wrapper

Implement Planner agent and plan.json output

Upload artifacts + comment plan back to PR

Deliverable: PR comment with plan + artifacts, no code changes.

Phase 2 — Scope + Implementation

Implement scope resolver + file reading

Implement Implementer agent to generate diff

Apply patch locally

Upload changes.patch + summary comment

Deliverable: patch artifact + summary, still no auto-push.

Phase 3 — Validation + Fix Loop

Add targeted test execution

Add bounded fix loop using failing output snippets

Include final status + logs in artifacts

Deliverable: “attempted fix” workflow with bounded retries.

Phase 4 — Optional Branch Push + PR Updates

Create branch naming scheme (ai/<pr>-<timestamp>)

Commit changes with clear message

Push branch and update PR (or open PR from issue)

Deliverable: hands-off PR update capability with opt-in gate.

Acceptance Criteria

Orchestrator runs only when explicitly triggered.

No repo-wide ingestion; respects file count/size limits.

Produces plan.json, scope.json, changes.patch, test-output.txt.

Bounded retries; never loops indefinitely.

Posts a clear PR comment summarizing:

what it did

what changed

what tests ran

what failed (if anything)

Does not block merges when quota/context is exceeded.

Hand-off Notes to Claude (Implementation Constraints)

Keep diffs minimal; avoid refactors unless requested.

Add robust logging and artifact upload for debugging.

Treat test output as untrusted/large; truncate for model input.

Never include secrets in model context or comments.

Provide a DRY_RUN=true mode that skips applying patches/pushing.

Below are two concrete artifacts you can drop into your repo so Claude can implement Phase 1 (“Plan Mode”) end-to-end:

a GitHub Actions workflow (.github/workflows/ai-orchestrator.yml)

a minimal TypeScript orchestrator skeleton (tools/ai-orchestrator/src/index.ts + a few tiny helper files)

These are intentionally “thin but real”: they parse a trigger, build a RunSpec, call Claude via API, write plan.json, upload it as an artifact, and (for PRs) comment the plan back.

1) .github/workflows/ai-orchestrator.yml
name: AI Orchestrator

on:
  workflow_dispatch:
    inputs:
      mode:
        description: "Run mode"
        required: true
        default: "plan"
        type: choice
        options: [plan, implement, fix]
      pr_number:
        description: "PR number (optional; if set, will comment on PR)"
        required: false
        type: string
      feature:
        description: "Feature request text (optional; overrides PR/issue text)"
        required: false
        type: string

  issue_comment:
    types: [created]

  pull_request:
    types: [labeled]

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'issue_comment' && startsWith(github.event.comment.body, '/ai ')) ||
      (github.event_name == 'pull_request' && github.event.label.name == 'ai-plan')

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install root dependencies
        run: npm ci

      - name: Install orchestrator dependencies
        working-directory: tools/ai-orchestrator
        run: npm ci

      - name: Run orchestrator
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_EVENT_NAME: ${{ github.event_name }}
          GITHUB_EVENT_PATH: ${{ github.event_path }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_SHA: ${{ github.sha }}
          INPUT_MODE: ${{ github.event.inputs.mode }}
          INPUT_PR_NUMBER: ${{ github.event.inputs.pr_number }}
          INPUT_FEATURE: ${{ github.event.inputs.feature }}
        working-directory: tools/ai-orchestrator
        run: npm run start

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ai-orchestrator-artifacts
          path: tools/ai-orchestrator/out/**
          if-no-files-found: error


Trigger behavior:

pull_request runs only when label ai-plan is applied.

issue_comment runs only when the comment starts with /ai (e.g. /ai plan ...).

workflow_dispatch lets you run it manually.

2) Orchestrator skeleton (TypeScript)
tools/ai-orchestrator/package.json
{
  "name": "ai-orchestrator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "node --enable-source-maps dist/index.js",
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@octokit/rest": "^21.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.16.0",
    "typescript": "^5.4.0"
  }
}

tools/ai-orchestrator/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"]
}

tools/ai-orchestrator/src/schemas.ts
export type RunMode = "plan" | "implement" | "fix";

export type RunSpec = {
  mode: RunMode;
  repository: string; // owner/repo
  sha: string;
  // PR context (if applicable)
  prNumber?: number;
  // Feature/request text the agent should work from
  featureText: string;
  // Raw trigger info for audit/debug
  trigger: {
    eventName: string;
    actor?: string;
    source: "workflow_dispatch" | "issue_comment" | "pull_request" | "unknown";
  };
  constraints: {
    maxPlanTokens: number;
  };
};

export type PlanJson = {
  summary: string;
  steps: string[];
  files_to_modify: { path: string; reason: string }[];
  files_to_create: { path: string; purpose: string }[];
  tests: { command: string; reason: string }[];
  risks: string[];
};

tools/ai-orchestrator/src/github.ts
import { Octokit } from "@octokit/rest";

export function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return new Octokit({ auth: token });
}

export function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Invalid GITHUB_REPOSITORY: ${repo}`);
  return { owner, repo: name };
}

export async function commentOnPullRequest(params: {
  repoFull: string;
  prNumber: number;
  body: string;
}) {
  const octokit = getOctokit();
  const { owner, repo } = parseRepo(params.repoFull);
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: params.prNumber,
    body: params.body,
  });
}

export async function getPullRequestBody(params: {
  repoFull: string;
  prNumber: number;
}): Promise<{ title: string; body: string }> {
  const octokit = getOctokit();
  const { owner, repo } = parseRepo(params.repoFull);
  const pr = await octokit.pulls.get({ owner, repo, pull_number: params.prNumber });
  return { title: pr.data.title ?? "", body: pr.data.body ?? "" };
}

tools/ai-orchestrator/src/anthropic.ts
type AnthropicMessageResponse = {
  content: Array<{ type: string; text?: string }>;
};

export async function callClaude(params: {
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

  // NOTE: This uses Anthropic's Messages API shape.
  // If your environment uses a proxy/provider, adjust the URL/headers accordingly.
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: params.maxTokens,
      system: params.system,
      messages: [{ role: "user", content: params.user }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as AnthropicMessageResponse;
  const text = json.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Empty response from Claude");
  return text;
}

tools/ai-orchestrator/src/prompts.ts
export function plannerSystemPrompt(): string {
  return [
    "You are an expert software architect and senior engineer.",
    "You must produce a plan for implementing a feature request.",
    "Rules:",
    "- Do not propose repo-wide refactors.",
    "- Keep changes minimal and scoped.",
    "- Prefer targeted tests.",
    "- Output MUST be valid JSON that matches the schema provided.",
    "- Do not wrap JSON in markdown fences."
  ].join("\n");
}

export function plannerUserPrompt(featureText: string): string {
  const schema = `{
  "summary": "string",
  "steps": ["string"],
  "files_to_modify": [{"path":"string","reason":"string"}],
  "files_to_create": [{"path":"string","purpose":"string"}],
  "tests": [{"command":"string","reason":"string"}],
  "risks": ["string"]
}`;
  return [
    "Feature request:",
    featureText.trim(),
    "",
    "Return a plan as JSON with this schema:",
    schema
  ].join("\n");
}

tools/ai-orchestrator/src/runSpec.ts
import fs from "node:fs";
import path from "node:path";
import { RunMode, RunSpec } from "./schemas.js";
import { getPullRequestBody } from "./github.js";

type GitHubEvent = any;

function readEvent(): GitHubEvent {
  const p = process.env.GITHUB_EVENT_PATH;
  if (!p) return {};
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseModeFromInputs(eventName: string, event: GitHubEvent): RunMode {
  const inputMode = (process.env.INPUT_MODE || "").trim() as RunMode;
  if (inputMode) return inputMode;

  if (eventName === "issue_comment") {
    const body = (event?.comment?.body || "").trim();
    // Supported: "/ai plan ..." or "/ai implement ..." etc.
    const m = body.match(/^\/ai\s+(\w+)/i);
    const cmd = (m?.[1] || "plan").toLowerCase();
    if (cmd === "implement" || cmd === "fix" || cmd === "plan") return cmd as RunMode;
    return "plan";
  }

  if (eventName === "pull_request") return "plan";
  return "plan";
}

function parsePrNumber(eventName: string, event: GitHubEvent): number | undefined {
  const inputPr = (process.env.INPUT_PR_NUMBER || "").trim();
  if (inputPr) {
    const n = Number(inputPr);
    if (Number.isFinite(n) && n > 0) return n;
  }

  if (eventName === "pull_request") return event?.pull_request?.number;
  if (eventName === "issue_comment") return event?.issue?.pull_request ? event?.issue?.number : undefined;
  return undefined;
}

function featureOverride(): string | undefined {
  const f = (process.env.INPUT_FEATURE || "").trim();
  return f || undefined;
}

export async function buildRunSpec(): Promise<RunSpec> {
  const eventName = process.env.GITHUB_EVENT_NAME || "unknown";
  const repository = process.env.GITHUB_REPOSITORY || "";
  const sha = process.env.GITHUB_SHA || "";

  if (!repository) throw new Error("Missing GITHUB_REPOSITORY");
  if (!sha) throw new Error("Missing GITHUB_SHA");

  const event = readEvent();
  const mode = parseModeFromInputs(eventName, event);
  const prNumber = parsePrNumber(eventName, event);

  let featureText =
    featureOverride() ||
    (eventName === "issue_comment" ? (event?.comment?.body || "") : "") ||
    "";

  // If we have a PR number and no explicit feature text, pull title/body as baseline.
  if (prNumber && !featureOverride()) {
    const pr = await getPullRequestBody({ repoFull: repository, prNumber });
    const parts = [
      `PR Title: ${pr.title}`,
      "",
      pr.body?.trim() ? `PR Body:\n${pr.body.trim()}` : "PR Body: (empty)",
    ];
    featureText = parts.join("\n");
  }

  if (!featureText.trim()) {
    featureText = "No feature text provided. Produce a reasonable planning checklist and ask for missing details.";
  }

  const source =
    eventName === "workflow_dispatch"
      ? "workflow_dispatch"
      : eventName === "issue_comment"
        ? "issue_comment"
        : eventName === "pull_request"
          ? "pull_request"
          : "unknown";

  return {
    mode,
    repository,
    sha,
    prNumber,
    featureText,
    trigger: {
      eventName,
      actor: event?.sender?.login,
      source,
    },
    constraints: {
      maxPlanTokens: 1200,
    },
  };
}

tools/ai-orchestrator/src/index.ts
import fs from "node:fs";
import path from "node:path";
import { buildRunSpec } from "./runSpec.js";
import { callClaude } from "./anthropic.js";
import { plannerSystemPrompt, plannerUserPrompt } from "./prompts.js";
import { commentOnPullRequest } from "./github.js";
import type { PlanJson } from "./schemas.js";

function ensureOutDir(): string {
  const outDir = path.join(process.cwd(), "out");
  fs.mkdirSync(outDir, { recursive: true });
  return outDir;
}

function safeJsonParse<T>(text: string): T {
  // Claude should return raw JSON; still, guard against leading/trailing noise.
  const trimmed = text.trim();

  // Best-effort: if there is surrounding text, attempt to extract the first JSON object.
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Claude response did not contain a JSON object.");
  }

  const jsonSlice = trimmed.slice(start, end + 1);
  return JSON.parse(jsonSlice) as T;
}

function planToMarkdown(plan: PlanJson): string {
  const filesMod = plan.files_to_modify?.length
    ? plan.files_to_modify.map((f) => `- \`${f.path}\`: ${f.reason}`).join("\n")
    : "- (none)";
  const filesNew = plan.files_to_create?.length
    ? plan.files_to_create.map((f) => `- \`${f.path}\`: ${f.purpose}`).join("\n")
    : "- (none)";
  const tests = plan.tests?.length
    ? plan.tests.map((t) => `- \`${t.command}\`: ${t.reason}`).join("\n")
    : "- (none)";
  const steps = plan.steps?.length ? plan.steps.map((s) => `- ${s}`).join("\n") : "- (none)";
  const risks = plan.risks?.length ? plan.risks.map((r) => `- ${r}`).join("\n") : "- (none)";

  return [
    "## 🤖 AI Plan (Plan Mode)",
    "",
    plan.summary ? plan.summary : "",
    "",
    "### Steps",
    steps,
    "",
    "### Files to modify",
    filesMod,
    "",
    "### Files to create",
    filesNew,
    "",
    "### Tests",
    tests,
    "",
    "### Risks / Notes",
    risks,
    "",
    "_Artifacts: see `ai-orchestrator-artifacts` in the workflow run._",
  ].join("\n");
}

async function main() {
  const outDir = ensureOutDir();

  const runSpec = await buildRunSpec();
  fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));

  if (runSpec.mode !== "plan") {
    // Phase 1 only: keep future modes explicit.
    fs.writeFileSync(
      path.join(outDir, "notice.txt"),
      `Mode '${runSpec.mode}' not implemented in Phase 1. Use mode 'plan'.\n`
    );
    console.log(`Mode '${runSpec.mode}' not implemented yet.`);
    return;
  }

  const system = plannerSystemPrompt();
  const user = plannerUserPrompt(runSpec.featureText);

  const raw = await callClaude({
    system,
    user,
    maxTokens: runSpec.constraints.maxPlanTokens,
  });

  fs.writeFileSync(path.join(outDir, "claude-raw.txt"), raw);

  const plan = safeJsonParse<PlanJson>(raw);
  fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));

  // Comment back on PR if we have PR context.
  if (runSpec.prNumber) {
    const md = planToMarkdown(plan);
    await commentOnPullRequest({
      repoFull: runSpec.repository,
      prNumber: runSpec.prNumber,
      body: md,
    });
    fs.writeFileSync(path.join(outDir, "commented.txt"), `Commented on PR #${runSpec.prNumber}\n`);
  } else {
    fs.writeFileSync(path.join(outDir, "commented.txt"), "No PR context; did not comment.\n");
  }

  console.log("Plan Mode complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

How to wire it into your repo

Create folders/files:

.github/workflows/ai-orchestrator.yml

tools/ai-orchestrator/* as above

Add a secret in GitHub:

ANTHROPIC_API_KEY

Ensure root package.json has dependencies needed for root npm ci (your repo already does).
If you don’t have a root package-lock.json because frontend is separate, adjust the workflow to npm ci in the right directory.

How to use it
Trigger from PR label

Add label ai-plan to a PR → it comments with the plan.

Trigger from PR comment

Comment:

/ai plan Please add X and update Y

Manual

Actions tab → AI Orchestrator → Run workflow
Provide:

mode = plan

pr_number (optional)