import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { apiError, apiOk } from "../../lib/apiResponse";
import { cleanverseCredentials, postEncrypted, postPlain } from "../../lib/cleanverse.server";

const BLACKLIST_REASON = "AVAL demo: simulated default / revocation";
const VALID_STATUSES = new Set([1, 2]);

/**
 * POST /api/freeze  { wallet, status, cvRecordId? } -> freezes/unfreezes an A-Pass via
 * update_status (encrypted body). status 2 = freeze, 1 = unfreeze. If cvRecordId isn't
 * supplied, looks it up via query_apass first. Not wired to a UI button yet - ready for
 * the write flows in step 4.
 */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; status?: number; cvRecordId?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const { wallet, status } = body;
  let { cvRecordId } = body;

  if (!wallet || !isAddress(wallet)) {
    return apiError("A valid `wallet` address is required.", 400);
  }
  if (typeof status !== "number" || !VALID_STATUSES.has(status)) {
    return apiError("`status` must be 1 (unfreeze) or 2 (freeze).", 400);
  }

  const credentials = cleanverseCredentials();

  if (!cvRecordId) {
    let lookup;
    try {
      lookup = await postPlain(
        "/query_apass",
        { orgId: credentials.apiId, chain: "monad", address: wallet },
        credentials
      );
    } catch {
      return apiError("Could not reach the compliance provider.", 502);
    }

    if (!lookup.ok || !lookup.payload || lookup.payload.code !== "0000") {
      return apiError("Could not find an A-Pass record for this wallet.", 404);
    }

    cvRecordId = lookup.payload.data?.cvRecordId as string | undefined;
    if (!cvRecordId) {
      return apiError("A-Pass record has no cvRecordId.", 404);
    }
  }

  const plaintext = {
    cvRecordId,
    status: String(status),
    blacklistReason: BLACKLIST_REASON,
    wallet: { chain: "monad", address: wallet },
  };

  let result;
  try {
    result = await postEncrypted("/update_status", plaintext, credentials);
  } catch {
    return apiError("Could not reach the compliance provider.", 502);
  }

  if (!result.ok || !result.payload) {
    return apiError("Compliance provider returned an unexpected response.", 502);
  }

  if (result.payload.code !== "0000") {
    return apiError(result.payload.message ?? "Status update failed.", 502);
  }

  const data = result.payload.data ?? {};
  const wallet_ = (data.wallet as Record<string, unknown>) ?? {};

  return apiOk({
    ok: true,
    cvRecordId,
    txHash: (wallet_.txHash as string) ?? (data.txHash as string) ?? null,
  });
}
