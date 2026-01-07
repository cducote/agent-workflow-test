# Feature: Add Subtraction Function

## Branch
feature/agent/add-subtraction-function

## Description
Add a subtraction function to the math module that subtracts one number from another.

## Requirements
- Add a `subtract` function to `src/math.js`
- Function takes two parameters, subtracts the second from the first and returns the result
- Handle edge cases: if either parameter is `null` or `undefined`, return `0`
- Export the function from the module

## Acceptance Criteria
- [ ] `subtract(5, 3)` returns `2`
- [ ] `subtract(3, 5)` returns `-2`
- [ ] `subtract(0, 0)` returns `0`
- [ ] `subtract(null, 5)` returns `0`
- [ ] `subtract(10, undefined)` returns `0`
- [ ] All new tests pass
- [ ] All existing tests still pass
- [ ] PR created targeting main branch
