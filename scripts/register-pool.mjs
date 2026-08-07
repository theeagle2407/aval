// Registers AvalLending as a Cleanverse compliance pool via POST /validator/register (sandbox).
//
// Usage: node scripts/register-pool.mjs
// Requires .env with CLEANVERSE_API_ID, CLEANVERSE_API_KEY, PRIVATE_KEY.

import "dotenv/config";
import { Wallet } from "ethers";
import { postEncrypted, requireEnv } from "./cleanverse.mjs";

const CHAIN = "monad";
const POOL_ADDRESS = "0x27eF8055CA2ad761FdF4Fc82646ceD1D8604CE81";
const EXPECTED_OWNER = "0xB37b46F58cd7E384DbD051332EB0c6e110E3Ed7C";

async function main() {
  const CLEANVERSE_API_ID = requireEnv("CLEANVERSE_API_ID");
  const CLEANVERSE_API_KEY = requireEnv("CLEANVERSE_API_KEY");
  const PRIVATE_KEY = requireEnv("PRIVATE_KEY");

  // STEP 1 - owner signature
  const wallet = new Wallet(PRIVATE_KEY);
  const message = `${CHAIN}${POOL_ADDRESS.toLowerCase()}`;
  const ownerSignature = await wallet.signMessage(message);

  console.log("Signer address:", wallet.address);
  console.log(
    "Matches expected pool owner:",
    wallet.address.toLowerCase() === EXPECTED_OWNER.toLowerCase()
  );

  // STEP 2 - plaintext JSON body
  const plaintext = {
    chain: CHAIN,
    contract_address: POOL_ADDRESS,
    rule: {
      allowed_group: "",
      allowed_sub_group: "",
      min_tier: 20,
      min_sub_tier: 0,
      is_black_list: false,
      countries: [],
    },
    owner_signature: ownerSignature,
  };

  // STEPS 3-4 - AES-encrypt and POST
  console.log("\nPOST /validator/register");
  const result = await postEncrypted("/validator/register", plaintext, {
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

  // STEP 5 - print raw response
  const { payload } = result;
  console.log("\n==================== Cleanverse Response ====================");
  console.log("code:   ", payload.code);
  console.log("message:", payload.message);
  console.log("data:   ", payload.data);
  console.log("===============================================================");

  if (payload.code === "0000") {
    console.log("\nRegistration submitted. tx_hash:", payload.data?.tx_hash);
  } else {
    console.error("\nRegistration failed (non-0000 code).");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message);
  process.exitCode = 1;
});
