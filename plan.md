# Autonomous Agent Workflow MVP

## Goal

Give Claude Code a feature request in markdown format and have it autonomously:
1. Create a feature branch
2. Implement the feature with tests
3. Self-review and fix issues
4. Push and create a PR ready for human review

**No permission prompts.** Full autonomy within the repo.

## Current Pain Point

Claude Code asks for permission on every file edit, bash command, etc. This breaks the "walk away and come back to a PR" workflow.

## Solution: Skip Permissions Flag

Use the `--dangerously-skip-permissions` flag to give Claude Code full autonomy:

```bash
claude --dangerously-skip-permissions "Read .claude/requests/<feature>.md and implement it"
```

This auto-approves all tool uses for the session. No prompts, full autonomy.

**Trade-offs:**
- Simpler setup (no config needed)
- Full autonomy within the session
- Relies on branch protection + CI + human PR review as guardrails

## Workflow

### Input: Feature Request Markdown

Create a standard format for feature requests in `.claude/requests/` folder:

```markdown
# Feature: <feature-name>

## Branch
feature/agent/<feature-slug>

## Description
<what the feature should do>

## Requirements
- <requirement 1>
- <requirement 2>

## Acceptance Criteria
- [ ] <testable criteria>
- [ ] Tests pass
- [ ] PR created
```

### Process

1. User creates a feature request markdown file
2. User runs: `claude "Read .claude/requests/<feature>.md and implement it"`
3. Claude Code autonomously:
   - Creates the feature branch
   - Implements the feature
   - Writes/updates tests
   - Runs tests until they pass
   - Self-reviews the diff
   - Commits with clear messages
   - Pushes branch
   - Creates PR with description
4. User receives PR notification, reviews, and merges

## Implementation Tasks

### Phase 1: Feature Request Template
- [ ] Create `.claude/requests/` directory
- [ ] Create a template markdown file
- [ ] Create a sample feature request (multiply function)

### Phase 3: Test the Workflow
- [ ] Run Claude Code with the sample feature request
- [ ] Verify autonomous execution (no prompts)
- [ ] Verify PR is created correctly
- [ ] Verify CI passes

## Security Considerations

- Permissions are scoped to this repo only
- Branch protection prevents direct pushes to main
- CI must pass before merge
- Human approval still required for final merge
- No secrets or credentials in the repo

## Success Criteria

- [ ] Can give Claude Code a feature request file path
- [ ] Claude Code completes the entire workflow without prompts
- [ ] PR is created with passing CI
- [ ] Code quality is reviewable

## Notes

- Feature requests go in `.claude/requests/`
- CLAUDE.md already has workflow rules (branch strategy, testing, PR creation)
- `--dangerously-skip-permissions` handles full autonomy
