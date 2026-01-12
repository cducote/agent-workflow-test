import { add, subtract, multiply, divide, square, cube } from "@/lib/math";

describe("Math functions", () => {
  describe("add", () => {
    it("should add two positive numbers", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("should add negative numbers", () => {
      expect(add(-2, -3)).toBe(-5);
    });

    it("should handle null values", () => {
      expect(add(null as any, 3)).toBe(0);
      expect(add(2, null as any)).toBe(0);
    });
  });

  describe("subtract", () => {
    it("should subtract two numbers", () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it("should handle negative results", () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    it("should handle null values", () => {
      expect(subtract(null as any, 3)).toBe(0);
      expect(subtract(5, null as any)).toBe(0);
    });
  });

  describe("multiply", () => {
    it("should multiply two numbers", () => {
      expect(multiply(4, 3)).toBe(12);
    });

    it("should handle zero", () => {
      expect(multiply(5, 0)).toBe(0);
    });

    it("should handle negative numbers", () => {
      expect(multiply(-3, 4)).toBe(-12);
    });

    it("should handle null values", () => {
      expect(multiply(null as any, 3)).toBe(0);
      expect(multiply(5, null as any)).toBe(0);
    });
  });

  describe("divide", () => {
    it("should divide two numbers", () => {
      expect(divide(6, 3)).toBe(2);
    });

    it("should handle decimal results", () => {
      expect(divide(5, 2)).toBe(2.5);
    });

    it("should throw error on division by zero", () => {
      expect(() => divide(5, 0)).toThrow("Division by zero");
    });

    it("should handle null values", () => {
      expect(divide(null as any, 3)).toBe(0);
      expect(divide(5, null as any)).toBe(0);
    });
  });

  describe("square", () => {
    it("should square a positive number", () => {
      expect(square(5)).toBe(25);
    });

    it("should square a negative number", () => {
      expect(square(-3)).toBe(9);
    });

    it("should handle zero", () => {
      expect(square(0)).toBe(0);
    });

    it("should handle null values", () => {
      expect(square(null as any)).toBeNull();
    });
  });

  describe("cube", () => {
    it("should cube a positive number", () => {
      expect(cube(3)).toBe(27);
    });

    it("should cube a negative number", () => {
      expect(cube(-2)).toBe(-8);
    });

    it("should handle zero", () => {
      expect(cube(0)).toBe(0);
    });

    it("should handle null values", () => {
      expect(cube(null as any)).toBeNull();
    });
  });
});
