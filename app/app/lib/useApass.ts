"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export type ApassData = {
  tier: number | null;
  subTier: number | null;
  group: string | null;
  status: number | null;
  countries: string[];
  cvRecordId: string | null;
  expirationTime: number | null;
};

const REFETCH_INTERVAL_MS = 10_000;

/** Live GET /api/apass for the connected wallet - the exact tier number, not just a bool. */
export function useApass() {
  const { address } = useAccount();

  const query = useQuery({
    queryKey: ["apass", address],
    queryFn: async (): Promise<ApassData> => {
      const res = await fetch(`/api/apass?wallet=${address}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Failed to load A-Pass data.");
      return json.data as ApassData;
    },
    enabled: Boolean(address),
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  return {
    apass: query.data,
    isLoading: Boolean(address) && query.isLoading,
    isError: query.isError,
  };
}
