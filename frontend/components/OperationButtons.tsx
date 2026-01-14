"use client";

import { useCalculatorStore, type Operation } from "@/store/calculatorStore";
import Button from "./Button";

export default function OperationButtons() {
  const { setOperation } = useCalculatorStore();

  const operations: { label: string; op: Operation }[] = [
    { label: "÷", op: "÷" },
    { label: "×", op: "×" },
    { label: "-", op: "-" },
    { label: "+", op: "+" },
    { label: "%", op: "%" },
    { label: "x²", op: "x²" },
    { label: "x³", op: "x³" },
  ];

  return (
    <div className="flex flex-col gap-3">
      {operations.map(({ label, op }) => (
        <Button
          key={label}
          onClick={() => setOperation(op)}
          variant="operation"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
