import fs from "node:fs";
import path from "node:path";
import { buildRunSpec } from "./runSpec.js";
import { callAI, getAvailableProviders } from "./aiProvider.js";
import {
  plannerSystemPrompt,
  plannerUserPrompt,
  implementerSystemPrompt,
  implementerUserPrompt,
  fixerSystemPrompt,
  fixerUserPrompt,
} from "./prompts.js";
import { commentOnPullRequest } from "./github.js";
import type { PlanJson, ScopeJson } from "./schemas.js";
import { resolveScope, readFileContents, discoverTestLocations, findRepoRoot } from "./scope.js";
import { parseImplementationResponse, applyFileChanges, summarizeChanges } from "./patch.js";
import { runTests, formatTestResults, type TestResult } from "./testRunner.js";

function ensureOutDir(): string {
  const outDir = path.join(process.cwd(), "out");
  fs.mkdirSync(outDir, { recursive: true });
  return outDir;
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

function planToMarkdown(plan: PlanJson): string {
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
    "_Planning complete. Comment `/ai implement` to apply these changes._",
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

async function runPlanMode(outDir: string) {
  const runSpec = await buildRunSpec();
  fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));

  console.log("Running Plan Mode...");

  // Get repo structure to inform planning
  const { getRepoStructure } = await import("./scope.js");
  const repoStructure = await getRepoStructure();

  const system = plannerSystemPrompt();
  const user = plannerUserPrompt(runSpec.featureText, repoStructure);

  const raw = await callAI({
    system,
    user,
    maxTokens: runSpec.constraints.maxPlanTokens,
  });

  fs.writeFileSync(path.join(outDir, "claude-plan-raw.txt"), raw);

  const plan = safeJsonParse<PlanJson>(raw);
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
  } else {
    fs.writeFileSync(path.join(outDir, "commented.txt"), "No PR context; did not comment.\n");
  }

  console.log("Plan Mode complete.");
}

