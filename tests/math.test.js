const { add, multiply, divide, subtract, square, cube } = require('../src/math');

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

  describe('subtract', () => {
    it('should subtract second number from first', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should handle negative results', () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    it('should handle zero minus zero', () => {
      expect(subtract(0, 0)).toBe(0);
    });

    it('should return 0 when first parameter is null', () => {
      expect(subtract(null, 5)).toBe(0);
    });

    it('should return 0 when second parameter is undefined', () => {
      expect(subtract(10, undefined)).toBe(0);
    });
  });

  describe('square', () => {
    it('should return 9 for square(3)', () => {
      expect(square(3)).toBe(9);
    });

    it('should return 16 for square(-4)', () => {
      expect(square(-4)).toBe(16);
    });

    it('should return 0 for square(0)', () => {
      expect(square(0)).toBe(0);
    });

    it('should return null when parameter is null', () => {
      expect(square(null)).toBe(null);
    });

    it('should return null when parameter is undefined', () => {
      expect(square(undefined)).toBe(null);
    });
  });

  describe('cube', () => {
    it('should return 8 for cube(2)', () => {
      expect(cube(2)).toBe(8);
    });

    it('should return -8 for cube(-2)', () => {
      expect(cube(-2)).toBe(-8);
    });

    it('should return 0 for cube(0)', () => {
      expect(cube(0)).toBe(0);
    });

    it('should return null when parameter is null', () => {
      expect(cube(null)).toBe(null);
    });

    it('should return null when parameter is undefined', () => {
      expect(cube(undefined)).toBe(null);
    });
  });
});
