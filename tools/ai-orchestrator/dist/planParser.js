/**
 * Parse a plan from an AI Plan comment markdown
 */
export function parsePlanFromComment(commentBody) {
    try {
        // Extract sections from the markdown comment
        // Strip the "(Plan Mode)" suffix from the header if present
        let summary = extractSection(commentBody, "## 🤖 AI Plan", "### Steps");
        summary = summary.replace(/^\s*\(Plan Mode\)\s*/i, "");
        const steps = extractListItems(commentBody, "### Steps", "### Files to modify");
        const filesToModify = extractFileList(commentBody, "### Files to modify", "### Files to create", "reason");
        const filesToCreate = extractFileList(commentBody, "### Files to create", "### Tests", "purpose");
        const tests = extractTestList(commentBody, "### Tests", "### Risks");
        const risks = extractListItems(commentBody, "### Risks / Notes", "_Artifacts:");
        return {
            summary: summary.trim(),
            steps,
            files_to_modify: filesToModify,
            files_to_create: filesToCreate,
            tests,
            risks,
        };
    }
    catch (err) {
        console.error("Failed to parse plan from comment:", err);
        return null;
    }
}
function extractSection(text, startMarker, endMarker) {
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1)
        return "";
    const contentStart = startIdx + startMarker.length;
    const endIdx = text.indexOf(endMarker, contentStart);
    if (endIdx === -1)
        return text.slice(contentStart).trim();
    return text.slice(contentStart, endIdx).trim();
}
function extractListItems(text, startMarker, endMarker) {
    const section = extractSection(text, startMarker, endMarker);
    const lines = section.split("\n");
    return lines
        .filter(line => line.trim().startsWith("- "))
        .map(line => line.trim().replace(/^- /, ""));
}
function extractFileList(text, startMarker, endMarker, keyName) {
    const items = extractListItems(text, startMarker, endMarker);
    return items
        .filter(item => item.includes(":"))
        .map(item => {
        const [pathWithBackticks, ...valueParts] = item.split(":");
        const path = pathWithBackticks.replace(/`/g, "").trim();
        const value = valueParts.join(":").trim();
        return keyName === "reason"
            ? { path, reason: value }
            : { path, purpose: value };
    });
}
function extractTestList(text, startMarker, endMarker) {
    const items = extractListItems(text, startMarker, endMarker);
    return items
        .filter(item => item.includes(":"))
        .map(item => {
        const [commandWithBackticks, ...reasonParts] = item.split(":");
        const command = commandWithBackticks.replace(/`/g, "").trim();
        const reason = reasonParts.join(":").trim();
        return { command, reason };
    });
}
