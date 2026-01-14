import type { PlanJson, ScopeJson } from "./schemas.js";

export function plannerSystemPrompt(): string {
  return [
    "You are an expert software architect and senior engineer.",
    "You must produce a plan for implementing a feature request.",
    "",
    "CRITICAL RULES - READ CAREFULLY:",
    "1. ONLY use file paths that appear in the repository structure below. DO NOT invent paths.",
    "2. If you see 'frontend/lib/math.ts' in the structure, use THAT path, not 'src/lib/math.ts'.",
    "3. ONLY use test commands listed under 'Test commands'. Copy them EXACTLY.",
    "4. If no suitable files exist, create new files in the SAME directories as similar existing files.",
    "",
    "Other rules:",
    "- Do not propose repo-wide refactors.",
    "- Keep changes minimal and scoped.",
    "- Prefer targeted tests.",
    "- Output MUST be valid JSON matching the schema provided.",
    "- Do not wrap JSON in markdown fences."
  ].join("\n");
}

export function plannerUserPrompt(featureText: string, repoStructure?: string): string {
  const schema = `{
  "summary": "string",
  "steps": ["string"],
  "files_to_modify": [{"path":"string","reason":"string"}],
  "files_to_create": [{"path":"string","purpose":"string"}],
  "tests": [{"command":"COPY EXACTLY from 'Test commands' section above","reason":"string"}],
  "risks": ["string"]
}`;

  const parts = ["Feature request:", featureText.trim()];

  if (repoStructure) {
    parts.push(
      "",
      "=== REPOSITORY STRUCTURE (USE THESE EXACT PATHS) ===",
      repoStructure,
      "=== END REPOSITORY STRUCTURE ===",
      "",
      "REMINDER: For the 'tests' field, copy commands EXACTLY as shown in 'Test commands' above. Do NOT modify them."
    );
  }

  parts.push("", "Return a plan as JSON with this schema:", schema);

  return parts.join("\n");
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
    "You will receive a plan, scope, and current file contents.",
    "You must output the COMPLETE updated contents for each file that needs changes.",
    "",
    "Rules:",
    "- Make ONLY the changes described in the plan.",
    "- Do not refactor unrelated code.",
    "- Ensure code is syntactically correct.",
    "- Follow existing code style and patterns.",
    "- Include the ENTIRE file content, not just the changed parts.",
    "",
    "OUTPUT FORMAT - Return a JSON object with this exact structure:",
    '{',
    '  "files": [',
    '    {',
    '      "path": "path/to/file.ts",',
    '      "content": "full file content here..."',
    '    }',
    '  ],',
    '  "summary": "Brief description of changes made"',
    '}',
    "",
    "CRITICAL:",
    "- Output ONLY valid JSON, no markdown fences, no extra text",
    "- Use paths relative to repo root (e.g., frontend/lib/math.ts)",
    "- For each file, include the COMPLETE file content with your changes applied",
    "- Escape special characters properly in JSON strings (newlines as \\n, quotes as \\\")",
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
    "Files to modify/create:",
    JSON.stringify(params.scope, null, 2),
    "",
    "Current file contents:",
    filesSection,
    "",
    "Output the complete updated file contents as JSON."
  ].join("\n");
}

export function fixerSystemPrompt(): string {
  return [
    "You are an expert software engineer debugging test failures.",
    "You will receive test output showing failures and the current file contents.",
    "Your job is to fix ONLY the failing tests with minimal changes.",
    "",
    "Rules:",
    "- Fix ONLY what is broken; do not refactor or add features.",
    "- Make the smallest possible changes to fix the tests.",
    "",
    "Output Format:",
    "Return a JSON object with this exact structure:",
    '{ "files": [{ "path": "relative/path/to/file.ext", "content": "...full file content..." }], "summary": "Brief description of fixes" }',
    "",
    "CRITICAL:",
    "- Only include files you are modifying.",
    "- Each file's content must be the COMPLETE file with your fixes applied.",
    "- Output ONLY valid JSON, no markdown fences or other text."
  ].join("\n");
}

export function fixerUserPrompt(params: {
  testOutput: string;
  fileContents: { path: string; content: string }[];
}): string {
  const filesSection = params.fileContents
    .map((f) => `--- File: ${f.path} ---\n${f.content}`)
    .join("\n\n");

  return [
    "Test failures:",
    params.testOutput,
    "",
    "Current file contents:",
    filesSection,
    "",
    "Fix these test failures with minimal changes. Return JSON with the complete fixed files."
  ].join("\n");
}
