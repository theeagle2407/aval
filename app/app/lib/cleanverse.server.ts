import "server-only";

// Server-only Cleanverse sandbox API client: AES-CBC request encryption + encrypted POST.
// Ported from scripts/cleanverse.mjs. Never import this from a client component - the
// `server-only` guard above makes that a build-time error instead of leaking secrets.
//
// Encryption scheme: AES-CBC, PKCS7 padding, IV = 16 zero bytes,
// key = Base64-decode(CLEANVERSE_API_KEY). Algorithm (128/192/256) is picked from the
// decoded key length. Ciphertext is Base64-encoded and wrapped as {"data": "<ciphertext>"}.

import crypto from "node:crypto";

export const BASE_URL = "https://uatapi.cleanverse.com/api/cooperate";

function aesAlgorithmForKey(key: Buffer) {
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

export function encryptPayload(plaintextObj: unknown, apiKeyBase64: string): string {
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

export type CleanversePayload = {
  code?: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type CleanverseResult = {
  requestId: string;
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  rawText: string;
  payload: CleanversePayload | undefined;
};

const TRANSIENT_500_RETRIES = 2;
const TRANSIENT_500_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * True only for the sandbox's transient "0002 + system error" wrapper, never for other
 * 0002s (e.g. bad params) or 0001. The sandbox has been observed using more than one
 * message format for the same transient condition - e.g. "[500]System Error" from
 * update_status, "[CV_500]CV System error" (lowercase, different bracket code) from
 * generate_apass - so this matches loosely on "system error" and any bracketed 5xx code
 * rather than one exact string.
 */
function isTransient500(payload: CleanversePayload | undefined) {
  if (payload?.code !== "0002" || typeof payload?.message !== "string") return false;
  return /system error/i.test(payload.message) || /\[[a-z_]*5\d{2}\]/i.test(payload.message);
}

async function sendOnce(path: string, body: unknown, apiId: string): Promise<CleanverseResult> {
  const requestId = crypto.randomUUID();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-id": apiId,
      "X-Request-ID": requestId,
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload: CleanversePayload | undefined;
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

async function withTransient500Retry(
  send: () => Promise<CleanverseResult>
): Promise<CleanverseResult> {
  let result = await send();

  let attempt = 0;
  while (isTransient500(result.payload) && attempt < TRANSIENT_500_RETRIES) {
    attempt += 1;
    await sleep(TRANSIENT_500_DELAY_MS);
    result = await send();
  }

  return result;
}

/**
 * Encrypts `plaintextObj` and POSTs it to `${BASE_URL}${path}` with the Cleanverse
 * api-id / X-Request-ID headers. Returns a result object rather than throwing on
 * non-2xx, so callers decide how to report failures.
 *
 * Retries up to TRANSIENT_500_RETRIES times, with a fixed delay, but only for the
 * sandbox's transient "0002" + "[500]"/"System Error" wrapper - never for other 0002
 * business errors (e.g. bad params) or 0001, which are real failures returned as-is.
 *
 * Use for endpoints the Cleanverse OpenAPI spec documents as taking an EncryptedV2Request
 * body (mutating endpoints: generate_apass, update_status, validator/register, ...).
 */
export async function postEncrypted(
  path: string,
  plaintextObj: unknown,
  { apiId, apiKey }: { apiId: string; apiKey: string }
): Promise<CleanverseResult> {
  return withTransient500Retry(() =>
    sendOnce(path, { data: encryptPayload(plaintextObj, apiKey) }, apiId)
  );
}

/**
 * POSTs a plain (unencrypted) JSON body - same headers, retry, and result shape as
 * postEncrypted. Use for endpoints the OpenAPI spec documents as taking a plain request
 * DTO directly rather than EncryptedV2Request (read/query endpoints: query_apass,
 * download_travel_rule, validator/rules, ...).
 */
export async function postPlain(
  path: string,
  body: unknown,
  { apiId }: { apiId: string }
): Promise<CleanverseResult> {
  return withTransient500Retry(() => sendOnce(path, body, apiId));
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function cleanverseCredentials() {
  return {
    apiId: requireEnv("CLEANVERSE_API_ID"),
    apiKey: requireEnv("CLEANVERSE_API_KEY"),
  };
}

/**
 * Cleanverse error messages carry internal bracketed codes ("[CV_500]CV System error",
 * "[400]Invalid idType ...") meant for their own logs, not end users. Strips the code and
 * falls back to a calm generic message whenever what's left still reads as an internal/
 * system failure rather than genuinely actionable feedback.
 */
export function friendlyCleanverseError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const stripped = message.replace(/^\[[A-Za-z0-9_]+\]\s*/, "").trim();
  if (!stripped || /system error/i.test(stripped)) return fallback;
  return stripped;
}
