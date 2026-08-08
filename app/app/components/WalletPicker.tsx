"use client";

import { motion } from "framer-motion";
import type { Connector } from "wagmi";

export function WalletPicker({
  connectors,
  connectingUid,
  onSelect,
}: {
  connectors: readonly Connector[];
  connectingUid: string | null;
  onSelect: (connector: Connector) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-72 overflow-hidden rounded-2xl border border-white/10 bg-panel text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
    >
      <p className="border-b border-white/5 px-4 py-3 text-[11px] uppercase tracking-wider text-steel">
        Choose a wallet
      </p>
      {connectors.map((connector) => {
        const isConnecting = connectingUid === connector.uid;
        return (
          <button
            key={connector.uid}
            onClick={() => onSelect(connector)}
            disabled={connectingUid !== null}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ivory transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {connector.icon ? (
              // eslint-disable-next-line @next/next/no-img-element -- runtime data: URI from the wallet, not a static asset
              <img src={connector.icon} alt="" className="h-6 w-6 rounded-md" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal/15 text-xs text-teal">
                {connector.name.slice(0, 1)}
              </span>
            )}
            <span>{connector.name}</span>
            {isConnecting && <span className="ml-auto text-xs text-muted">Connecting…</span>}
          </button>
        );
      })}
    </motion.div>
  );
}
