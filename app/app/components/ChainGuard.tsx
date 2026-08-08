"use client";

import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { monadTestnet } from "../lib/chain";

/**
 * Mounted once at the app root (inside Providers, so it outlives the landing/home swap).
 * If a connected wallet is on the wrong network, prompts to switch to (or add) Monad
 * testnet. wagmi's injected connector falls back to wallet_addEthereumChain automatically
 * when the chain isn't yet known to the wallet.
 */
export function ChainGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== undefined && chainId !== monadTestnet.id) {
      switchChain({ chainId: monadTestnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  return null;
}
