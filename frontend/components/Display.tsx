"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCalculatorStore } from "@/store/calculatorStore";
import { useEffect, useState } from "react";

export default function Display() {
  const { display, operation, previousValue, error, clearError } =
    useCalculatorStore();
  const [prevDisplay, setPrevDisplay] = useState(display);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => {
        setShake(false);
        clearError();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    setPrevDisplay(display);
  }, [display]);

  const showingOperation = operation && previousValue !== null;

  return (
    <motion.div
      animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="bg-claude-accent dark:bg-gray-800 rounded-2xl p-6 min-h-[120px] flex flex-col justify-end"
    >
      {/* Operation display */}
      {showingOperation && (
        <div className="text-sm text-claude-text-dark/60 dark:text-claude-text-light/60 mb-2">
          {previousValue} {operation}
        </div>
      )}

      {/* Error display */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-claude-error text-xl font-semibold mb-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main display with counter animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={display}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="text-4xl font-bold text-claude-text-dark dark:text-claude-text-light text-right break-all"
        >
          {display}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
