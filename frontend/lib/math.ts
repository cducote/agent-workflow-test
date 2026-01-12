/**
 * Math functions wrapper for frontend
 * These functions wrap the backend math.js functions
 */

// Import math functions from backend
// In a real setup, these would be imported from the backend package
// For now, we'll replicate the logic to maintain type safety

export function add(a: number, b: number): number {
  if (a == null || b == null) {
    return 0;
  }
  return a + b;
}

export function subtract(a: number, b: number): number {
  if (a == null || b == null) {
    return 0;
  }
  return a - b;
}

export function multiply(a: number, b: number): number {
  if (a == null || b == null) {
    return 0;
  }
  return a * b;
}

export function divide(a: number, b: number): number {
  if (a == null || b == null) {
    return 0;
  }
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

export function square(x: number): number | null {
  if (x == null) {
    return null;
  }
  return x * x;
}

export function cube(x: number): number | null {
  if (x == null) {
    return null;
  }
  return x * x * x;
}
