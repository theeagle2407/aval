"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { Skeleton } from "./Skeleton";
import { useAvalData } from "../lib/useAvalData";
import { formatUsd6 } from "../lib/format";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function PoolView() {
  const { address, creditLine, poolLiquidity, isLoading, isError } = useAvalData();

  const drawn = creditLine?.active ? creditLine.debt : BigInt(0);
  const available = poolLiquidity ?? BigInt(0);
  const total = available + drawn;
  const utilization = total > BigInt(0) ? Number(drawn) / Number(total) : 0;

  const stats = [
    { label: "Total liquidity", value: formatUsd6(total) },
    { label: "Available", value: formatUsd6(available) },
    { label: "Drawn", value: formatUsd6(drawn) },
    { label: "Utilization", value: `${(utilization * 100).toFixed(1)}%` },
  ];

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        Pool
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 max-w-md text-center text-sm text-muted"
      >
        Live treasury liquidity for the AvalLending pool.
      </motion.p>

      {isError && (
        <p className="mt-4 text-xs text-red">Couldn&apos;t load live data — retrying…</p>
      )}

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-12 grid w-full max-w-4xl grid-cols-2 gap-5 sm:grid-cols-4"
      >
        {stats.map(({ label, value }) => (
          <motion.div
            key={label}
            variants={fadeUp}
            className="rounded-2xl border border-white/8 bg-panel p-6"
          >
            <p className="text-[11px] uppercase tracking-wider text-steel">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-3 h-7 w-20" />
            ) : (
              <p className="mt-3 font-serif text-xl text-ivory">{value}</p>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={2}
        className="mt-8 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/8 bg-panel"
      >
        <p className="border-b border-white/5 px-6 py-4 text-[11px] uppercase tracking-wider text-steel">
          Active credit lines
        </p>

        {isLoading ? (
          <div className="flex items-center gap-4 px-6 py-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : creditLine?.active && address ? (
          <div className="flex items-center justify-between px-6 py-4 text-sm">
            <span className="font-mono text-ivory">{truncateAddress(address)}</span>
            <span className="text-muted">{formatUsd6(creditLine.debt)} drawn</span>
            <span className="text-muted">{formatUsd6(creditLine.limit)} limit</span>
            <span className={creditLine.frozen ? "text-red" : "text-teal"}>
              {creditLine.frozen ? "Frozen" : "Active"}
            </span>
          </div>
        ) : (
          <p className="px-6 py-6 text-center text-sm text-muted">No active credit line for this wallet.</p>
        )}
      </motion.div>
    </main>
  );
}
