"use client";

import { erc20Abi, zeroAddress } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { CONTRACTS } from "./contracts";
import { avalLendingAbi, validatorAbi } from "./abis";

export type CreditLine = {
  limit: bigint;
  debt: bigint;
  repaidCount: bigint;
  borrowedTotal: bigint;
  frozen: boolean;
  active: boolean;
};

const REFETCH_INTERVAL_MS = 10_000;

/**
 * Live on-chain reads (via multicall) for the connected wallet: its AvalLending credit
 * line, live compliance status, pool liquidity, the wallet's own aUSDC balance, and the
 * pool's registered minimum tier. Refetches every ~10s so figures stay current.
 */
export function useAvalData() {
  const { address } = useAccount();
  const queryAddress = address ?? zeroAddress;

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.avalLending,
        abi: avalLendingAbi,
        functionName: "getCreditLine",
        args: [queryAddress],
      },
      {
        address: CONTRACTS.avalLending,
        abi: avalLendingAbi,
        functionName: "isCompliant",
        args: [queryAddress],
      },
      {
        address: CONTRACTS.asset,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [CONTRACTS.avalLending],
      },
      {
        address: CONTRACTS.asset,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [queryAddress],
      },
      {
        address: CONTRACTS.validator,
        abi: validatorAbi,
        functionName: "getRulesV2",
        args: [CONTRACTS.avalLending],
      },
      {
        address: CONTRACTS.asset,
        abi: erc20Abi,
        functionName: "allowance",
        args: [queryAddress, CONTRACTS.avalLending],
      },
    ],
    query: {
      enabled: Boolean(address),
      refetchInterval: REFETCH_INTERVAL_MS,
    },
  });

  const [
    creditLineResult,
    isCompliantResult,
    poolLiquidityResult,
    userBalanceResult,
    rulesResult,
    allowanceResult,
  ] = data ?? [];

  const creditLine =
    creditLineResult?.status === "success" ? (creditLineResult.result as CreditLine) : undefined;
  const isCompliant =
    isCompliantResult?.status === "success" ? (isCompliantResult.result as boolean) : undefined;
  const poolLiquidity =
    poolLiquidityResult?.status === "success" ? (poolLiquidityResult.result as bigint) : undefined;
  const userBalance =
    userBalanceResult?.status === "success" ? (userBalanceResult.result as bigint) : undefined;
  const rules =
    rulesResult?.status === "success"
      ? (rulesResult.result as readonly { minTier: number }[])
      : undefined;
  const minTier = rules?.[0]?.minTier;
  const allowance =
    allowanceResult?.status === "success" ? (allowanceResult.result as bigint) : undefined;

  return {
    address,
    creditLine,
    isCompliant,
    poolLiquidity,
    userBalance,
    minTier,
    allowance,
    isLoading: Boolean(address) && isLoading,
    isError,
    refetch,
  };
}
