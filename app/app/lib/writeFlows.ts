"use client";

import { useState } from "react";
import { erc20Abi } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { CONTRACTS } from "./contracts";
import { avalLendingAbi } from "./abis";
import { friendlyTxError } from "./errors";
import { recordTx } from "./txLog";
import type { FlowStatus } from "../components/InlineStatus";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Something went wrong — try again.");
  return json.data as T;
}

/** "Get verified": issues an A-Pass, then opens a credit line at the assigned tier. */
export function useGetVerifiedFlow(refetchAll: () => void) {
  const { address } = useAccount();
  const [status, setStatus] = useState<FlowStatus>({ state: "idle" });

  async function run() {
    if (!address) return;
    try {
      setStatus({ state: "progress", message: "Issuing identity credential…" });
      const issued = await postJson<{ tier: number | null; txHash: string | null }>(
        "/api/issue-apass",
        { wallet: address }
      );
      if (issued.txHash) recordTx(address, "issue-apass", issued.txHash);

      const tier = issued.tier ?? 20;
      setStatus({ state: "progress", message: "Opening credit line…" });
      const opened = await postJson<{ txHash: string }>("/api/open-credit", {
        wallet: address,
        tier,
      });
      recordTx(address, "open-credit", opened.txHash);

      setStatus({ state: "success", message: "Verified — your credit line is live." });
      refetchAll();
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Something went wrong — try again.",
      });
    }
  }

  return { run, status, isBusy: status.state === "progress" };
}

/** "Open credit line" for a wallet that's already verified (skips re-issuing the A-Pass). */
export function useOpenCreditFlow(refetchAll: () => void) {
  const { address } = useAccount();
  const [status, setStatus] = useState<FlowStatus>({ state: "idle" });

  async function run(tier: number) {
    if (!address) return;
    try {
      setStatus({ state: "progress", message: "Opening credit line…" });
      const opened = await postJson<{ txHash: string }>("/api/open-credit", {
        wallet: address,
        tier,
      });
      recordTx(address, "open-credit", opened.txHash);
      setStatus({ state: "success", message: "Credit line is live." });
      refetchAll();
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Something went wrong — try again.",
      });
    }
  }

  return { run, status, isBusy: status.state === "progress" };
}

/** "Borrow $500": a real AvalLending.borrow() tx signed by the connected wallet. */
export function useBorrowFlow(refetchAll: () => void) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<FlowStatus>({ state: "idle" });

  async function run(amount: bigint) {
    if (!address || !publicClient) return;
    try {
      setStatus({ state: "progress", message: "Confirm the borrow in your wallet…" });
      const txHash = await writeContractAsync({
        address: CONTRACTS.avalLending,
        abi: avalLendingAbi,
        functionName: "borrow",
        args: [amount],
      });

      setStatus({ state: "progress", message: "Waiting for confirmation…" });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      recordTx(address, "borrow", txHash);

      setStatus({ state: "success", message: "Borrowed." });
      refetchAll();
    } catch (err) {
      setStatus({ state: "error", message: friendlyTxError(err) });
    }
  }

  return { run, status, isBusy: status.state === "progress" };
}

/** "Repay": approves the pool if needed, then a real AvalLending.repay() tx. */
export function useRepayFlow(refetchAll: () => void) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<FlowStatus>({ state: "idle" });

  async function run(amount: bigint, currentAllowance: bigint) {
    if (!address || !publicClient) return;
    try {
      if (currentAllowance < amount) {
        setStatus({ state: "progress", message: "Approving repayment…" });
        const approveHash = await writeContractAsync({
          address: CONTRACTS.asset,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACTS.avalLending, amount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      setStatus({ state: "progress", message: "Confirm the repayment in your wallet…" });
      const txHash = await writeContractAsync({
        address: CONTRACTS.avalLending,
        abi: avalLendingAbi,
        functionName: "repay",
        args: [amount],
      });

      setStatus({ state: "progress", message: "Waiting for confirmation…" });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      recordTx(address, "repay", txHash);

      setStatus({ state: "success", message: "Repaid." });
      refetchAll();
    } catch (err) {
      setStatus({ state: "error", message: friendlyTxError(err) });
    }
  }

  return { run, status, isBusy: status.state === "progress" };
}

/** "Simulate default" / "Unfreeze": POST /api/freeze, status 2 = freeze, 1 = unfreeze. */
export function useFreezeFlow(refetchAll: () => void) {
  const { address } = useAccount();
  const [status, setStatus] = useState<FlowStatus>({ state: "idle" });

  async function run(targetStatus: 1 | 2) {
    if (!address) return;
    try {
      setStatus({
        state: "progress",
        message: targetStatus === 2 ? "Simulating default…" : "Restoring…",
      });
      const result = await postJson<{ txHash: string | null }>("/api/freeze", {
        wallet: address,
        status: targetStatus,
      });
      if (result.txHash) recordTx(address, targetStatus === 2 ? "freeze" : "unfreeze", result.txHash);

      setStatus({
        state: "success",
        message: targetStatus === 2 ? "Frozen — compliance revoked." : "Restored — compliance active again.",
      });
      refetchAll();
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Something went wrong — try again.",
      });
    }
  }

  return { run, status, isBusy: status.state === "progress" };
}
