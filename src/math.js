function add(a, b) {
  return a + b;
}

/**
 * Multiplies two numbers together.
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The product of a and b, or 0 if either is null/undefined
 */
function multiply(a, b) {
  if (a == null || b == null) {
    return 0;
  }
  return a * b;
}

module.exports = { add, multiply };
