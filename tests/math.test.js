const { add, multiply, divide, subtract, modulo, square, cube } = require('../src/math');

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

  describe('modulo', () => {
    it('should calculate modulo of two positive numbers', () => {
      expect(modulo(10, 3)).toBe(1);
    });

    it('should calculate modulo with zero result', () => {
      expect(modulo(6, 3)).toBe(0);
    });

    it('should handle negative dividend', () => {
      expect(modulo(-7, 3)).toBe(-1);
    });

    it('should handle negative divisor', () => {
      expect(modulo(7, -3)).toBe(1);
    });

    it('should handle both negative numbers', () => {
      expect(modulo(-7, -3)).toBe(-1);
    });

    it('should handle floating point numbers', () => {
      expect(modulo(5.5, 2)).toBeCloseTo(1.5);
    });

    it('should throw error on modulo by zero', () => {
      expect(() => modulo(5, 0)).toThrow('Modulo by zero');
    });

    it('should return 0 when first parameter is null', () => {
      expect(modulo(null, 5)).toBe(0);
    });

    it('should return 0 when second parameter is undefined', () => {
      expect(modulo(3, undefined)).toBe(0);
    });

    it('should handle edge case where dividend is smaller than divisor', () => {
      expect(modulo(2, 5)).toBe(2);
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