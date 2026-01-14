import fs from "node:fs";
import path from "node:path";
import { findRepoRoot } from "./scope.js";
/**
 * Parse the AI response to extract file changes
 */
export function parseImplementationResponse(response) {
    console.log(`  Raw AI response length: ${response.length} chars`);
    // Try to extract JSON from the response
    let jsonStr = response.trim();
    // Remove markdown fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
    }
    // Find JSON object boundaries
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error(`No valid JSON found in response. First 200 chars: ${response.slice(0, 200)}`);
    }
    jsonStr = jsonStr.slice(start, end + 1);
    try {
        const parsed = JSON.parse(jsonStr);
        if (!parsed.files || !Array.isArray(parsed.files)) {
            throw new Error("Response missing 'files' array");
        }
        // Validate each file entry
        for (const file of parsed.files) {
            if (!file.path || typeof file.path !== "string") {
                throw new Error("File entry missing 'path'");
            }
            if (typeof file.content !== "string") {
                throw new Error(`File entry for ${file.path} missing 'content'`);
            }
        }
        return {
            files: parsed.files,
            summary: parsed.summary || "No summary provided",
        };
    }
    catch (err) {
        // Log more context for debugging
        console.error("Failed to parse JSON:", err.message);
        console.error("JSON string (first 500 chars):", jsonStr.slice(0, 500));
        throw new Error(`Failed to parse implementation response: ${err.message}`);
    }
}
/**
 * Write files to disk
 */
export function applyFileChanges(changes) {
    try {
        const repoRoot = findRepoRoot();
        for (const file of changes) {
            const fullPath = path.join(repoRoot, file.path);
            const dir = path.dirname(fullPath);
            // Create directory if needed
            fs.mkdirSync(dir, { recursive: true });
            // Write file
            fs.writeFileSync(fullPath, file.content, "utf8");
            console.log(`  Wrote: ${file.path}`);
        }
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            error: err.message || "Unknown error writing files",
        };
    }
}
/**
 * Summarize the changes made
 */
export function summarizeChanges(result) {
    const filePaths = result.files.map((f) => f.path);
    const totalLines = result.files.reduce((sum, f) => sum + f.content.split("\n").length, 0);
    return [
        `Files changed: ${filePaths.length}`,
        `  ${filePaths.join(", ")}`,
        `Total lines: ${totalLines}`,
    ].join("\n");
}
