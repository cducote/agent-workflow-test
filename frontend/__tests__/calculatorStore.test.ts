import { useCalculatorStore } from "@/store/calculatorStore";
import { act } from "@testing-library/react";

describe("calculatorStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useCalculatorStore.getState().clear();
    });
  });

  describe("inputDigit", () => {
    it("should input a digit", () => {
      act(() => {
        useCalculatorStore.getState().inputDigit("5");
      });
      expect(useCalculatorStore.getState().display).toBe("5");
      expect(useCalculatorStore.getState().currentValue).toBe(5);
    });

    it("should append digits", () => {
      const { inputDigit } = useCalculatorStore.getState();
      act(() => {
        inputDigit("1");
        inputDigit("2");
        inputDigit("3");
      });
      expect(useCalculatorStore.getState().display).toBe("123");
    });

    it("should replace display after calculation", () => {
      const { inputDigit, setOperation } = useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("+");
        inputDigit("3");
      });
      expect(useCalculatorStore.getState().display).toBe("3");
    });
  });

  describe("inputDecimal", () => {
    it("should add decimal point", () => {
      const { inputDigit, inputDecimal } = useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        inputDecimal();
      });
      expect(useCalculatorStore.getState().display).toBe("5.");
    });

    it("should not add multiple decimal points", () => {
      const { inputDigit, inputDecimal } = useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        inputDecimal();
        inputDecimal();
      });
      expect(useCalculatorStore.getState().display).toBe("5.");
    });
  });

  describe("operations", () => {
    it("should perform addition", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("+");
        inputDigit("3");
        calculate();
      });
      expect(useCalculatorStore.getState().display).toBe("8");
    });

    it("should perform subtraction", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("-");
        inputDigit("3");
        calculate();
      });
      expect(useCalculatorStore.getState().display).toBe("2");
    });

    it("should perform multiplication", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("×");
        inputDigit("3");
        calculate();
      });
      expect(useCalculatorStore.getState().display).toBe("15");
    });

    it("should perform division", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("6");
        setOperation("÷");
        inputDigit("3");
        calculate();
      });
      expect(useCalculatorStore.getState().display).toBe("2");
    });

    it("should handle division by zero", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("÷");
        inputDigit("0");
        calculate();
      });
      expect(useCalculatorStore.getState().error).toBe("Cannot divide by zero");
    });

    it("should perform square operation", () => {
      const { inputDigit, setOperation } = useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("x²");
      });
      expect(useCalculatorStore.getState().display).toBe("25");
    });

    it("should perform cube operation", () => {
      const { inputDigit, setOperation } = useCalculatorStore.getState();
      act(() => {
        inputDigit("3");
        setOperation("x³");
      });
      expect(useCalculatorStore.getState().display).toBe("27");
    });
  });

  describe("clear", () => {
    it("should clear all state", () => {
      const { inputDigit, setOperation, clear } = useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("+");
        inputDigit("3");
        clear();
      });
      const state = useCalculatorStore.getState();
      expect(state.display).toBe("0");
      expect(state.currentValue).toBe(0);
      expect(state.previousValue).toBeNull();
      expect(state.operation).toBeNull();
    });
  });

  describe("history", () => {
    it("should add calculation to history", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        inputDigit("5");
        setOperation("+");
        inputDigit("3");
        calculate();
      });
      const { history } = useCalculatorStore.getState();
      expect(history).toHaveLength(1);
      expect(history[0].expression).toBe("5 + 3");
      expect(history[0].result).toBe(8);
    });

    it("should limit history to 10 items", () => {
      const { inputDigit, setOperation, calculate } =
        useCalculatorStore.getState();
      act(() => {
        for (let i = 0; i < 12; i++) {
          inputDigit("1");
          setOperation("+");
          inputDigit("1");
          calculate();
        }
      });
      expect(useCalculatorStore.getState().history).toHaveLength(10);
    });
  });
});
