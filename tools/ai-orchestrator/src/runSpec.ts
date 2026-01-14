import fs from "node:fs";
import { RunMode, RunSpec } from "./schemas.js";
import { getPullRequestBody, getCommentById, getRecentComments } from "./github.js";
import { parsePlanFromComment } from "./planParser.js";

type GitHubEvent = any;

function readEvent(): GitHubEvent {
  const p = process.env.GITHUB_EVENT_PATH;
  if (!p) return {};
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function parseModeFromInputs(eventName: string, event: GitHubEvent): RunMode {
  const inputMode = (process.env.INPUT_MODE || "").trim() as RunMode;
  if (inputMode) return inputMode;

  if (eventName === "issue_comment_reaction") {
    // Reaction trigger should always use implement mode (using existing plan)
    return "implement";
  }

  if (eventName === "issue_comment") {
    const body = (event?.comment?.body || "").trim();
    // Supported: "/ai plan ..." or "/ai implement ..." etc.
    const m = body.match(/^\/ai\s+(\w+)/i);
    const cmd = (m?.[1] || "plan").toLowerCase();
    if (cmd === "implement" || cmd === "fix" || cmd === "plan") return cmd as RunMode;
    return "plan";
  }

  if (eventName === "pull_request") {
    const labelName = event?.label?.name || "";
    if (labelName === "ai-implement") return "implement";
    if (labelName === "ai-fix") return "fix";
    return "plan";
  }

  return "plan";
}

function parsePrNumber(eventName: string, event: GitHubEvent): number | undefined {
  const inputPr = (process.env.INPUT_PR_NUMBER || "").trim();
  if (inputPr) {
    const n = Number(inputPr);
    if (Number.isFinite(n) && n > 0) return n;
  }

  if (eventName === "pull_request") return event?.pull_request?.number;
  if (eventName === "issue_comment") return event?.issue?.pull_request ? event?.issue?.number : undefined;
  return undefined;
}

function featureOverride(): string | undefined {
  const f = (process.env.INPUT_FEATURE || "").trim();
  return f || undefined;
}

async function parsePlanFromReaction(eventName: string, event: GitHubEvent, repository: string): Promise<{ featureText: string; preParsedPlan?: any } | null> {
  if (eventName !== "issue_comment_reaction") return null;

  const reaction = event?.reaction?.content;
  const commentId = event?.comment?.id;

  if (reaction !== "+1" || !commentId) return null;

  try {
    const commentBody = await getCommentById({ repoFull: repository, commentId });

    // Check if this is an AI plan comment
    if (!commentBody.includes("## 🤖 AI Plan")) return null;

    const plan = parsePlanFromComment(commentBody);
    if (!plan) return null;

    return {
      featureText: `Implementing plan from AI Plan comment:\n\n${plan.summary}`,
      preParsedPlan: plan,
    };
  } catch (err) {
    console.warn("Failed to parse plan from reaction:", err);
    return null;
  }
}

async function findMostRecentAIPlan(repository: string, prNumber: number): Promise<{ featureText: string; preParsedPlan?: any } | null> {
  try {
    const comments = await getRecentComments({ repoFull: repository, prNumber });

    // Find the most recent comment from github-actions bot that contains an AI Plan
    const aiPlanComment = comments
      .reverse() // Most recent first
      .find((c) => c.user === "github-actions[bot]" && c.body.includes("## 🤖 AI Plan"));

    if (!aiPlanComment) return null;

    const plan = parsePlanFromComment(aiPlanComment.body);
    if (!plan) return null;

    return {
      featureText: `Implementing plan from AI Plan comment:\n\n${plan.summary}`,
      preParsedPlan: plan,
    };
  } catch (err) {
    console.warn("Failed to find recent AI Plan:", err);
    return null;
  }
}

export async function buildRunSpec(): Promise<RunSpec> {
  const eventName = process.env.GITHUB_EVENT_NAME || "unknown";
  const repository = process.env.GITHUB_REPOSITORY || "";
  const sha = process.env.GITHUB_SHA || "";

  if (!repository) throw new Error("Missing GITHUB_REPOSITORY");
  if (!sha) throw new Error("Missing GITHUB_SHA");

  const event = readEvent();
  const mode = parseModeFromInputs(eventName, event);
  const prNumber = parsePrNumber(eventName, event);

  // Check for reaction-based trigger first
  const reactionPlan = await parsePlanFromReaction(eventName, event, repository);
  let featureText = "";
  let preParsedPlan = undefined;

  if (reactionPlan) {
    featureText = reactionPlan.featureText;
    preParsedPlan = reactionPlan.preParsedPlan;
  } else {
    featureText =
      featureOverride() ||
      (eventName === "issue_comment" ? (event?.comment?.body || "") : "") ||
      "";

    // For /ai implement without context, try to find and reuse the most recent AI Plan
    if (mode === "implement" && prNumber && !featureText.trim()) {
      console.log("Searching for most recent AI Plan to reuse...");
      const existingPlan = await findMostRecentAIPlan(repository, prNumber);
      if (existingPlan) {
        console.log("Found existing AI Plan, reusing it.");
        featureText = existingPlan.featureText;
        preParsedPlan = existingPlan.preParsedPlan;
      }
    }

    // If still no feature text and we have a PR number, pull title/body as baseline.
    if (prNumber && !featureOverride() && !featureText.trim()) {
      const pr = await getPullRequestBody({ repoFull: repository, prNumber });
      const parts = [
        `PR Title: ${pr.title}`,
        "",
        pr.body?.trim() ? `PR Body:\n${pr.body.trim()}` : "PR Body: (empty)",
      ];
      featureText = parts.join("\n");
    }
  }

  if (!featureText.trim()) {
    featureText = "No feature text provided. Produce a reasonable planning checklist and ask for missing details.";
  }

  const source =
    eventName === "workflow_dispatch"
      ? "workflow_dispatch"
      : eventName === "issue_comment"
        ? "issue_comment"
        : eventName === "pull_request"
          ? "pull_request"
          : "unknown";

  return {
    mode,
    repository,
    sha,
    prNumber,
    featureText,
    preParsedPlan,
    trigger: {
      eventName,
      actor: event?.sender?.login,
      source,
    },
    constraints: {
      maxPlanTokens: 2000,
      maxImplementTokens: 4000,
      maxFixTokens: 2000,
      maxFiles: 20,
      maxFileBytes: 80000,
      maxIterations: 2,
      maxDiffLines: 300,
    },
  };
}
