import type { PlanJson, ScopeJson } from "./schemas.js";

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

export function scopeResolverSystemPrompt(): string {
  return [
    "You are an expert at identifying which files are needed for a feature implementation.",
    "Given a plan, you must determine exactly which files to include in the implementation context.",
    "Rules:",
    "- Include only files that will be modified or are essential dependencies.",
    "- Exclude node_modules, dist, build artifacts, lock files unless explicitly needed.",
    "- Keep the list minimal to avoid context bloat.",
    "- Output MUST be valid JSON matching the schema provided.",
    "- Do not wrap JSON in markdown fences."
  ].join("\n");
}

export function scopeResolverUserPrompt(plan: PlanJson, repoStructure: string): string {
  const schema = `{
  "included_files": [{"path":"string","max_bytes":80000}],
  "excluded_patterns": ["string"],
  "notes": "string"
}`;
  return [
    "Plan:",
    JSON.stringify(plan, null, 2),
    "",
    "Repository structure (sample):",
    repoStructure,
    "",
    "Return a scope resolution as JSON with this schema:",
    schema
  ].join("\n");
}

export function implementerSystemPrompt(): string {
  return [
    "You are an expert software engineer implementing features.",
    "You will receive a plan, scope, and file contents.",
    "You must produce a unified diff patch that implements the requested changes.",
    "Rules:",
    "- Make ONLY the changes described in the plan.",
    "- Do not refactor unrelated code.",
    "- Keep diffs minimal.",
    "- Ensure code is syntactically correct.",
    "- Follow existing code style and patterns.",
    "- Output MUST be a valid unified diff format (diff --git a/... b/...).",
    "- For new files, use /dev/null as the source.",
    "- Do NOT wrap the diff in markdown fences or any other formatting."
  ].join("\n");
}

export function implementerUserPrompt(params: {
  plan: PlanJson;
  scope: ScopeJson;
  fileContents: { path: string; content: string }[];
}): string {
  const filesSection = params.fileContents
    .map((f) => `--- File: ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return [
    "Plan:",
    JSON.stringify(params.plan, null, 2),
    "",
    "Scope:",
    JSON.stringify(params.scope, null, 2),
    "",
    "Current file contents:",
    filesSection,
    "",
    "Generate a unified diff patch implementing this plan."
  ].join("\n");
}

export function fixerSystemPrompt(): string {
  return [
    "You are an expert software engineer debugging test failures.",
    "You will receive a diff that was applied, test output showing failures, and relevant file contents.",
    "You must produce a MINIMAL unified diff patch that fixes ONLY the failing tests.",
    "Rules:",
    "- Fix ONLY what is broken; do not refactor or add features.",
    "- Keep the diff as small as possible.",
    "- Output MUST be a valid unified diff format.",
    "- Do NOT wrap the diff in markdown fences."
  ].join("\n");
}

export function fixerUserPrompt(params: {
  previousDiff: string;
  testOutput: string;
  fileContents: { path: string; content: string }[];
}): string {
  const filesSection = params.fileContents
    .map((f) => `--- File: ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return [
    "Previous diff applied:",
    params.previousDiff,
    "",
    "Test failures:",
    params.testOutput,
    "",
    "Current file contents:",
    filesSection,
    "",
    "Generate a minimal unified diff patch that fixes these test failures."
  ].join("\n");
}
