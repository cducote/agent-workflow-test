"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "secondary" | "operation";
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = "default",
  fullWidth = false,
}: ButtonProps) {
  const baseClasses =
    "h-14 rounded-xl font-semibold text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-claude-primary focus:ring-offset-2";

  const variantClasses = {
    default:
      "bg-claude-accent dark:bg-gray-700 text-claude-text-dark dark:text-claude-text-light hover:bg-claude-accent/80 dark:hover:bg-gray-600",
    primary:
      "bg-claude-primary text-white hover:bg-claude-primary/90",
    secondary:
      "bg-gray-300 dark:bg-gray-600 text-claude-text-dark dark:text-claude-text-light hover:bg-gray-400 dark:hover:bg-gray-500",
    operation:
      "bg-claude-primary text-white hover:bg-claude-primary/90",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass}`}
    >
      {children}
    </motion.button>
  );
}
