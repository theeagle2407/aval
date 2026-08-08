"use client";

import { useSyncExternalStore } from "react";

export type TxKind = "issue-apass" | "open-credit" | "borrow" | "repay" | "freeze" | "unfreeze";

export type TxRecord = {
  id: string;
  kind: TxKind;
  label: string;
  txHash: string;
  timestamp: number;
};

const TX_KIND_LABELS: Record<TxKind, string> = {
  "issue-apass": "Identity credential issued",
  "open-credit": "Credit line opened",
  borrow: "Borrowed",
  repay: "Repaid",
  freeze: "Simulated default (frozen)",
  unfreeze: "Restored (unfrozen)",
};

function storageKey(address: string) {
  return `aval-tx-log:${address.toLowerCase()}`;
}

function readFromStorage(address: string): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(address));
    return raw ? (JSON.parse(raw) as TxRecord[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(address: string, records: TxRecord[]) {
  try {
    window.localStorage.setItem(storageKey(address), JSON.stringify(records));
  } catch {
    // storage unavailable - session list just won't persist across reloads
  }
}

const listeners = new Set<() => void>();
let cache: { address: string; records: TxRecord[] } | null = null;

function notify() {
  listeners.forEach((listener) => listener());
}

export function recordTx(address: string, kind: TxKind, txHash: string) {
  const records = readFromStorage(address);
  const next: TxRecord[] = [
    { id: `${txHash}-${kind}`, kind, label: TX_KIND_LABELS[kind], txHash, timestamp: Date.now() },
    ...records,
  ];
  writeToStorage(address, next);
  cache = { address, records: next };
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshotFor(address: string | undefined) {
  if (!address) return [];
  if (cache?.address === address) return cache.records;
  const records = readFromStorage(address);
  cache = { address, records };
  return records;
}

/** Reactive session tx log for `address`, newest first, persisted to localStorage per-wallet. */
export function useTxLog(address: string | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshotFor(address),
    () => []
  );
}
