import { webcrypto } from "node:crypto";

const crypto = webcrypto as Crypto;
const KEY_BYTE_LENGTH = 24;
const PREFIX = "pk_live_";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generatePublishKey(): string {
  const bytes = new Uint8Array(KEY_BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return `${PREFIX}${toBase64Url(bytes)}`;
}

export async function hashPublishKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function publishKeyPrefix(key: string): string {
  return key.slice(0, PREFIX.length + 6);
}
