import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { apiError, apiOk } from "../../lib/apiResponse";
import { serverPublicClient, serverWalletClient } from "../../lib/serverChain.server";
import { avalLendingAbi } from "../../lib/abis";
import { CONTRACTS } from "../../lib/contracts";

/**
 * POST /api/open-credit  { wallet, tier } -> the demo backend signer (pool owner,
 * PRIVATE_KEY) calls AvalLending.openCreditLineFor(wallet, tier) and waits for the
 * receipt. Not wired to a UI button yet - ready for the write flows in step 4.
 */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; tier?: number };
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const { wallet, tier } = body;
  if (!wallet || !isAddress(wallet)) {
    return apiError("A valid `wallet` address is required.", 400);
  }
  if (typeof tier !== "number" || !Number.isInteger(tier) || tier < 0) {
    return apiError("A valid non-negative integer `tier` is required.", 400);
  }

  const walletClient = serverWalletClient();
  const publicClient = serverPublicClient();

  let txHash;
  try {
    txHash = await walletClient.writeContract({
      address: CONTRACTS.avalLending,
      abi: avalLendingAbi,
      functionName: "openCreditLineFor",
      args: [wallet, BigInt(tier)],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transaction failed to submit.";
    return apiError(message, 502);
  }

  try {
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  } catch {
    return apiError("Transaction submitted but confirmation timed out.", 504);
  }

  return apiOk({ txHash });
}
