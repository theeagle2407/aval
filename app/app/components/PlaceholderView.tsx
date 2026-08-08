"use client";

import { motion } from "framer-motion";
import { fadeUp } from "./motion";

export function PlaceholderView({ title, note }: { title: string; note: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        {title}
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 text-sm text-muted"
      >
        {note}
      </motion.p>
    </main>
  );
}
