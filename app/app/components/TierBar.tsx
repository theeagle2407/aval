"use client";

import { motion } from "framer-motion";

const BANDS = [20, 40, 60, 80];

export function TierBar({ tier }: { tier: number }) {
  const pct = Math.min(Math.max(tier, 0), 100);

  return (
    <div className="w-full">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-steel via-[#7896B9] to-teal"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {BANDS.map((band) => (
          <span
            key={band}
            className="absolute top-0 h-full w-px bg-navy/60"
            style={{ left: `${band}%` }}
          />
        ))}
        <motion.span
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-navy bg-teal shadow-[0_0_10px_rgba(45,212,191,0.7)]"
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${pct}%`, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginLeft: -6 }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-steel">
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
        <span>100</span>
      </div>
    </div>
  );
}
