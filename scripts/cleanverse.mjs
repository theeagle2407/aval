// Shared Cleanverse sandbox API helpers: AES-CBC request encryption + encrypted POST.
//
// Encryption scheme: AES-CBC, PKCS7 padding, IV = 16 zero bytes,
// key = Base64-decode(CLEANVERSE_API_KEY). Algorithm (128/192/256) is picked from the
// decoded key length. Ciphertext is Base64-encoded and wrapped as {"data": "<ciphertext>"}.

import crypto from "node:crypto";

export const BASE_URL = "https://uatapi.cleanverse.com/api/cooperate";

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

/** Encrypts a plaintext object under the Cleanverse AES-CBC scheme, returns Base64 ciphertext. */
export function encryptPayload(plaintextObj, apiKeyBase64) {
  const key = Buffer.from(apiKeyBase64, "base64");
  const iv = Buffer.alloc(16, 0);
  const algorithm = aesAlgorithmForKey(key);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(plaintextObj), "utf8"),
    cipher.final(),
  ]);

  return ciphertext.toString("base64");
}

/**
 * Encrypts `plaintextObj` and POSTs it to `${BASE_URL}${path}` with the Cleanverse
 * api-id / X-Request-ID headers. Returns { requestId, url, status, ok, statusText, rawText, payload }
 * rather than throwing on non-2xx, so callers can decide how to report failures.
 */
export async function postEncrypted(path, plaintextObj, { apiId, apiKey }) {
  const encryptedData = encryptPayload(plaintextObj, apiKey);
  const requestId = crypto.randomUUID();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": apiId,
      "X-Request-ID": requestId,
    },
    body: JSON.stringify({ data: encryptedData }),
  });

  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch {
    payload = undefined;
  }

  return {
    requestId,
    url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    rawText,
    payload,
  };
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
