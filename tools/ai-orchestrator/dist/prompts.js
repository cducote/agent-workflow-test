export function plannerSystemPrompt() {
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
export function plannerUserPrompt(featureText, repoStructure) {
    const schema = `{
  "summary": "string",
  "steps": ["string"],
  "files_to_modify": [{"path":"string","reason":"string"}],
  "files_to_create": [{"path":"string","purpose":"string"}],
  "tests": [{"command":"string","reason":"string"}],
  "risks": ["string"]
}`;
    const parts = ["Feature request:", featureText.trim()];
    if (repoStructure) {
        parts.push("", "=== REPOSITORY STRUCTURE (USE THESE EXACT PATHS) ===", repoStructure, "=== END REPOSITORY STRUCTURE ===");
    }
    parts.push("", "Return a plan as JSON with this schema:", schema);
    return parts.join("\n");
}
export function scopeResolverSystemPrompt() {
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
export function scopeResolverUserPrompt(plan, repoStructure) {
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
export function implementerSystemPrompt() {
    return [
        "You are an expert software engineer implementing features.",
        "You will receive a plan, scope, and file contents.",
        "You must produce a unified diff patch that implements the requested changes.",
        "",
        "Rules:",
        "- Make ONLY the changes described in the plan.",
        "- Do not refactor unrelated code.",
        "- Keep diffs minimal and focused.",
        "- Ensure code is syntactically correct.",
        "- Follow existing code style and patterns.",
        "",
        "CRITICAL DIFF FORMAT - Your output MUST follow this EXACT structure:",
        "",
        "diff --git a/path/to/file.ts b/path/to/file.ts",
        "index abc1234..def5678 100644",
        "--- a/path/to/file.ts",
        "+++ b/path/to/file.ts",
        "@@ -10,7 +10,8 @@ function example() {",
        "   context line (unchanged)",
        "-  old line to remove",
        "+  new line to add",
        "   context line (unchanged)",
        "",
        "RULES:",
        "- Start output IMMEDIATELY with 'diff --git' - NO text before it",
        "- NO markdown fences (```) anywhere",
        "- NO explanations or comments after the diff",
        "- Use paths relative to repo root (e.g., frontend/lib/math.ts)",
        "- For NEW files: use '--- /dev/null' and 'new file mode 100644'",
        "- Line counts in @@ headers must be accurate",
        "- End each file's diff with a blank line"
    ].join("\n");
}
export function implementerUserPrompt(params) {
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
export function fixerSystemPrompt() {
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
export function fixerUserPrompt(params) {
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