async function runImplementMode(outDir: string) {
  const runSpec = await buildRunSpec();
  fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));

  console.log("Running Implement Mode...");

  let plan: PlanJson;

  // Check if we have a pre-parsed plan from reaction trigger
  if (runSpec.preParsedPlan) {
    console.log("  Using pre-parsed plan from reaction trigger (skipping planning step)...");
    plan = runSpec.preParsedPlan;
    fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
  } else {
    // Step 1: Generate plan
    console.log("  Step 1: Generating plan...");
    const { getRepoStructure } = await import("./scope.js");
    const repoStructure = await getRepoStructure();
    const planSystem = plannerSystemPrompt();
    const planUser = plannerUserPrompt(runSpec.featureText, repoStructure);
    const planRaw = await callAI({
      system: planSystem,
      user: planUser,
      maxTokens: runSpec.constraints.maxPlanTokens,
    });
    plan = safeJsonParse<PlanJson>(planRaw);
    fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
  }

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
  const implRaw = await callAI({
    system: implSystem,
    user: implUser,
    maxTokens: runSpec.constraints.maxImplementTokens,
  });
  fs.writeFileSync(path.join(outDir, "claude-implement-raw.txt"), implRaw);

  // Step 5: Parse and apply file changes
  console.log("  Step 5: Parsing and applying changes...");
  const implResult = parseImplementationResponse(implRaw);
  if (!implResult) {
    const errorMsg = "Failed to parse implementation response as JSON";
    fs.writeFileSync(path.join(outDir, "apply-error.txt"), errorMsg);
    console.error(errorMsg);

    if (runSpec.prNumber) {
      const rawPreview = implRaw.slice(0, 500).replace(/`/g, "'");
      await commentOnPullRequest({
        repoFull: runSpec.repository,
        prNumber: runSpec.prNumber,
        body: [
          "## 🤖 AI Implementation (Failed)",
          "",
          "Could not parse AI response as JSON.",
          "",
          "<details><summary>Raw AI response (first 500 chars)</summary>",
          "",
          "```",
          rawPreview,
          "```",
          "</details>",
          "",
          "_Check artifacts for full details._",
        ].join("\n"),
      });
    }
    return;
  }

  // Save parsed result
  fs.writeFileSync(path.join(outDir, "implementation.json"), JSON.stringify(implResult, null, 2));

  // Apply the file changes
  const applyResult = applyFileChanges(implResult.files);
  if (!applyResult.success) {
    const errorMsg = `Failed to apply changes: ${applyResult.error}`;
    fs.writeFileSync(path.join(outDir, "apply-error.txt"), errorMsg);
    console.error(errorMsg);

    if (runSpec.prNumber) {
      await commentOnPullRequest({
        repoFull: runSpec.repository,
        prNumber: runSpec.prNumber,
        body: [
          "## 🤖 AI Implementation (Failed)",
          "",
          "Could not apply file changes:",
          "```",
          applyResult.error,
          "```",
          "",
          "_Check artifacts for full details._",
        ].join("\n"),
      });
    }
    return;
  }

  const changeSummary = summarizeChanges(implResult);
  fs.writeFileSync(path.join(outDir, "change-summary.txt"), changeSummary);

  // Step 6: Run tests (use discovered commands, not AI-generated ones)
  console.log("  Step 6: Running tests...");
  const testCommands = discoverTestLocations(findRepoRoot());
  const testResults = runTests(testCommands);
  fs.writeFileSync(
    path.join(outDir, "test-results.json"),
    JSON.stringify(testResults, null, 2)
  );

  const allPassed = testResults.every((r) => r.success);
  const testOutput = formatTestResults(testResults);
  fs.writeFileSync(path.join(outDir, "test-output.txt"), testOutput);

  // Step 7: Commit and push if tests passed
  if (allPassed) {
    console.log("  Step 7: Committing and pushing changes...");
    try {
      const { execSync } = await import("node:child_process");

      // Configure git
      execSync('git config user.name "github-actions[bot]"', { stdio: "inherit" });
      execSync('git config user.email "github-actions[bot]@users.noreply.github.com"', { stdio: "inherit" });

      // Add all changes
      execSync("git add -A", { stdio: "inherit" });

      // Check if there are changes to commit
      try {
        execSync("git diff --cached --quiet");
        console.log("  No changes to commit.");
      } catch {
        // There are changes, commit them
        const commitMessage = `AI Implementation: ${plan.summary}\n\n🤖 Generated with AI Orchestrator\n\nCo-Authored-By: github-actions[bot] <github-actions[bot]@users.noreply.github.com>`;
        execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: "inherit" });

        // Push to the PR branch
        execSync("git push", { stdio: "inherit" });
        console.log("  Changes committed and pushed successfully.");
      }
    } catch (err: any) {
      console.error("  Failed to commit/push changes:", err.message);
      fs.writeFileSync(path.join(outDir, "git-error.txt"), err.message);
    }
  }

  // Step 8: Report
  console.log("  Step 8: Reporting results...");
  if (runSpec.prNumber) {
    const status = allPassed ? "✓ Success" : "✗ Tests Failed";
    const changesPushed = allPassed ? "\n\n**✓ Changes have been committed and pushed to this branch.**" : "";
    await commentOnPullRequest({
      repoFull: runSpec.repository,
      prNumber: runSpec.prNumber,
      body: [
        `## 🤖 AI Implementation (${status})`,
        "",
        "### Summary",
        plan.summary,
        changesPushed,
        "",
        "### Changes",
        "```",
        changeSummary,
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

async function runFixMode(outDir: string) {
  const runSpec = await buildRunSpec();
  fs.writeFileSync(path.join(outDir, "runSpec.json"), JSON.stringify(runSpec, null, 2));

  console.log("Running Fix Mode...");

  // Load previous artifacts (plan, scope)
  let plan: PlanJson;
  let scope: ScopeJson;

  try {
    plan = JSON.parse(fs.readFileSync(path.join(outDir, "plan.json"), "utf8"));
    scope = JSON.parse(fs.readFileSync(path.join(outDir, "scope.json"), "utf8"));
  } catch (err) {
    console.error("Fix mode requires previous run artifacts (plan.json, scope.json)");
    fs.writeFileSync(
      path.join(outDir, "fix-error.txt"),
      "Missing artifacts from previous implement run."
    );
    return;
  }

  // Run tests to get current failures (use discovered commands, not AI-generated)
  console.log("  Step 1: Running tests to identify failures...");
  const testCommands = discoverTestLocations(findRepoRoot());
  let testResults = runTests(testCommands);
  let failedTests = testResults.filter((r) => !r.success);

  if (failedTests.length === 0) {
    console.log("All tests passing; no fixes needed.");
    fs.writeFileSync(path.join(outDir, "fix-result.txt"), "All tests passing.");
    return;
  }

  let testOutput = formatTestResults(failedTests);

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
    const fixUser = fixerUserPrompt({ testOutput, fileContents });
    const fixRaw = await callAI({
      system: fixSystem,
      user: fixUser,
      maxTokens: runSpec.constraints.maxFixTokens,
    });

    fs.writeFileSync(path.join(outDir, `claude-fix-${iteration}-raw.txt`), fixRaw);

    // Parse and apply fix
    const fixResult = parseImplementationResponse(fixRaw);
    if (!fixResult) {
      console.error(`Failed to parse fix response as JSON`);
      fs.writeFileSync(
        path.join(outDir, `fix-${iteration}-parse-error.txt`),
        "Could not parse AI response as JSON"
      );
      break;
    }

    fs.writeFileSync(path.join(outDir, `fix-${iteration}.json`), JSON.stringify(fixResult, null, 2));

    const applyResult = applyFileChanges(fixResult.files);
    if (!applyResult.success) {
      console.error(`Failed to apply fix: ${applyResult.error}`);
      fs.writeFileSync(
        path.join(outDir, `fix-${iteration}-apply-error.txt`),
        applyResult.error || "Unknown error"
      );
      break;
    }

    // Re-run tests
    const retestResults = runTests(testCommands);
    fs.writeFileSync(
      path.join(outDir, `test-results-fix-${iteration}.json`),
      JSON.stringify(retestResults, null, 2)
    );

    const allPassed = retestResults.every((r) => r.success);

    if (allPassed) {
      console.log(`Fix successful after ${iteration} iteration(s).`);
      fs.writeFileSync(
        path.join(outDir, "fix-result.txt"),
        `Fixed after ${iteration} iteration(s).`
      );

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

    // Update test output for next iteration
    testOutput = formatTestResults(retestResults.filter((r) => !r.success));
  }

  console.log(`Fix mode exhausted ${maxIterations} iterations; tests still failing.`);
  fs.writeFileSync(
    path.join(outDir, "fix-result.txt"),
    `Failed to fix after ${maxIterations} iterations.`
  );

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

  // Get the mode from runSpec to ensure we use the parsed mode from issue_comment, etc.
  const runSpec = await buildRunSpec();
  const mode = runSpec.mode;

  try {
    if (mode === "plan") {
      await runPlanMode(outDir);
    } else if (mode === "implement") {
      await runImplementMode(outDir);
    } else if (mode === "fix") {
      await runFixMode(outDir);
    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }
  } catch (err: any) {
    console.error("Orchestrator error:", err);
    fs.writeFileSync(path.join(outDir, "error.txt"), err.stack || err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
