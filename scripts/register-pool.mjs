// Registers AvalLending as a Cleanverse compliance pool via POST /validator/register (sandbox).
//
// Usage: node scripts/register-pool.mjs
// Requires .env with CLEANVERSE_API_ID, CLEANVERSE_API_KEY, PRIVATE_KEY.

import "dotenv/config";
import crypto from "node:crypto";
import { Wallet } from "ethers";

const BASE_URL = "https://uatapi.cleanverse.com/api/cooperate";
const CHAIN = "monad";
const POOL_ADDRESS = "0x27eF8055CA2ad761FdF4Fc82646ceD1D8604CE81";
const EXPECTED_OWNER = "0xB37b46F58cd7E384DbD051332EB0c6e110E3Ed7C";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function aesAlgorithmForKey(key) {
  switch (key.length) {
    case 16:
      return "aes-128-cbc";
    case 24:
      return "aes-192-cbc";
    case 32:
      return "aes-256-cbc";
    default:
      throw new Error(`CLEANVERSE_API_KEY decodes to ${key.length} bytes; expected 16, 24, or 32`);
  }
}

function encryptBody(plaintextJson, apiKeyBase64) {
  const key = Buffer.from(apiKeyBase64, "base64");
  const iv = Buffer.alloc(16, 0);
  const algorithm = aesAlgorithmForKey(key);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextJson, "utf8"), cipher.final()]);

  return ciphertext.toString("base64");
}

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

  // STEP 3 - AES-CBC encrypt, PKCS7 padding, zero IV
  const encryptedData = encryptBody(JSON.stringify(plaintext), CLEANVERSE_API_KEY);
  const requestBody = { data: encryptedData };

  // STEP 4 - POST to /validator/register
  const requestId = crypto.randomUUID();
  const url = `${BASE_URL}/validator/register`;

  console.log("\nPOST", url);
  console.log("X-Request-ID:", requestId);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-id": CLEANVERSE_API_ID,
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error("\nRequest failed:", err.message);
    process.exitCode = 1;
    return;
  }

  const rawText = await response.text();

  if (!response.ok) {
    console.error(`\nHTTP ${response.status} ${response.statusText}`);
    console.error("Response body:", rawText);
    process.exitCode = 1;
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    console.error("\nNon-JSON response body:", rawText);
    process.exitCode = 1;
    return;
  }

  // STEP 5 - print raw response
  console.log("\n==================== Cleanverse Response ====================");
  console.log("code:   ", payload.code);
  console.log("message:", payload.message);
  console.log("data:   ", payload.data);
  console.log("===============================================================");

  if (payload.code === "0000") {
    const txHash = payload.data?.tx_hash;
    console.log("\nRegistration submitted. tx_hash:", txHash);
  } else {
    console.error("\nRegistration failed (non-0000 code).");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\nUnexpected error:", err.message);
  process.exitCode = 1;
});
