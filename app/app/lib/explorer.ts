export const MONAD_EXPLORER_URL = "https://testnet.monadexplorer.com";

export function addressExplorerUrl(address: string) {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}
