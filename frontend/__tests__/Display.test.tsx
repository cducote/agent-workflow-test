import { render, screen } from "@testing-library/react";
import Display from "@/components/Display";
import { useCalculatorStore } from "@/store/calculatorStore";
import { act } from "@testing-library/react";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Display", () => {
  beforeEach(() => {
    act(() => {
      useCalculatorStore.getState().clear();
    });
  });

  it("renders the display value", () => {
    render(<Display />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("updates display when value changes", () => {
    const { rerender } = render(<Display />);

    act(() => {
      useCalculatorStore.getState().inputDigit("5");
    });

    rerender(<Display />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows operation and previous value", () => {
    render(<Display />);

    act(() => {
      useCalculatorStore.getState().inputDigit("5");
      useCalculatorStore.getState().setOperation("+");
    });

    expect(screen.getByText("5 +")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Display />);

    act(() => {
      useCalculatorStore.getState().inputDigit("5");
      useCalculatorStore.getState().setOperation("÷");
      useCalculatorStore.getState().inputDigit("0");
      useCalculatorStore.getState().calculate();
    });

    expect(screen.getByText("Cannot divide by zero")).toBeInTheDocument();
  });
});
