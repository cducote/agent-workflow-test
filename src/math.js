/**
 * Adds two numbers together.
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b, or 0 if either is null/undefined
 */
function add(a, b) {
  if (a == null || b == null) {
    return 0;
  }
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

/**
 * Divides the first number by the second number.
 * @param {number} a - Dividend
 * @param {number} b - Divisor
 * @returns {number} The quotient of a divided by b, or 0 if either is null/undefined
 */
function divide(a, b) {
  if (a == null || b == null) {
    return 0;
  }
  return a / b;
}

/**
 * Subtracts the second number from the first number.
 * @param {number} a - First number (minuend)
 * @param {number} b - Second number (subtrahend)
 * @returns {number} The difference of a minus b, or 0 if either is null/undefined
 */
function subtract(a, b) {
  if (a == null || b == null) {
    return 0;
  }
  return a - b;
}

module.exports = { add, multiply, divide, subtract };
