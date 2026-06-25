import tsidLogo from "@/assets/tsid-logo.png.asset.json";
import tzFlag from "@/assets/tz-flag.png.asset.json";
import tzCoat from "@/assets/tz-coat.png.asset.json";

export const ASSETS = {
  logo: tsidLogo.url,
  flag: tzFlag.url,
  coat: tzCoat.url,
};

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateTsidNo() {
  const year = new Date().getFullYear().toString();
  let suffix = "";
  for (let i = 0; i < 7; i++) suffix += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  return `TSID-${year}-${suffix}`;
}

export type Role = "admin" | "gov" | "gov_region" | "gov_district" | "school" | "student";

/** Admin levels that use the /gov portal */
export const GOV_ROLES: Role[] = ["admin", "gov", "gov_region", "gov_district"];

export function isGovRole(role: Role | null | undefined): boolean {
  return !!role && GOV_ROLES.includes(role);
}

/** Scope tier: 0 = national, 1 = regional, 2 = district */
export function adminTier(role: Role | null | undefined): 0 | 1 | 2 | null {
  if (role === "admin" || role === "gov") return 0;
  if (role === "gov_region") return 1;
  if (role === "gov_district") return 2;
  return null;
}

export function roleHome(role: Role | null | undefined): string {
  if (isGovRole(role)) return "/gov";
  if (role === "school") return "/school";
  if (role === "student") return "/student";
  return "/auth";
}

/**
 * PBKDF2-SHA256 password hash (browser-native Web Crypto).
 * Returns a "$pbkdf2$" prefixed string containing the base64 salt and hash,
 * safe to store in the DB password column.
 *
 * Format: $pbkdf2$<iterations>$<base64-salt>$<base64-hash>
 * e.g.   $pbkdf2$100000$abc123==$xyz456==
 *
 * Use hashPassword() to create, verifyPassword() to check.
 */
async function pbkdf2Hash(password: string, salt: Uint8Array, iterations = 100_000): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf)));
}

function fromB64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Hash a plain-text password. Returns the storable string. */
export async function hashPassword(password: string, iterations = 100_000): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hash(password, salt, iterations);
  return `$pbkdf2$${iterations}$${toB64(salt)}$${toB64(hash)}`;
}

/** Verify a plain-text password against a stored hash string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    // parts: ["", "pbkdf2", iterations, salt, hash]
    if (parts.length !== 5 || parts[1] !== "pbkdf2") return false;
    const iterations = parseInt(parts[2], 10);
    const salt = fromB64(parts[3]);
    const expectedHash = fromB64(parts[4]);
    const actualHash = new Uint8Array(await pbkdf2Hash(password, salt, iterations));
    // Constant-time comparison
    if (actualHash.length !== expectedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHash.length; i++) diff |= actualHash[i] ^ expectedHash[i];
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * @deprecated Use hashPassword() instead. Kept temporarily so old DB rows
 * (SHA-256 format, 64-char hex) can still be detected during a migration period.
 * Remove once all passwords have been re-hashed.
 */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}