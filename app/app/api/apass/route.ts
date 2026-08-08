import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { apiError, apiOk } from "../../lib/apiResponse";
import { cleanverseCredentials, postPlain } from "../../lib/cleanverse.server";

/**
 * GET /api/apass?wallet=0x... - looks up the exact CVI tier/status for a wallet via
 * Cleanverse query_apass. Per the Cleanverse OpenAPI spec this is a plain (unencrypted)
 * JSON request; orgId is the CV-registered member id (our api-id doubles as orgId in
 * this sandbox).
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");

  if (!wallet || !isAddress(wallet)) {
    return apiError("A valid `wallet` address query parameter is required.", 400);
  }

  const { apiId } = cleanverseCredentials();

  let result;
  try {
    result = await postPlain(
      "/query_apass",
      { orgId: apiId, chain: "monad", address: wallet },
      { apiId }
    );
  } catch {
    return apiError("Could not reach the compliance provider.", 502);
  }

  if (!result.ok || !result.payload) {
    return apiError("Compliance provider returned an unexpected response.", 502);
  }

  if (result.payload.code !== "0000") {
    return apiError(result.payload.message ?? "Compliance lookup failed.", 502);
  }

  const data = result.payload.data ?? {};
  return apiOk({
    tier: data.tier !== undefined && data.tier !== null ? Number(data.tier) : null,
    subTier: data.subTier !== undefined && data.subTier !== null ? Number(data.subTier) : null,
    group: (data.group as string) || null,
    status: data.status !== undefined && data.status !== null ? Number(data.status) : null,
    countries: (data.countries as string[]) ?? [],
    cvRecordId: (data.cvRecordId as string) ?? null,
    expirationTime: data.expirationTime !== undefined ? Number(data.expirationTime) : null,
  });
}
