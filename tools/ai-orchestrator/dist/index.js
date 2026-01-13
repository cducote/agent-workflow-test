import fs from "node:fs";
import path from "node:path";
import { buildRunSpec } from "./runSpec.js";
import { callClaude } from "./anthropic.js";
import { plannerSystemPrompt, plannerUserPrompt, implementerSystemPrompt, implementerUserPrompt, fixerSystemPrompt, fixerUserPrompt, } from "./prompts.js";
import { commentOnPullRequest } from "./github.js";
import { resolveScope, readFileContents } from "./scope.js";
import { applyPatch, summarizeDiff, extractDiffFromResponse } from "./patch.js";
import { runTests, formatTestResults } from "./testRunner.js";
function ensureOutDir() {
    const outDir = path.join(process.cwd(), "out");
    fs.mkdirSync(outDir, { recursive: true });
    return outDir;
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
function planToMarkdown(plan) {
    const filesMod = plan.files_to_modify?.length
        ? plan.files_to_modify.map((f) => `- \`${f.path}\`: ${f.reason}`).join("\n")
        : "- (none)";
    const filesNew = plan.files_to_create?.length
        ? plan.files_to_create.map((f) => `- \`${f.path}\`: ${f.purpose}`).join("\n")
        : "- (none)";
    const tests = plan.tests?.length
        ? plan.tests.map((t) => `- \`${t.command}\`: ${t.reason}`).join("\n")
        : "- (none)";
    const steps = plan.steps?.length ? plan.steps.map((s) => `- ${s}`).join("\n") : "- (none)";
    const risks = plan.risks?.length ? plan.risks.map((r) => `- ${r}`).join("\n") : "- (none)";
    return [
        "## 🤖 AI Plan (Plan Mode)",
        "",
        plan.summary ? plan.summary : "",
        "",
        "### Steps",
        steps,
        "",
        "### Files to modify",
        filesMod,
        "",
        "### Files to create",
        filesNew,
        "",
        "### Tests",
        tests,
        "",
        "### Risks / Notes",
        risks,
        "",
        "_Artifacts: see `ai-orchestrator-artifacts` in the workflow run._",
    ].join("\n");
}
async function runPlanMode(outDir) {
    const runSpec = await buildRunSpec();
    fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));
    console.log("Running Plan Mode...");
    const system = plannerSystemPrompt();
    const user = plannerUserPrompt(runSpec.featureText);
    const raw = await callClaude({
        system,
        user,
        maxTokens: runSpec.constraints.maxPlanTokens,
    });
    fs.writeFileSync(path.join(outDir, "claude-plan-raw.txt"), raw);
    const plan = safeJsonParse(raw);
    fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
    // Comment back on PR if we have PR context
    if (runSpec.prNumber) {
        const md = planToMarkdown(plan);
        await commentOnPullRequest({
            repoFull: runSpec.repository,
            prNumber: runSpec.prNumber,
            body: md,
        });
        fs.writeFileSync(path.join(outDir, "commented.txt"), `Commented on PR #${runSpec.prNumber}\n`);
    }
    else {
        fs.writeFileSync(path.join(outDir, "commented.txt"), "No PR context; did not comment.\n");
    }
    console.log("Plan Mode complete.");
}
async function runImplementMode(outDir) {
    const runSpec = await buildRunSpec();
    fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));
    console.log("Running Implement Mode...");
    // Step 1: Generate plan
    console.log("  Step 1: Generating plan...");
    const planSystem = plannerSystemPrompt();
    const planUser = plannerUserPrompt(runSpec.featureText);
    const planRaw = await callClaude({
        system: planSystem,
        user: planUser,
        maxTokens: runSpec.constraints.maxPlanTokens,
    });
    const plan = safeJsonParse(planRaw);
    fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
    // Step 2: Resolve scope
    console.log("  Step 2: Resolving scope...");
    const scope = await resolveScope(plan, runSpec);
    fs.writeFileSync(path.join(outDir, "scope.json"), JSON.stringify(scope, null, 2));
    // Step 3: Read file contents
    console.log("  Step 3: Reading file contents...");
    const fileContents = await readFileContents(scope);
    // Step 4: Generate implementation
    console.log("  Step 4: Generating implementation...");
    const implSystem = implementerSystemPrompt();
    const implUser = implementerUserPrompt({ plan, scope, fileContents });
    const implRaw = await callClaude({
        system: implSystem,
        user: implUser,
        maxTokens: runSpec.constraints.maxImplementTokens,
    });
    fs.writeFileSync(path.join(outDir, "claude-implement-raw.txt"), implRaw);
    const diff = extractDiffFromResponse(implRaw);
    fs.writeFileSync(path.join(outDir, "changes.patch"), diff);
    // Step 5: Apply patch
    console.log("  Step 5: Applying patch...");
    const applyResult = applyPatch(diff);
    if (!applyResult.success) {
        const errorMsg = `Failed to apply patch: ${applyResult.error}`;
        fs.writeFileSync(path.join(outDir, "apply-error.txt"), errorMsg);
        console.error(errorMsg);
        if (runSpec.prNumber) {
            await commentOnPullRequest({
                repoFull: runSpec.repository,
                prNumber: runSpec.prNumber,
                body: [
                    "## 🤖 AI Implementation (Failed)",
                    "",
                    "Could not apply the generated patch:",
                    "```",
                    applyResult.error,
                    "```",
                    "",
                    "_Check artifacts for details._",
                ].join("\n"),
            });
        }
        return;
    }
    const diffSummary = summarizeDiff(diff);
    fs.writeFileSync(path.join(outDir, "diff-summary.txt"), diffSummary);
    // Step 6: Run tests
    console.log("  Step 6: Running tests...");
    const testCommands = plan.tests?.map((t) => t.command) || ["npm test"];
    const testResults = runTests(testCommands);
    fs.writeFileSync(path.join(outDir, "test-results.json"), JSON.stringify(testResults, null, 2));
    const allPassed = testResults.every((r) => r.success);
    const testOutput = formatTestResults(testResults);
    fs.writeFileSync(path.join(outDir, "test-output.txt"), testOutput);
    // Step 7: Report
    console.log("  Step 7: Reporting results...");
    if (runSpec.prNumber) {
        const status = allPassed ? "✓ Success" : "✗ Tests Failed";
        await commentOnPullRequest({
            repoFull: runSpec.repository,
            prNumber: runSpec.prNumber,
            body: [
                `## 🤖 AI Implementation (${status})`,
                "",
                "### Summary",
                plan.summary,
                "",
                "### Changes",
                "```",
                diffSummary,
                "```",
                "",
                "### Test Results",
                testOutput,
                "",
                "_Artifacts: see `ai-orchestrator-artifacts` in the workflow run._",
            ].join("\n"),
        });
    }
    console.log(`Implement Mode complete. Tests ${allPassed ? "passed" : "failed"}.`);
}
async function runFixMode(outDir) {
    const runSpec = await buildRunSpec();
    fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));
    console.log("Running Fix Mode...");
    // Load previous artifacts (plan, scope, diff, test results)
    let plan;
    let scope;
    let previousDiff;
    try {
        plan = JSON.parse(fs.readFileSync(path.join(outDir, "plan.json"), "utf8"));
        scope = JSON.parse(fs.readFileSync(path.join(outDir, "scope.json"), "utf8"));
        previousDiff = fs.readFileSync(path.join(outDir, "changes.patch"), "utf8");
    }
    catch (err) {
        console.error("Fix mode requires previous run artifacts (plan.json, scope.json, changes.patch)");
        fs.writeFileSync(path.join(outDir, "fix-error.txt"), "Missing artifacts from previous implement run.");
        return;
    }
    // Run tests to get current failures
    console.log("  Step 1: Running tests to identify failures...");
    const testCommands = plan.tests?.map((t) => t.command) || ["npm test"];
    const testResults = runTests(testCommands);
    const failedTests = testResults.filter((r) => !r.success);
    if (failedTests.length === 0) {
        console.log("All tests passing; no fixes needed.");
        fs.writeFileSync(path.join(outDir, "fix-result.txt"), "All tests passing.");
        return;
    }
    const testOutput = formatTestResults(failedTests);
    // Bounded fix loop
    let iteration = 0;
    const maxIterations = runSpec.constraints.maxIterations;
    while (iteration < maxIterations) {
        iteration++;
        console.log(`  Fix iteration ${iteration}/${maxIterations}...`);
        // Read current file contents
        const fileContents = await readFileContents(scope);
        // Generate fix
        const fixSystem = fixerSystemPrompt();
        const fixUser = fixerUserPrompt({ previousDiff, testOutput, fileContents });
        const fixRaw = await callClaude({
            system: fixSystem,
            user: fixUser,
            maxTokens: runSpec.constraints.maxFixTokens,
        });
        fs.writeFileSync(path.join(outDir, `claude-fix-${iteration}-raw.txt`), fixRaw);
        const fixDiff = extractDiffFromResponse(fixRaw);
        fs.writeFileSync(path.join(outDir, `fix-${iteration}.patch`), fixDiff);
        // Apply fix
        const applyResult = applyPatch(fixDiff);
        if (!applyResult.success) {
            console.error(`Failed to apply fix patch: ${applyResult.error}`);
            fs.writeFileSync(path.join(outDir, `fix-${iteration}-apply-error.txt`), applyResult.error || "Unknown error");
            break;
        }
        // Re-run tests
        const retestResults = runTests(testCommands);
        fs.writeFileSync(path.join(outDir, `test-results-fix-${iteration}.json`), JSON.stringify(retestResults, null, 2));
        const allPassed = retestResults.every((r) => r.success);
        if (allPassed) {
            console.log(`Fix successful after ${iteration} iteration(s).`);
            fs.writeFileSync(path.join(outDir, "fix-result.txt"), `Fixed after ${iteration} iteration(s).`);
            if (runSpec.prNumber) {
                await commentOnPullRequest({
                    repoFull: runSpec.repository,
                    prNumber: runSpec.prNumber,
                    body: [
                        "## 🤖 AI Fix Mode (✓ Success)",
                        "",
                        `Tests now passing after ${iteration} fix iteration(s).`,
                        "",
                        "_Artifacts: see `ai-orchestrator-artifacts` in the workflow run._",
                    ].join("\n"),
                });
            }
            return;
        }
        // Update for next iteration
        previousDiff = fixDiff;
    }
    console.log(`Fix mode exhausted ${maxIterations} iterations; tests still failing.`);
    fs.writeFileSync(path.join(outDir, "fix-result.txt"), `Failed to fix after ${maxIterations} iterations.`);
    if (runSpec.prNumber) {
        await commentOnPullRequest({
            repoFull: runSpec.repository,
            prNumber: runSpec.prNumber,
            body: [
                "## 🤖 AI Fix Mode (✗ Failed)",
                "",
                `Could not fix all test failures after ${maxIterations} iteration(s).`,
                "",
                "Manual intervention required.",
                "",
                "_Artifacts: see `ai-orchestrator-artifacts` in the workflow run._",
            ].join("\n"),
        });
    }
}
async function main() {
    const outDir = ensureOutDir();
    const mode = process.env.INPUT_MODE || "plan";
    try {
        if (mode === "plan") {
            await runPlanMode(outDir);
        }
        else if (mode === "implement") {
            await runImplementMode(outDir);
        }
        else if (mode === "fix") {
            await runFixMode(outDir);
        }
        else {
            throw new Error(`Unknown mode: ${mode}`);
        }
    }
    catch (err) {
        console.error("Orchestrator error:", err);
        fs.writeFileSync(path.join(outDir, "error.txt"), err.stack || err.message);
        process.exit(1);
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
