import { Octokit } from "@octokit/rest";

export function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return new Octokit({ auth: token });
}

export function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`Invalid GITHUB_REPOSITORY: ${repo}`);
  return { owner, repo: name };
}

export async function commentOnPullRequest(params: {
  repoFull: string;
  prNumber: number;
  body: string;
}) {
  const octokit = getOctokit();
  const { owner, repo } = parseRepo(params.repoFull);
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: params.prNumber,
    body: params.body,
  });
}

export async function getPullRequestBody(params: {
  repoFull: string;
  prNumber: number;
}): Promise<{ title: string; body: string }> {
  const octokit = getOctokit();
  const { owner, repo } = parseRepo(params.repoFull);
  const pr = await octokit.pulls.get({ owner, repo, pull_number: params.prNumber });
  return { title: pr.data.title ?? "", body: pr.data.body ?? "" };
}
