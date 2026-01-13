import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function applyPatch(patchContent: string): { success: boolean; error?: string } {
  try {
    // Write patch to a temporary file
    const patchPath = path.join(process.cwd(), "temp.patch");
    fs.writeFileSync(patchPath, patchContent);

    // Apply using git apply
    execSync(`git apply --whitespace=nowarn "${patchPath}"`, {
      stdio: "pipe",
      encoding: "utf8",
    });

    // Clean up
    fs.unlinkSync(patchPath);

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Unknown error applying patch",
    };
  }
}

export function summarizeDiff(diff: string): string {
  const lines = diff.split("\n");
  const fileChanges: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      const match = line.match(/diff --git a\/(.*?) b\/(.*)/);
      if (match) {
        fileChanges.push(match[2]);
      }
    }
  }

  const addedLines = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const removedLines = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  return [
    `Files changed: ${fileChanges.length}`,
    `  ${fileChanges.join(", ")}`,
    `Lines: +${addedLines} -${removedLines}`,
  ].join("\n");
}

export function extractDiffFromResponse(response: string): string {
  // Claude might wrap diff in markdown fences despite instructions
  const fencePattern = /```(?:diff)?\n([\s\S]*?)\n```/;
  const match = response.match(fencePattern);

  if (match) {
    return match[1].trim();
  }

  // Otherwise, look for diff --git pattern
  const diffStart = response.indexOf("diff --git");
  if (diffStart !== -1) {
    return response.slice(diffStart).trim();
  }

  // If nothing found, return as-is and let apply fail with a clear error
  return response.trim();
}
