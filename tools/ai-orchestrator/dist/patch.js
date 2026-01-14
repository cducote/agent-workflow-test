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
    // Log raw response length for debugging
    console.log(`  Raw AI response length: ${response.length} chars`);
    // Claude might wrap diff in markdown fences despite instructions
    const fencePattern = /```(?:diff)?\n([\s\S]*?)\n```/;
    const match = response.match(fencePattern);
    let diff = "";
    if (match) {
        console.log("  Found diff in markdown fence");
        diff = match[1];
    }
    else {
        // Otherwise, look for diff --git pattern
        const diffStart = response.indexOf("diff --git");
        if (diffStart !== -1) {
            console.log(`  Found 'diff --git' at position ${diffStart}`);
            diff = response.slice(diffStart);
        }
        else {
            // Check if it starts with --- (some tools output this format)
            const dashStart = response.indexOf("--- ");
            if (dashStart !== -1 && dashStart < 100) {
                console.log(`  Found '---' at position ${dashStart}`);
                diff = response.slice(dashStart);
            }
            else {
                // If nothing found, log first 200 chars for debugging
                console.log(`  No diff pattern found. First 200 chars: ${response.slice(0, 200)}`);
                diff = response;
            }
        }
    }
    // Light sanitization - just ensure proper line endings
    diff = diff.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // Ensure ends with newline
    if (!diff.endsWith("\n")) {
        diff += "\n";
    }
    console.log(`  Extracted diff length: ${diff.length} chars`);
    console.log(`  Diff starts with: ${diff.slice(0, 80)}`);
    return diff;
}
/** Clean up common AI-generated diff issues */
function sanitizeDiff(diff) {
    let lines = diff.split("\n");
    const result = [];
    let inHunk = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // Skip empty lines before first diff --git
        if (result.length === 0 && !line.startsWith("diff --git")) {
            if (line.trim() === "")
                continue;
            // Skip any preamble text before the diff
            if (!line.startsWith("diff ") && !line.startsWith("---") && !line.startsWith("+++")) {
                continue;
            }
        }
        // Stop at any trailing text after the diff (explanations, etc.)
        if (result.length > 0 && !line.startsWith("diff ") && !line.startsWith("---") &&
            !line.startsWith("+++") && !line.startsWith("@@") && !line.startsWith("+") &&
            !line.startsWith("-") && !line.startsWith(" ") && !line.startsWith("index ") &&
            !line.startsWith("new file") && !line.startsWith("deleted file") &&
            line.trim() !== "" && !line.startsWith("\\")) {
            // Check if this looks like start of new explanation text
            if (line.match(/^[A-Z]/) || line.match(/^#/) || line.match(/^Note/i)) {
                break;
            }
        }
        // Fix: Remove trailing whitespace from context/add/remove lines (causes issues)
        if (line.match(/^[ +-]/)) {
            line = line.replace(/\s+$/, "");
        }
        // Track hunk state
        if (line.startsWith("@@")) {
            inHunk = true;
        }
        else if (line.startsWith("diff --git")) {
            inHunk = false;
        }
        result.push(line);
    }
    // Ensure diff ends with newline
    let finalDiff = result.join("\n");
    if (!finalDiff.endsWith("\n")) {
        finalDiff += "\n";
    }
    // Clean up malformed index lines for new files
    finalDiff = finalDiff.replace(/^index 0000000\.\.[a-f0-9]+$/gm, "index 0000000..0000000");
    // Remove any Windows line endings
    finalDiff = finalDiff.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return finalDiff;
}
