import { createConfig, http } from "wagmi";
import { monadTestnet } from "./chain";

/**
 * No manually-configured injected() connector here on purpose: with multiple wallet
 * extensions installed, a single generic injected() connector races for window.ethereum
 * and can fail before ever showing a wallet popup. multiInjectedProviderDiscovery (on by
 * default, set explicitly here) listens for EIP-6963 announceProvider events instead, so
 * every EIP-6963-compliant wallet (MetaMask, etc.) shows up as its own distinct connector
 * with its own name/icon, and connecting to one never touches the others.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  multiInjectedProviderDiscovery: true,
  transports: {
    // No URL passed: viem's http() defaults to the chain's own rpcUrls.default, so this
    // and serverChain.server.ts both derive from the single NEXT_PUBLIC_MONAD_RPC_URL-
    // aware source in chain.ts rather than duplicating the URL here.
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
