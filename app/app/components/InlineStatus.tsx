"use client";

import { motion, AnimatePresence } from "framer-motion";

export type FlowStatus =
  | { state: "idle" }
  | { state: "progress"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export function InlineStatus({ status }: { status: FlowStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status.state !== "idle" && (
        <motion.p
          key={status.message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`mt-3 text-xs ${
            status.state === "error"
              ? "text-red"
              : status.state === "success"
                ? "text-teal"
                : "text-muted"
          }`}
        >
          {status.message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
