import { create } from "zustand";
import { add, subtract, multiply, divide, square, cube } from "@/lib/math";

export type Operation = "+" | "-" | "×" | "÷" | "x²" | "x³" | null;

export interface HistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: number;
}

interface CalculatorState {
  display: string;
  currentValue: number;
  previousValue: number | null;
  operation: Operation;
  history: HistoryItem[];
  error: string | null;
  shouldResetDisplay: boolean;

  // Actions
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  setOperation: (op: Operation) => void;
  calculate: () => void;
  clear: () => void;
  clearError: () => void;
  addToHistory: (expression: string, result: number) => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  display: "0",
  currentValue: 0,
  previousValue: null,
  operation: null,
  history: [],
  error: null,
  shouldResetDisplay: false,

  inputDigit: (digit: string) => {
    const state = get();
    if (state.shouldResetDisplay) {
      set({
        display: digit,
        currentValue: parseFloat(digit),
        shouldResetDisplay: false,
        error: null,
      });
    } else {
      const newDisplay = state.display === "0" ? digit : state.display + digit;
      set({
        display: newDisplay,
        currentValue: parseFloat(newDisplay),
        error: null,
      });
    }
  },

  inputDecimal: () => {
    const state = get();
    if (state.shouldResetDisplay) {
      set({
        display: "0.",
        currentValue: 0,
        shouldResetDisplay: false,
        error: null,
      });
    } else if (!state.display.includes(".")) {
      const newDisplay = state.display + ".";
      set({
        display: newDisplay,
        error: null,
      });
    }
  },

  setOperation: (op: Operation) => {
    const state = get();

    // Handle unary operations (square, cube)
    if (op === "x²" || op === "x³") {
      try {
        const result = op === "x²"
          ? square(state.currentValue)
          : cube(state.currentValue);

        if (result === null) {
          set({ error: "Invalid operation" });
          return;
        }

        const expression = `${state.currentValue}${op}`;
        get().addToHistory(expression, result);

        set({
          display: result.toString(),
          currentValue: result,
          previousValue: null,
          operation: null,
          shouldResetDisplay: true,
          error: null,
        });
      } catch (error) {
        set({ error: "Error" });
      }
      return;
    }

    // Handle binary operations
    if (state.operation && state.previousValue !== null && !state.shouldResetDisplay) {
      get().calculate();
    }

    set({
      previousValue: state.currentValue,
      operation: op,
      shouldResetDisplay: true,
      error: null,
    });
  },

  calculate: () => {
    const state = get();
    if (state.operation === null || state.previousValue === null) {
      return;
    }

    try {
      let result: number;
      const prev = state.previousValue;
      const curr = state.currentValue;

      switch (state.operation) {
        case "+":
          result = add(prev, curr);
          break;
        case "-":
          result = subtract(prev, curr);
          break;
        case "×":
          result = multiply(prev, curr);
          break;
        case "÷":
          if (curr === 0) {
            set({ error: "Cannot divide by zero" });
            return;
          }
          result = divide(prev, curr);
          break;
        default:
          return;
      }

      const expression = `${prev} ${state.operation} ${curr}`;
      get().addToHistory(expression, result);

      set({
        display: result.toString(),
        currentValue: result,
        previousValue: null,
        operation: null,
        shouldResetDisplay: true,
        error: null,
      });
    } catch (error) {
      set({ error: "Error" });
    }
  },

  clear: () => {
    set({
      display: "0",
      currentValue: 0,
      previousValue: null,
      operation: null,
      history: [],
      error: null,
      shouldResetDisplay: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  addToHistory: (expression: string, result: number) => {
    const state = get();
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      expression,
      result,
      timestamp: Date.now(),
    };

    const newHistory = [newItem, ...state.history].slice(0, 10);
    set({ history: newHistory });
  },
}));
