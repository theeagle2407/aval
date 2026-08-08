"use client";

import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { monadTestnet } from "../lib/chain";

/**
 * Mounted once at the app root (inside Providers, so it outlives the landing/home swap).
 * If a connected wallet is on the wrong network, prompts to switch to (or add) Monad
 * testnet. wagmi's injected connector falls back to wallet_addEthereumChain automatically
 * when the chain isn't yet known to the wallet.
 *
 * Failures here are swallowed on purpose: this is a best-effort convenience prompt, not a
 * gate, and an unhandled rejection from it (e.g. the wallet's own chain-switch UI being
 * dismissed) shouldn't ever surface as an app error - the user can always switch manually.
 */
export function ChainGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (!isConnected || chainId === undefined || chainId === monadTestnet.id) return;

    switchChainAsync({ chainId: monadTestnet.id }).catch((error) => {
      console.debug("[AVAL] chain auto-switch skipped:", error instanceof Error ? error.message : error);
    });
  }, [isConnected, chainId, switchChainAsync]);

  return null;
}
