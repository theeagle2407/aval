import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { apiError, apiOk } from "../../lib/apiResponse";
import { cleanverseCredentials, friendlyCleanverseError, postPlain } from "../../lib/cleanverse.server";

/**
 * GET /api/travel-rule?txHash=0x...&wallet=0x... -> fetches a Travel Rule report download
 * link via download_travel_rule (plain JSON body, per the Cleanverse OpenAPI spec's
 * TravelRuleDownloadRequestDTO: requires orgId, cvRecordId, txHash, wallet). Looks up
 * cvRecordId via query_apass first.
 */
export async function GET(request: NextRequest) {
  const txHash = request.nextUrl.searchParams.get("txHash");
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return apiError("A valid `txHash` query parameter is required.", 400);
  }
  if (!wallet || !isAddress(wallet)) {
    return apiError("A valid `wallet` address query parameter is required.", 400);
  }

  const credentials = cleanverseCredentials();

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

  const cvRecordId = lookup.payload.data?.cvRecordId as string | undefined;
  if (!cvRecordId) {
    return apiError("A-Pass record has no cvRecordId.", 404);
  }

  let result;
  try {
    result = await postPlain(
      "/download_travel_rule",
      {
        orgId: credentials.apiId,
        cvRecordId,
        txHash,
        wallet: { address: wallet, chain: "monad" },
      },
      credentials
    );
  } catch {
    return apiError("Could not reach the compliance provider.", 502);
  }

  if (!result.ok || !result.payload) {
    return apiError("Compliance provider returned an unexpected response.", 502);
  }

  if (result.payload.code !== "0000") {
    return apiError(
      friendlyCleanverseError(result.payload.message, "Travel Rule report isn't available right now."),
      502
    );
  }

  const data = result.payload.data ?? {};
  return apiOk({
    downloadUrl: (data.downloadUrl as string) ?? (data.url as string) ?? (data.fileUrl as string) ?? null,
    fileName: (data.fileName as string) ?? (data.filename as string) ?? (data.name as string) ?? null,
  });
}
