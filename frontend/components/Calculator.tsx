"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useCalculatorStore } from "@/store/calculatorStore";
import Display from "./Display";
import NumberPad from "./NumberPad";
import OperationButtons from "./OperationButtons";
import History from "./History";
import ThemeToggle from "./ThemeToggle";

export default function Calculator() {
  const { inputDigit, inputDecimal, setOperation, calculate, clear, clearError } =
    useCalculatorStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default behavior for calculator keys
      if (
        /^[0-9]$/.test(e.key) ||
        ["+", "-", "*", "/", "Enter", "Escape", "."].includes(e.key)
      ) {
        e.preventDefault();
      }

      // Number keys
      if (/^[0-9]$/.test(e.key)) {
        inputDigit(e.key);
      }
      // Decimal point
      else if (e.key === ".") {
        inputDecimal();
      }
      // Operations
      else if (e.key === "+") {
        setOperation("+");
      } else if (e.key === "-") {
        setOperation("-");
      } else if (e.key === "*") {
        setOperation("×");
      } else if (e.key === "/") {
        setOperation("÷");
      }
      // Calculate
      else if (e.key === "Enter" || e.key === "=") {
        calculate();
      }
      // Clear
      else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        clear();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [inputDigit, inputDecimal, setOperation, calculate, clear]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="bg-white dark:bg-claude-secondary rounded-3xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-claude-text-dark dark:text-claude-text-light">
            Calculator
          </h1>
          <ThemeToggle />
        </div>

        {/* Display */}
        <Display />

        {/* Calculator Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Left side: Numbers and decimal */}
          <div className="col-span-3 space-y-3">
            <NumberPad />
          </div>

          {/* Right side: Operations */}
          <div className="col-span-1">
            <OperationButtons />
          </div>
        </div>

        {/* History */}
        <History />
      </div>
    </motion.div>
  );
}
