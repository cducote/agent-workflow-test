"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCalculatorStore } from "@/store/calculatorStore";

export default function History() {
  const [isOpen, setIsOpen] = useState(false);
  const { history } = useCalculatorStore();

  const containerVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="border-t border-claude-text-dark/10 dark:border-claude-text-light/10 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-medium text-claude-text-dark dark:text-claude-text-light hover:text-claude-primary dark:hover:text-claude-primary transition-colors"
      >
        <span>History ({history.length})</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-3 space-y-2 overflow-hidden"
          >
            {history.length === 0 ? (
              <div className="text-sm text-claude-text-dark/60 dark:text-claude-text-light/60 text-center py-4">
                No calculations yet
              </div>
            ) : (
              history.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className="bg-claude-accent/50 dark:bg-gray-700/50 rounded-lg p-3 text-sm"
                >
                  <div className="text-claude-text-dark dark:text-claude-text-light font-medium">
                    {item.expression}
                  </div>
                  <div className="text-claude-primary font-bold text-lg">
                    = {item.result}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
