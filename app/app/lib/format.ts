import { formatUnits } from "viem";
import { ASSET_DECIMALS } from "./contracts";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Formats a 6-decimal on-chain token amount (e.g. aUSDC) as a dollar string. */
export function formatUsd6(value: bigint | undefined): string {
  if (value === undefined) return "—";
  return usdFormatter.format(Number(formatUnits(value, ASSET_DECIMALS)));
}
