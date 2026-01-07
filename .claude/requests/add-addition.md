# Feature: Add Addition Function

## Branch
feature/agent/add-addition-function

## Description
Add an addition function to the math module that adds two numbers together.

## Requirements
- Add an `add` function to `src/math.js`
- Function takes two parameters, adds them together and returns the sum
- Handle edge cases: if either parameter is `null` or `undefined`, return `0`
- Export the function from the module

## Acceptance Criteria
- [ ] `add(2, 3)` returns `5`
- [ ] `add(-5, 3)` returns `-2`
- [ ] `add(0, 0)` returns `0`
- [ ] `add(null, 5)` returns `0`
- [ ] `add(3, undefined)` returns `0`
- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] PR created targeting main branch
