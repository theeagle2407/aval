import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { isAddress } from "viem";
import { apiError, apiOk } from "../../lib/apiResponse";
import { cleanverseCredentials, postEncrypted } from "../../lib/cleanverse.server";

const CUSTOMER_ID_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCustomerId() {
  let suffix = "";
  for (let i = 0; i < 12; i++) {
    suffix += CUSTOMER_ID_CHARSET[crypto.randomInt(CUSTOMER_ID_CHARSET.length)];
  }
  return `AVAL${suffix}`;
}

function expirationTimeTwoYearsOut() {
  const expiration = new Date();
  expiration.setFullYear(expiration.getFullYear() + 2);
  return Math.floor(expiration.getTime() / 1000);
}

/**
 * POST /api/issue-apass  { wallet } -> issues a Cleanverse A-Pass via generate_apass
 * (encrypted body). Same request shape as scripts/issue-apass.mjs. Cleanverse assigns the
 * tier from the identity record regardless of any requested value, so we don't send one.
 */
export async function POST(request: NextRequest) {
  let body: { wallet?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Request body must be JSON.", 400);
  }

  const { wallet } = body;
  if (!wallet || !isAddress(wallet)) {
    return apiError("A valid `wallet` address is required.", 400);
  }

  const credentials = cleanverseCredentials();
  const customerId = generateCustomerId();

  const plaintext = {
    customerId,
    subTier: 1,
    override: false,
    expirationTime: expirationTimeTwoYearsOut(),
    wallet: { address: wallet, chain: "monad" },
    identityDataList: [
      { idType: "PASSPORT", fullName: "AVAL Demo User", issuingCountryISO2: "US" },
    ],
  };

  let result;
  try {
    result = await postEncrypted("/generate_apass", plaintext, credentials);
  } catch {
    return apiError("Could not reach the compliance provider.", 502);
  }

  if (!result.ok || !result.payload) {
    return apiError("Compliance provider returned an unexpected response.", 502);
  }

  if (result.payload.code !== "0000") {
    return apiError(result.payload.message ?? "A-Pass issuance failed.", 502);
  }

  const data = result.payload.data ?? {};
  const wallet_ = (data.wallet as Record<string, unknown>) ?? {};

  return apiOk({
    tier: data.tier !== undefined && data.tier !== null ? Number(data.tier) : null,
    cvRecordId: (data.cvRecordId as string) ?? null,
    txHash: (wallet_.txHash as string) ?? (data.txHash as string) ?? null,
  });
}
