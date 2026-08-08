"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { addressExplorerUrl } from "../lib/explorer";
import { CheckIcon, CopyIcon, ExternalLinkIcon, LogoutIcon } from "./icons";

export function WalletMenu({
  address,
  onClose,
  onDisconnect,
}: {
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied — nothing more we can do here
    }
  }

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-[calc(100%+10px)] z-30 w-72 overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="border-b border-white/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-steel">Connected wallet</p>
        <p className="mt-1.5 break-all font-mono text-[13px] leading-snug text-ivory">{address}</p>
      </div>

      <button
        onClick={handleCopy}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ivory transition-colors hover:bg-white/5"
      >
        {copied ? <CheckIcon size={16} className="text-teal" /> : <CopyIcon size={16} className="text-muted" />}
        <span>{copied ? "Copied" : "Copy address"}</span>
      </button>

      <a
        href={addressExplorerUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ivory transition-colors hover:bg-white/5"
      >
        <ExternalLinkIcon size={16} className="text-muted" />
        <span>View on explorer</span>
      </a>

      <button
        onClick={onDisconnect}
        className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-3 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-red"
      >
        <LogoutIcon size={16} />
        <span>Disconnect</span>
      </button>
    </motion.div>
  );
}
