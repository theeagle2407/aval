// Issues a Cleanverse A-Pass via POST /generate_apass (sandbox).
//
// Usage: node scripts/issue-apass.mjs <walletAddress> <tier>
// Requires .env with CLEANVERSE_API_ID, CLEANVERSE_API_KEY.
//
// Note: tier is ultimately assigned by Cleanverse based on the identity record. We pass the
// requested tier explicitly in case the API honors it, but always report back whatever tier
// the response actually assigns.

import "dotenv/config";
import crypto from "node:crypto";
import { isAddress } from "ethers";
import { postEncrypted, requireEnv } from "./cleanverse.mjs";

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

async function main() {
  const [, , walletAddress, tierArg] = process.argv;

  if (!walletAddress || !tierArg) {
    console.error("Usage: node scripts/issue-apass.mjs <walletAddress> <tier>");
    process.exitCode = 1;
    return;
  }

  if (!isAddress(walletAddress)) {
    console.error(`Invalid wallet address: ${walletAddress}`);
    process.exitCode = 1;
    return;
  }

  const tier = Number(tierArg);
  if (!Number.isInteger(tier) || tier < 0) {
    console.error(`Invalid tier: ${tierArg} (must be a non-negative integer)`);
    process.exitCode = 1;
    return;
  }

  const CLEANVERSE_API_ID = requireEnv("CLEANVERSE_API_ID");
  const CLEANVERSE_API_KEY = requireEnv("CLEANVERSE_API_KEY");

  const customerId = generateCustomerId();

  const plaintext = {
    customerId,
    tier,
    subTier: 1,
    override: false,
    expirationTime: expirationTimeTwoYearsOut(),
    wallet: { address: walletAddress, chain: "monad" },
    identityDataList: [
      { idType: "PASSPORT", fullName: "AVAL Demo User", issuingCountryISO2: "US" },
    ],
  };

  console.log("Wallet:      ", walletAddress);
  console.log("Requested tier:", tier);
  console.log("customerId:  ", customerId);
  console.log("expirationTime:", plaintext.expirationTime, `(${new Date(plaintext.expirationTime * 1000).toISOString()})`);

  console.log("\nPOST /generate_apass");
  const result = await postEncrypted("/generate_apass", plaintext, {
    apiId: CLEANVERSE_API_ID,
    apiKey: CLEANVERSE_API_KEY,
  });
  console.log("X-Request-ID:", result.requestId);

  if (!result.ok) {
    console.error(`\nHTTP ${result.status} ${result.statusText}`);
    console.error("Response body:", result.rawText);
    process.exitCode = 1;
    return;
  }

  if (!result.payload) {
    console.error("\nNon-JSON response body:", result.rawText);
    process.exitCode = 1;
    return;
  }

  const { payload } = result;
  console.log("\n==================== Cleanverse Response ====================");
  console.log("code:   ", payload.code);
  console.log("message:", payload.message);
  console.log("data:   ", payload.data);
  console.log("===============================================================");

  if (payload.code === "0000") {
    const assignedTier = payload.data?.tier;
    console.log("\nA-Pass issued.");
    console.log("Assigned tier:", assignedTier, assignedTier !== tier ? `(requested ${tier})` : "");
    console.log("cvRecordId:   ", payload.data?.cvRecordId);
    console.log("txHash:       ", payload.data?.wallet?.txHash ?? payload.data?.txHash);
  } else {
    console.error("\nA-Pass issuance failed (non-0000 code).");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message);
  process.exitCode = 1;
});
