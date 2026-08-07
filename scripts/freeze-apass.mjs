// Freezes/unfreezes a Cleanverse A-Pass via POST /update_status (sandbox).
//
// Usage: node scripts/freeze-apass.mjs <walletAddress> <status>
//   status 2 = freeze (blacklist), 1 = unfreeze
// Requires .env with CLEANVERSE_API_ID, CLEANVERSE_API_KEY.

import "dotenv/config";
import { isAddress } from "ethers";
import { postEncrypted, requireEnv } from "./cleanverse.mjs";

const CV_RECORD_ID = "1236";
const BLACKLIST_REASON = "AVAL demo: simulated default / revocation";

const VALID_STATUSES = new Set(["1", "2"]);
const STATUS_LABELS = { 1: "unfreeze", 2: "freeze" };

async function main() {
  const [, , walletAddress, statusArg] = process.argv;

  if (!walletAddress || !statusArg) {
    console.error("Usage: node scripts/freeze-apass.mjs <walletAddress> <status>");
    console.error("  status 2 = freeze, 1 = unfreeze");
    process.exitCode = 1;
    return;
  }

  if (!isAddress(walletAddress)) {
    console.error(`Invalid wallet address: ${walletAddress}`);
    process.exitCode = 1;
    return;
  }

  if (!VALID_STATUSES.has(statusArg)) {
    console.error(`Invalid status: ${statusArg} (must be 1 = unfreeze or 2 = freeze)`);
    process.exitCode = 1;
    return;
  }

  const CLEANVERSE_API_ID = requireEnv("CLEANVERSE_API_ID");
  const CLEANVERSE_API_KEY = requireEnv("CLEANVERSE_API_KEY");

  const plaintext = {
    cvRecordId: CV_RECORD_ID,
    status: statusArg,
    blacklistReason: BLACKLIST_REASON,
    wallet: { chain: "monad", address: walletAddress },
  };

  console.log("Wallet:  ", walletAddress);
  console.log("cvRecordId:", CV_RECORD_ID);
  console.log("Action:  ", `${statusArg} (${STATUS_LABELS[statusArg]})`);

  console.log("\nPOST /update_status");
  const result = await postEncrypted("/update_status", plaintext, {
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
    const txHash = payload.data?.wallet?.txHash ?? payload.data?.txHash;
    console.log(`\nA-Pass ${STATUS_LABELS[statusArg]} submitted. txHash:`, txHash);
  } else {
    console.error("\nA-Pass status update failed (non-0000 code).");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message);
  process.exitCode = 1;
});
