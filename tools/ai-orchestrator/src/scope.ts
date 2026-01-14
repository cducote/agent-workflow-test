import fs from "node:fs";
import path from "node:path";
import { PlanJson, ScopeJson, RunSpec } from "./schemas.js";
import { callAI } from "./aiProvider.js";
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

export async function resolveScope(plan: PlanJson, runSpec: RunSpec): Promise<ScopeJson> {
  // Get a sample of repo structure
  const repoStructure = await getRepoStructure();
  const repoRoot = findRepoRoot();

  const system = scopeResolverSystemPrompt();
  const user = scopeResolverUserPrompt(plan, repoStructure);

  const raw = await callAI({
    system,
    user,
    maxTokens: 1000,
  });

  const scope = safeJsonParse<ScopeJson>(raw);

  // Enforce constraints - resolve paths relative to repo root
  const filtered = scope.included_files.filter((f) => {
    // Resolve path relative to repo root
    const fullPath = path.isAbsolute(f.path) ? f.path : path.join(repoRoot, f.path);
    // Check file exists
    try {
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) return false;
      if (stat.size > runSpec.constraints.maxFileBytes) {
        console.warn(`Skipping ${f.path}: exceeds max file size`);
        return false;
      }
      // Update the path to be absolute for later use
      f.path = fullPath;
      return true;
    } catch {
      console.warn(`Skipping ${f.path}: file not found at ${fullPath}`);
      return false;
    }
  });

  if (filtered.length > runSpec.constraints.maxFiles) {
    console.warn(`Scope has ${filtered.length} files; limiting to ${runSpec.constraints.maxFiles}`);
    scope.included_files = filtered.slice(0, runSpec.constraints.maxFiles);
  } else {
    scope.included_files = filtered;
  }

  scope.excluded_patterns = EXCLUDED_PATTERNS;

  return scope;
}

export async function readFileContents(
  scope: ScopeJson
): Promise<{ path: string; content: string }[]> {
  const results: { path: string; content: string }[] = [];

  for (const file of scope.included_files) {
    try {
      const content = fs.readFileSync(file.path, "utf8");
      results.push({ path: file.path, content });
    } catch (err) {
      console.warn(`Could not read ${file.path}:`, err);
    }
  }

  return results;
}

export function findRepoRoot(): string {
  // Find the repo root by looking for .git directory
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, ".git"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  // Fallback: if running from tools/ai-orchestrator, go up two levels
  const twoUp = path.join(process.cwd(), "../..");
  if (fs.existsSync(path.join(twoUp, ".git"))) {
    return twoUp;
  }
  return process.cwd();
}

export async function getRepoStructure(): Promise<string> {
  // Find the actual repo root, not the current working directory
  const repoRoot = findRepoRoot();
  
  // List top-level structure and recursively list important directories
  try {
    const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);

    const lines = [
      "Repository structure:",
      `(root: ${repoRoot})`,
      "",
      "Root files:",
      ...files.map((f) => `  ${f}`),
      "",
      "Directories:",
      ...dirs.map((d) => `  ${d}/`),
    ];

    // Recursively list important directories to show actual code structure
    // Include frontend/ for Next.js/React projects
    for (const dir of ["src", "tests", "lib", "frontend", "frontend/components", "frontend/lib", "frontend/store", "frontend/app"]) {
      const fullPath = path.join(repoRoot, dir);
      if (fs.existsSync(fullPath)) {
        lines.push("", `Contents of ${dir}/:`);
        try {
          const subFiles = walkDirectory(fullPath, 2); // Max depth 2
          // Make paths relative to repo root
          lines.push(...subFiles.map((f) => `  ${path.relative(repoRoot, f)}`));
        } catch (err) {
          lines.push(`  (unable to read ${dir}/)`);
        }
      }
    }

    return lines.join("\n");
  } catch {
    return "Unable to read repository structure.";
  }
}

function walkDirectory(dir: string, maxDepth: number, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth) return [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result: string[] = [];

    for (const entry of entries) {
      const relativePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(relativePath + "/");
        result.push(...walkDirectory(relativePath, maxDepth, currentDepth + 1));
      } else {
        result.push(relativePath);
      }
    }

    return result;
  } catch {
    return [];
  }
}

function safeJsonParse<T>(text: string): T {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Response did not contain a JSON object.");
  }
  const jsonSlice = trimmed.slice(start, end + 1);
  return JSON.parse(jsonSlice) as T;
}
