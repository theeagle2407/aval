"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { fadeUp, staggerContainer } from "./motion";
import { useTxLog } from "../lib/txLog";
import { txExplorerUrl } from "../lib/explorer";
import { AuditIcon, ComplianceIcon, ExternalLinkIcon } from "./icons";

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

type LookupState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; url: string };

function TravelRuleLookup() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState("");
  const [state, setState] = useState<LookupState>({ kind: "idle" });
  const isValidHash = /^0x[0-9a-fA-F]{64}$/.test(txHash);

  async function handleLookup() {
    if (!address || !isValidHash) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/travel-rule?txHash=${txHash}&wallet=${address}`);
      const json = await res.json();
      if (!json.ok || !json.data?.downloadUrl) {
        throw new Error(json.error ?? "No settlement report found for this transaction.");
      }
      setState({ kind: "done", url: json.data.downloadUrl });
      window.open(json.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "No settlement report found for this transaction.",
      });
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={txHash}
          onChange={(e) => {
            setTxHash(e.target.value.trim());
            setState({ kind: "idle" });
          }}
          placeholder="Settlement transaction hash (0x…)"
          className="flex-1 rounded-full border border-white/10 bg-navy/40 px-4 py-2 font-mono text-xs text-ivory placeholder:text-steel focus:border-teal/40 focus:outline-none"
        />
        <button
          onClick={handleLookup}
          disabled={!isValidHash || state.kind === "loading"}
          className="shrink-0 rounded-full border border-teal/30 px-4 py-2 text-xs font-medium text-teal transition-colors hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === "loading" ? "Looking up…" : "Look up report"}
        </button>
      </div>

      {state.kind === "error" && <p className="mt-2 text-[11px] text-red">{state.message}</p>}
      {state.kind === "done" && (
        <a
          href={state.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-[11px] text-teal underline decoration-teal/40 underline-offset-2"
        >
          View report
        </a>
      )}
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
        Compliance audit trail
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 max-w-md text-center text-sm text-muted"
      >
        On-chain traceability for every action, plus Travel Rule reporting for verified
        settlement events.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-12 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/8 bg-panel"
      >
        <p className="border-b border-white/5 px-6 py-4 text-[11px] uppercase tracking-wider text-steel">
          On-chain transaction history
        </p>

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
              className="flex items-center justify-between border-b border-white/5 px-6 py-4 last:border-0"
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
            </motion.div>
          ))
        )}
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        custom={2}
        className="mt-5 w-full max-w-3xl rounded-2xl border border-white/8 bg-panel p-6"
      >
        <div className="flex items-center gap-2">
          <ComplianceIcon size={18} className="text-teal" />
          <p className="text-[11px] uppercase tracking-wider text-steel">Travel Rule reports</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Available for CVA (A-Token) settlement and compliance events processed through
          Cleanverse&apos;s rails — exports the Travel Rule report for a verified-asset
          transfer. This doesn&apos;t apply to on-chain lending calls like borrow or repay,
          which settle directly on Monad and aren&apos;t routed through Cleanverse.
        </p>
        <TravelRuleLookup />
      </motion.div>
    </main>
  );
}
