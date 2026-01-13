# Agent Workflow Test

MVP repository for testing AI agent coding workflows 

## Purpose

Validate that an AI coding agent can:
1. Work on feature branches (not main)
2. Write code and tests
3. Self-review and revise
4. Create PRs that pass CI

## Setup

```bash
npm install
npm test
```

## Branch Protection

Main branch should have these protections enabled:
- Require PR before merging
- Require status checks to pass (Tests workflow)
- Made by Chrissy and Claude
