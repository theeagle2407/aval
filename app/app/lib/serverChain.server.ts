import "server-only";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./chain";
import { requireEnv } from "./cleanverse.server";

/** Server-side clients for the demo backend signer (pool owner) - never exposed to the client. */
export function serverAccount() {
  const privateKey = requireEnv("PRIVATE_KEY");
  const normalized = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  return privateKeyToAccount(normalized as `0x${string}`);
}

export function serverPublicClient() {
  return createPublicClient({ chain: monadTestnet, transport: http() });
}

export function serverWalletClient() {
  return createWalletClient({ account: serverAccount(), chain: monadTestnet, transport: http() });
}
