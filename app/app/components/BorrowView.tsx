"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { Skeleton } from "./Skeleton";
import { InlineStatus } from "./InlineStatus";
import { useAvalData } from "../lib/useAvalData";
import { useApass } from "../lib/useApass";
import { formatUsd6 } from "../lib/format";
import {
  useBorrowFlow,
  useGetVerifiedFlow,
  useOpenCreditFlow,
  useRepayFlow,
} from "../lib/writeFlows";

const BORROW_AMOUNT = BigInt(500_000_000); // 500e6, 6-decimal aUSDC

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
  const {
    creditLine,
    isCompliant,
    allowance,
    isLoading: isChainLoading,
    isError,
    refetch: refetchChain,
  } = useAvalData();
  const { apass, isLoading: isApassLoading, refetch: refetchApass } = useApass();

  function refetchAll() {
    refetchChain();
    refetchApass();
  }

  const getVerified = useGetVerifiedFlow(refetchAll);
  const openCredit = useOpenCreditFlow(refetchAll);
  const borrow = useBorrowFlow(refetchAll);
  const repay = useRepayFlow(refetchAll);

  const isLoading = isChainLoading || isApassLoading;
  const hasTier = apass?.tier !== null && apass?.tier !== undefined;
  const hasActiveLine = creditLine?.active ?? false;
  const isVerifiedAndActive = Boolean(isCompliant) && hasActiveLine && !creditLine?.frozen;
  const isFrozen = hasActiveLine && Boolean(creditLine?.frozen);

  const available = creditLine ? creditLine.limit - creditLine.debt : undefined;
  const drawnFraction =
    creditLine && creditLine.limit > BigInt(0) ? Number(creditLine.debt) / Number(creditLine.limit) : 0;

  const canBorrow =
    isCompliant && hasActiveLine && !isFrozen && available !== undefined && available >= BORROW_AMOUNT;
  const canRepay = hasActiveLine && (creditLine?.debt ?? BigInt(0)) > BigInt(0);

  // Flash the limit when it grows from a completed repay (compounding reputation).
  const prevLimit = useRef<bigint | null>(null);
  const [limitGrew, setLimitGrew] = useState(false);
  useEffect(() => {
    if (creditLine === undefined) return;
    if (prevLimit.current !== null && creditLine.limit > prevLimit.current) {
      setLimitGrew(true);
      const timeout = setTimeout(() => setLimitGrew(false), 2200);
      return () => clearTimeout(timeout);
    }
    prevLimit.current = creditLine.limit;
  }, [creditLine]);

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
              {isFrozen
                ? "This line is frozen — repayment still works, borrowing is blocked."
                : "Your verified identity is the collateral — nothing locked."}
            </p>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <Skeleton className="h-1.5 w-full rounded-full" />
            ) : hasActiveLine ? (
              <>
                <MeterBar fraction={drawnFraction} />
                <motion.div
                  animate={limitGrew ? { color: "#2DD4BF" } : { color: "#8A93A6" }}
                  className="mt-2 flex justify-between text-xs"
                >
                  <span>{formatUsd6(creditLine!.debt)} drawn</span>
                  <motion.span
                    animate={limitGrew ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className={limitGrew ? "font-medium text-teal" : ""}
                  >
                    {formatUsd6(creditLine!.limit)} limit{limitGrew ? " ↑" : ""}
                  </motion.span>
                </motion.div>

                <div className="mt-5 flex gap-3">
                  {canBorrow && (
                    <button
                      onClick={() => borrow.run(BORROW_AMOUNT)}
                      disabled={borrow.isBusy || repay.isBusy}
                      className="flex-1 rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-8px_rgba(45,212,191,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {borrow.isBusy ? "Borrowing…" : "Borrow $500"}
                    </button>
                  )}
                  {canRepay && (
                    <button
                      onClick={() => repay.run(creditLine!.debt, allowance ?? BigInt(0))}
                      disabled={borrow.isBusy || repay.isBusy}
                      className="flex-1 rounded-full border border-teal/40 px-5 py-2.5 text-sm font-medium text-teal transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {repay.isBusy ? "Repaying…" : "Repay"}
                    </button>
                  )}
                </div>

                <InlineStatus status={borrow.status.state !== "idle" ? borrow.status : repay.status} />
              </>
            ) : (
              <>
                <button
                  onClick={() => (isCompliant ? openCredit.run(apass?.tier ?? 20) : getVerified.run())}
                  disabled={getVerified.isBusy || openCredit.isBusy}
                  className="w-full rounded-full bg-teal px-6 py-3 text-sm font-medium text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-8px_rgba(45,212,191,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {getVerified.status.state === "progress"
                    ? getVerified.status.message
                    : openCredit.status.state === "progress"
                      ? openCredit.status.message
                      : isCompliant
                        ? "Open credit line"
                        : "Get verified"}
                </button>
                <InlineStatus status={isCompliant ? openCredit.status : getVerified.status} />
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
