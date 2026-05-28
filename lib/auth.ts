/**
 * HMAC-based session management using the Web Crypto API.
 * Compatible with both Edge runtime (middleware) and Node.js runtime (API routes).
 *
 * Session token format: "<timestamp>.<hmac_signature>"
 * - timestamp: Date.now() when the session was created
 * - hmac_signature: HMAC-SHA256(timestamp, SESSION_SECRET), base64url encoded
 */

export const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET environment variable is not set.");
  return secret;
}

function uint8ToBase64Url(arr: Uint8Array): string {
  return btoa(Array.from(arr, (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64UrlToUint8(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  const binary = atob(padded);
  return new Uint8Array(Array.from(binary, (c) => c.charCodeAt(0)));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return uint8ToBase64Url(new Uint8Array(sig));
}

async function verify(payload: string, sig: string): Promise<boolean> {
  try {
    const key = await importKey(getSecret());
    const sigBytes = base64UrlToUint8(sig);
    // Copy to a plain ArrayBuffer to satisfy strict crypto.subtle.verify typing
    const sigBuffer = sigBytes.buffer.slice(
      sigBytes.byteOffset,
      sigBytes.byteOffset + sigBytes.byteLength
    ) as ArrayBuffer;
    return crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

/** Creates a new signed session token. */
export async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const sig = await sign(timestamp);
  return `${timestamp}.${sig}`;
}

/** Validates a session token. Returns false if expired or tampered. */
export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;

    const timestamp = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const age = Date.now() - parseInt(timestamp, 10);
    if (isNaN(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;

    return verify(timestamp, sig);
  } catch {
    return false;
  }
}
