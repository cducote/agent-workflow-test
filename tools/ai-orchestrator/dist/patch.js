import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { findRepoRoot } from "./scope.js";
export function applyPatch(patchContent) {
    try {
        const repoRoot = findRepoRoot();
        // Write patch to a temporary file in repo root
        const patchPath = path.join(repoRoot, "temp.patch");
        fs.writeFileSync(patchPath, patchContent);
        // Apply using git apply from repo root
        execSync(`git apply --whitespace=nowarn "${patchPath}"`, {
            stdio: "pipe",
            encoding: "utf8",
            cwd: repoRoot,
        });
        // Clean up
        fs.unlinkSync(patchPath);
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            error: err.message || "Unknown error applying patch",
        };
    }
}
export function summarizeDiff(diff) {
    const lines = diff.split("\n");
    const fileChanges = [];
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
export function extractDiffFromResponse(response) {
    // Claude might wrap diff in markdown fences despite instructions
    const fencePattern = /```(?:diff)?\n([\s\S]*?)\n```/;
    const match = response.match(fencePattern);
    let diff = "";
    if (match) {
        diff = match[1].trim();
    }
    else {
        // Otherwise, look for diff --git pattern
        const diffStart = response.indexOf("diff --git");
        if (diffStart !== -1) {
            diff = response.slice(diffStart).trim();
        }
        else {
            // If nothing found, return as-is and let apply fail with a clear error
            diff = response.trim();
        }
    }
    // Clean up malformed index lines for new files
    // Git expects "index 0000000..0000000" for new files, but Claude sometimes generates
    // "index 0000000..e69de29" or other incorrect hashes
    diff = diff.replace(/^index 0000000\.\.[a-f0-9]+$/gm, "index 0000000..0000000");
    // Validate that the patch isn't truncated
    // A valid patch should not end with an incomplete line (only spaces/tabs followed by newline)
    const lines = diff.split("\n");
    const lastLine = lines[lines.length - 1] || "";
    const secondLastLine = lines[lines.length - 2] || "";
    if (secondLastLine.match(/^[+ ]\s+$/) || lastLine.match(/^[+ ]\s*$/)) {
        throw new Error("Patch appears to be truncated (ends with incomplete line). Try reducing scope or increasing maxImplementTokens.");
    }
    return diff;
}
