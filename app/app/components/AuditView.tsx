"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { fadeUp, staggerContainer } from "./motion";
import { useTxLog, type TxRecord } from "../lib/txLog";
import { txExplorerUrl } from "../lib/explorer";
import { AuditIcon, ExternalLinkIcon } from "./icons";

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

const TRAVEL_RULE_KINDS = new Set(["borrow", "repay"]);

function TravelRuleButton({ record }: { record: TxRecord }) {
  const { address } = useAccount();
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; url: string }
  >({ kind: "idle" });

  async function handleClick() {
    if (!address) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/travel-rule?txHash=${record.txHash}&wallet=${address}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Report unavailable.");
      if (!json.data.downloadUrl) throw new Error("Report unavailable.");
      setState({ kind: "done", url: json.data.downloadUrl });
      window.open(json.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Report unavailable." });
    }
  }

  if (state.kind === "done") {
    return (
      <a
        href={state.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
      >
        View report
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={state.kind === "loading"}
        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:text-ivory disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.kind === "loading" ? "Fetching…" : "Travel Rule report"}
      </button>
      {state.kind === "error" && <span className="text-[11px] text-red">{state.message}</span>}
    </div>
  );
}

export function AuditView() {
  const { address } = useAccount();
  const records = useTxLog(address);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        Audit
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 max-w-md text-center text-sm text-muted"
      >
        Every action this session, with a live link to the chain.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-12 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/8 bg-panel"
      >
        {records.length === 0 ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center px-6 py-16 text-center">
            <AuditIcon size={24} className="text-steel" />
            <p className="mt-4 text-sm text-muted">
              No actions recorded yet this session — borrow, repay, or verify to see them here.
            </p>
          </motion.div>
        ) : (
          records.map((record, i) => (
            <motion.div
              key={record.id}
              variants={fadeUp}
              custom={i}
              className="flex flex-col gap-3 border-b border-white/5 px-6 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm text-ivory">{record.label}</p>
                <a
                  href={txExplorerUrl(record.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 font-mono text-xs text-muted hover:text-teal"
                >
                  {truncateHash(record.txHash)}
                  <ExternalLinkIcon size={12} />
                </a>
              </div>

              {TRAVEL_RULE_KINDS.has(record.kind) && <TravelRuleButton record={record} />}
            </motion.div>
          ))
        )}
      </motion.div>
    </main>
  );
}
