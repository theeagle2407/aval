"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";
import { formatUsd6 } from "../lib/format";

/**
 * Renders a 6-decimal token amount as a dollar string. The first real value snaps in
 * directly (no count-up from zero, so there's never a flash of $0 while data loads) -
 * only genuine changes after that (e.g. a refetch following a borrow/repay) animate.
 */
export function AnimatedUsd({ value }: { value: bigint | undefined }) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState("—");
  const hasSetInitial = useRef(false);

  useEffect(() => {
    if (value === undefined) return;
    const target = Number(value);

    if (!hasSetInitial.current) {
      motionValue.set(target);
      setDisplay(formatUsd6(value));
      hasSetInitial.current = true;
      return;
    }

    const controls = animate(motionValue, target, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(formatUsd6(BigInt(Math.round(v)))),
    });
    return controls.stop;
  }, [value, motionValue]);

  return <>{display}</>;
}
