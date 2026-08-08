"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { Skeleton } from "./Skeleton";
import { useAvalData } from "../lib/useAvalData";
import { CONTRACTS } from "../lib/contracts";
import { ComplianceIcon } from "./icons";

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function ComplianceView() {
  const { isCompliant, minTier, isLoading, isError } = useAvalData();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        Compliance
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 max-w-md text-center text-sm text-muted"
      >
        Verified live against the Cleanverse compliance validator.
      </motion.p>

      {isError && (
        <p className="mt-4 text-xs text-red">Couldn&apos;t load live data — retrying…</p>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-12 w-full max-w-3xl"
      >
        <motion.div
          variants={fadeUp}
          className={`flex flex-col items-center rounded-2xl border p-10 text-center transition-all duration-500 ${
            isCompliant
              ? "border-teal/30 bg-panel shadow-[0_0_44px_-14px_rgba(45,212,191,0.45)]"
              : "border-white/8 bg-panel/50"
          }`}
        >
          <ComplianceIcon size={28} className={isCompliant ? "text-teal" : "text-steel"} />

          {isLoading ? (
            <Skeleton className="mt-5 h-8 w-40" />
          ) : (
            <motion.h2
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className="mt-5 font-serif text-2xl text-ivory"
            >
              {isCompliant ? "Verified" : "Not verified"}
            </motion.h2>
          )}

          <p className="mt-2 text-sm text-muted">
            {isCompliant
              ? "Your A-Pass meets this pool's compliance rule."
              : "No valid A-Pass found for this pool's compliance rule."}
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-panel p-6">
            <p className="text-[11px] uppercase tracking-wider text-steel">Pool rule</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-6 w-24" />
            ) : (
              <p className="mt-3 font-serif text-xl text-ivory">
                Min. tier {minTier ?? 20}
              </p>
            )}
            <p className="mt-2 text-sm text-muted">Registered on the A-Pass validator for this pool.</p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-panel p-6">
            <p className="text-[11px] uppercase tracking-wider text-steel">Validator</p>
            <p className="mt-3 break-all font-mono text-sm text-ivory">
              {truncateAddress(CONTRACTS.validator)}
            </p>
            <p className="mt-2 text-sm text-muted">Cleanverse CCP validator, Monad testnet.</p>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
