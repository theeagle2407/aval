import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  contracts: {
    // Confirmed deployed at the canonical deterministic address on Monad testnet -
    // without this, viem's multicall() (used by wagmi's useReadContracts) fails outright.
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});
