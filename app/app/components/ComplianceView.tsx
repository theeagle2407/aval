"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { Skeleton } from "./Skeleton";
import { InlineStatus } from "./InlineStatus";
import { Spinner } from "./Spinner";
import { TierBar } from "./TierBar";
import { useAvalData } from "../lib/useAvalData";
import { useApass } from "../lib/useApass";
import { useFreezeFlow } from "../lib/writeFlows";
import { CONTRACTS } from "../lib/contracts";
import { ComplianceIcon } from "./icons";

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function ComplianceView() {
  const {
    isCompliant,
    minTier,
    isLoading: isChainLoading,
    isError: isChainError,
    refetch: refetchChain,
  } = useAvalData();
  const { apass, isLoading: isApassLoading, isError: isApassError, refetch: refetchApass } = useApass();

  function refetchAll() {
    refetchChain();
    refetchApass();
  }

  const freeze = useFreezeFlow(refetchAll);
  const [freezeTarget, setFreezeTarget] = useState<1 | 2 | null>(null);

  const isLoading = isChainLoading || isApassLoading;
  const isError = isChainError || isApassError;
  const hasTier = apass?.tier !== null && apass?.tier !== undefined;
  const isFrozen = apass?.status === 2;

  const headline = hasTier
    ? `Tier ${apass!.tier} · ${isCompliant ? "Verified" : "Not verified"}`
    : isCompliant
      ? "Verified"
      : "Not verified";

  const statusLabel = apass?.status === 2 ? "Frozen" : apass?.status === 1 ? "Active" : null;

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
            isLoading
              ? "border-white/8 bg-panel/50"
              : isCompliant
                ? "border-teal/30 bg-panel shadow-[0_0_44px_-14px_rgba(45,212,191,0.45)]"
                : "border-white/8 bg-panel/50"
          }`}
        >
          <ComplianceIcon size={28} className={isCompliant ? "text-teal" : "text-steel"} />

          {isLoading ? (
            <Skeleton className="mt-5 h-8 w-48" />
          ) : (
            <motion.h2
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
              className="mt-5 font-serif text-2xl text-ivory"
            >
              {headline}
            </motion.h2>
          )}

          <p className="mt-2 text-sm text-muted">
            {isCompliant
              ? "Your A-Pass meets this pool's compliance rule."
              : "No valid A-Pass found for this pool's compliance rule."}
          </p>

          {(statusLabel || (apass?.countries?.length ?? 0) > 0) && !isLoading && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {statusLabel && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    statusLabel === "Frozen" ? "bg-red/15 text-red" : "bg-teal/15 text-teal"
                  }`}
                >
                  {statusLabel}
                </span>
              )}
              {apass?.countries?.map((country) => (
                <span
                  key={country}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted"
                >
                  {country}
                </span>
              ))}
            </div>
          )}

          {hasTier && !isLoading && (
            <div className="mt-8 w-full max-w-sm">
              <TierBar tier={apass!.tier!} />
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-panel p-6">
            <p className="text-[11px] uppercase tracking-wider text-steel">Pool rule</p>
            {isChainLoading ? (
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

        {apass?.cvRecordId && (
          <motion.div
            variants={fadeUp}
            className="mt-5 rounded-2xl border border-dashed border-white/10 bg-panel/40 p-6"
          >
            <p className="text-[11px] uppercase tracking-wider text-steel">Demo control</p>
            <p className="mt-2 text-sm text-muted">
              Simulates a real-world revocation or default — freezing the A-Pass revokes
              compliance immediately, so borrowing stops even though the credit line stays open.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setFreezeTarget(2);
                  freeze.run(2);
                }}
                disabled={freeze.isBusy || isFrozen}
                className="flex items-center gap-2 rounded-full border border-red/30 px-5 py-2.5 text-sm font-medium text-red transition-all duration-300 hover:bg-red/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {freeze.isBusy && freezeTarget === 2 && <Spinner size={13} />}
                {freeze.isBusy && freezeTarget === 2 ? "Simulating…" : "Simulate default"}
              </button>
              <button
                onClick={() => {
                  setFreezeTarget(1);
                  freeze.run(1);
                }}
                disabled={freeze.isBusy || !isFrozen}
                className="flex items-center gap-2 rounded-full border border-teal/30 px-5 py-2.5 text-sm font-medium text-teal transition-all duration-300 hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {freeze.isBusy && freezeTarget === 1 && <Spinner size={13} />}
                {freeze.isBusy && freezeTarget === 1 ? "Restoring…" : "Unfreeze / restore"}
              </button>
            </div>
            <InlineStatus status={freeze.status} />
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
