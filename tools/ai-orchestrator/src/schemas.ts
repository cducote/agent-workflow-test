export type RunMode = "plan" | "implement" | "fix";

export type RunSpec = {
  mode: RunMode;
  repository: string; // owner/repo
  sha: string;
  // PR context (if applicable)
  prNumber?: number;
  // Feature/request text the agent should work from
  featureText: string;
  // Pre-parsed plan from reaction trigger (skips planning phase)
  preParsedPlan?: PlanJson;
  // Raw trigger info for audit/debug
  trigger: {
    eventName: string;
    actor?: string;
    source: "workflow_dispatch" | "issue_comment" | "pull_request" | "unknown";
  };
  constraints: {
    maxPlanTokens: number;
    maxImplementTokens: number;
    maxFixTokens: number;
    maxFiles: number;
    maxFileBytes: number;
    maxIterations: number;
    maxDiffLines: number;
  };
};

export type PlanJson = {
  summary: string;
  steps: string[];
  files_to_modify: { path: string; reason: string }[];
  files_to_create: { path: string; purpose: string }[];
  tests: { command: string; reason: string }[];
  risks: string[];
};

export type ScopeJson = {
  included_files: { path: string; max_bytes: number }[];
  excluded_patterns: string[];
  notes: string;
};
