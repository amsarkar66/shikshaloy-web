import { webcrypto } from "node:crypto";

const crypto = webcrypto as Crypto;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const DEVICE_KEY_PREFIX = "adk_live_";

export function generateDeviceKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `${DEVICE_KEY_PREFIX}${toBase64Url(bytes)}`;
}

export function hashDeviceKey(key: string): Promise<string> {
  return sha256Hex(key);
}

export function deviceKeyPrefix(key: string): string {
  return key.slice(0, DEVICE_KEY_PREFIX.length + 6);
}
