const { add, multiply, divide } = require('../src/math');

describe('Math functions', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });

    it('should handle negative and positive numbers', () => {
      expect(add(-5, 3)).toBe(-2);
    });

    it('should handle zero', () => {
      expect(add(0, 0)).toBe(0);
    });

    it('should return 0 when first parameter is null', () => {
      expect(add(null, 5)).toBe(0);
    });

    it('should return 0 when second parameter is undefined', () => {
      expect(add(3, undefined)).toBe(0);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(2, 3)).toBe(6);
    });

    it('should handle negative numbers', () => {
      expect(multiply(-2, 3)).toBe(-6);
    });

    it('should handle zero', () => {
      expect(multiply(0, 5)).toBe(0);
    });

    it('should return 0 when first parameter is null', () => {
      expect(multiply(null, 5)).toBe(0);
    });

    it('should return 0 when second parameter is undefined', () => {
      expect(multiply(3, undefined)).toBe(0);
    });
  });

  describe('divide', () => {
    it('should divide 12 by 2 to get 6', () => {
      expect(divide(12, 2)).toBe(6);
    });

    it('should handle negative numbers', () => {
      expect(divide(-12, 3)).toBe(-4);
    });

    it('should handle zero as dividend', () => {
      expect(divide(0, 5)).toBe(0);
    });

    it('should return 0 when first parameter is null', () => {
      expect(divide(null, 5)).toBe(0);
    });

    it('should return 0 when second parameter is undefined', () => {
      expect(divide(3, undefined)).toBe(0);
    });
  });
});
