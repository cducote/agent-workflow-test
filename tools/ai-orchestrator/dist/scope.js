import fs from "node:fs";
import { callClaude } from "./anthropic.js";
import { scopeResolverSystemPrompt, scopeResolverUserPrompt } from "./prompts.js";
const EXCLUDED_PATTERNS = [
    "node_modules/**",
    "dist/**",
    "build/**",
    ".next/**",
    "*.lock",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
];
export async function resolveScope(plan, runSpec) {
    // Get a sample of repo structure
    const repoStructure = await getRepoStructure();
    const system = scopeResolverSystemPrompt();
    const user = scopeResolverUserPrompt(plan, repoStructure);
    const raw = await callClaude({
        system,
        user,
        maxTokens: 1000,
    });
    const scope = safeJsonParse(raw);
    // Enforce constraints
    const filtered = scope.included_files.filter((f) => {
        // Check file exists
        try {
            const stat = fs.statSync(f.path);
            if (!stat.isFile())
                return false;
            if (stat.size > runSpec.constraints.maxFileBytes) {
                console.warn(`Skipping ${f.path}: exceeds max file size`);
                return false;
            }
            return true;
        }
        catch {
            console.warn(`Skipping ${f.path}: file not found`);
            return false;
        }
    });
    if (filtered.length > runSpec.constraints.maxFiles) {
        console.warn(`Scope has ${filtered.length} files; limiting to ${runSpec.constraints.maxFiles}`);
        scope.included_files = filtered.slice(0, runSpec.constraints.maxFiles);
    }
    else {
        scope.included_files = filtered;
    }
    scope.excluded_patterns = EXCLUDED_PATTERNS;
    return scope;
}
export async function readFileContents(scope) {
    const results = [];
    for (const file of scope.included_files) {
        try {
            const content = fs.readFileSync(file.path, "utf8");
            results.push({ path: file.path, content });
        }
        catch (err) {
            console.warn(`Could not read ${file.path}:`, err);
        }
    }
    return results;
}
async function getRepoStructure() {
    // Simple: just list top-level directories and a few key files
    try {
        const entries = fs.readdirSync(".", { withFileTypes: true });
        const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
        const files = entries.filter((e) => e.isFile()).map((e) => e.name);
        return [
            "Directories:",
            ...dirs.map((d) => `  ${d}/`),
            "",
            "Files:",
            ...files.map((f) => `  ${f}`),
        ].join("\n");
    }
    catch {
        return "Unable to read repository structure.";
    }
}
function safeJsonParse(text) {
    const trimmed = text.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("Response did not contain a JSON object.");
    }
    const jsonSlice = trimmed.slice(start, end + 1);
    return JSON.parse(jsonSlice);
}
