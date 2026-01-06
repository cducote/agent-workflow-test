# Agent Workflow Test Project

This is a test repository for validating AI agent coding workflows.

## Tech Stack
- Node.js
- Jest for testing

## Agent Rules

### Branch Strategy
- NEVER commit directly to main
- Always create a feature branch: `feature/agent/<task-slug>`
- Push branch and create PR when work is complete

### Workflow
1. Create feature branch from main
2. Implement the requested changes
3. Write or update tests as needed
4. Run `npm test` and ensure all tests pass
5. Review your own diff (`git diff main`) for:
   - Bugs or logic errors
   - Missing edge cases
   - Code style consistency
6. Fix any issues found in self-review
7. Commit with clear, descriptive messages
8. Push branch and create PR targeting main

### Code Style
- Use clear, descriptive function names
- Add JSDoc comments for functions
- Handle edge cases (null, undefined, empty values)
