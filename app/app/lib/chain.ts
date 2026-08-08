import { defineChain } from "viem";

// NEXT_PUBLIC_ because this feeds wagmi's client-side transport too - not a secret, just
// configurable so the RPC endpoint can change without a code change/redeploy.
const RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  contracts: {
    // Confirmed deployed at the canonical deterministic address on Monad testnet -
    // without this, viem's multicall() (used by wagmi's useReadContracts) fails outright.
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});
