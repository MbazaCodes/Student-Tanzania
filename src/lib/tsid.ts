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

export type Role = "admin" | "gov" | "school" | "student";

export function roleHome(role: Role | null | undefined): string {
  if (role === "admin" || role === "gov") return "/gov";
  if (role === "school") return "/school";
  if (role === "student") return "/student";
  return "/auth";
}

/** SHA-256 hex (64-char) — matches DB password CHECK length=64 */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}