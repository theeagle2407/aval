"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { crossFade } from "./motion";

/** Cross-fades between routes. Mounted once at the layout level so it persists across navigation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} initial="hidden" animate="show" exit="exit" variants={crossFade}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
