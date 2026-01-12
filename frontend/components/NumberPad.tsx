"use client";

import { motion } from "framer-motion";
import { useCalculatorStore } from "@/store/calculatorStore";
import Button from "./Button";

export default function NumberPad() {
  const { inputDigit, inputDecimal, calculate, clear } = useCalculatorStore();

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Row 1: 7, 8, 9 */}
      <Button onClick={() => inputDigit("7")}>7</Button>
      <Button onClick={() => inputDigit("8")}>8</Button>
      <Button onClick={() => inputDigit("9")}>9</Button>

      {/* Row 2: 4, 5, 6 */}
      <Button onClick={() => inputDigit("4")}>4</Button>
      <Button onClick={() => inputDigit("5")}>5</Button>
      <Button onClick={() => inputDigit("6")}>6</Button>

      {/* Row 3: 1, 2, 3 */}
      <Button onClick={() => inputDigit("1")}>1</Button>
      <Button onClick={() => inputDigit("2")}>2</Button>
      <Button onClick={() => inputDigit("3")}>3</Button>

      {/* Row 4: 0, ., = */}
      <Button onClick={() => inputDigit("0")}>0</Button>
      <Button onClick={inputDecimal}>.</Button>
      <Button onClick={calculate} variant="primary">
        =
      </Button>

      {/* Row 5: Clear button (spans all 3 columns) */}
      <div className="col-span-3">
        <Button onClick={clear} variant="secondary" fullWidth>
          Clear
        </Button>
      </div>
    </div>
  );
}
