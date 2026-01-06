const { add, multiply } = require('../src/math');

describe('Math functions', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
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
});
