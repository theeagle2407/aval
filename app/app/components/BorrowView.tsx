"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { Skeleton } from "./Skeleton";
import { useAvalData } from "../lib/useAvalData";
import { useApass } from "../lib/useApass";
import { formatUsd6 } from "../lib/format";

function MeterBar({ fraction }: { fraction: number }) {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-teal"
        initial={{ width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

export function BorrowView() {
  const { creditLine, isCompliant, isLoading: isChainLoading, isError } = useAvalData();
  const { apass, isLoading: isApassLoading } = useApass();

  const isLoading = isChainLoading || isApassLoading;
  const hasTier = apass?.tier !== null && apass?.tier !== undefined;
  const hasActiveLine = creditLine?.active ?? false;
  const isVerifiedAndActive = Boolean(isCompliant) && hasActiveLine && !creditLine?.frozen;
  const isFrozen = hasActiveLine && Boolean(creditLine?.frozen);

  const available = creditLine ? creditLine.limit - creditLine.debt : undefined;
  const drawnFraction =
    creditLine && creditLine.limit > BigInt(0) ? Number(creditLine.debt) / Number(creditLine.limit) : 0;

  let ctaLabel = "Get verified";
  if (isCompliant && !hasActiveLine) ctaLabel = "Open credit line";

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        Borrow
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 max-w-md text-center text-sm text-muted"
      >
        Same $1,000, two different worlds.
      </motion.p>

      {isError && (
        <p className="mt-4 text-xs text-red">Couldn&apos;t load live data — retrying…</p>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-2"
      >
        {/* Left: legacy overcollateralized comparison — always illustrative, not live */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col justify-between rounded-2xl border border-white/8 bg-panel/50 p-7 opacity-60"
        >
          <div>
            <p className="text-[11px] uppercase tracking-wider text-steel">Anonymous wallet</p>
            <h2 className="mt-4 font-serif text-xl text-ivory">Lock $1,500 to borrow $1,000</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No identity, no history — just collateral sitting idle to cover the downside.
            </p>
          </div>
          <div className="mt-8">
            <MeterBar fraction={1} />
            <p className="mt-2 text-xs text-muted">150% collateralized</p>
          </div>
        </motion.div>

        {/* Right: real credit line, live from AvalLending.getCreditLine */}
        <motion.div
          variants={fadeUp}
          className={`flex flex-col justify-between rounded-2xl border p-7 transition-all duration-500 ${
            isVerifiedAndActive
              ? "border-teal/30 bg-panel shadow-[0_0_44px_-14px_rgba(45,212,191,0.45)]"
              : "border-white/8 bg-panel/50 opacity-70"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-steel">Verified credit line</p>
              {isLoading ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : isFrozen ? (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-red/15 px-2.5 py-1 text-[11px] font-medium text-red"
                >
                  Frozen
                </motion.span>
              ) : (
                isCompliant && (
                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-medium text-teal"
                  >
                    {hasTier ? `Tier ${apass!.tier} · Verified` : "Verified"}
                  </motion.span>
                )
              )}
            </div>

            <h2 className="mt-4 font-serif text-xl text-ivory">
              {isLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : hasActiveLine ? (
                `${formatUsd6(available)} available`
              ) : (
                "No credit line yet"
              )}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your verified identity is the collateral — nothing locked.
            </p>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <Skeleton className="h-1.5 w-full rounded-full" />
            ) : hasActiveLine ? (
              <>
                <MeterBar fraction={drawnFraction} />
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>{formatUsd6(creditLine!.debt)} drawn</span>
                  <span>{formatUsd6(creditLine!.limit)} limit</span>
                </div>
              </>
            ) : (
              <button
                disabled
                className="w-full rounded-full bg-teal/20 px-6 py-3 text-sm font-medium text-teal/50 disabled:cursor-not-allowed"
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
