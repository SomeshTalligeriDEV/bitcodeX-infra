/**
 * Key share node URLs are stored once and used by the browser AND by this server. In a
 * container deployment the public URL (e.g. http://localhost:4201) is not reachable from
 * inside the API container, so server-side calls go through this map:
 *   BITCODEX_KSN_INTERNAL_URLS="http://localhost:4201=http://ksn1:4201,http://localhost:4202=http://ksn2:4202"
 * Unset (local dev, or one public URL for both): URLs are used as stored.
 */
let parsed: Map<string, string> | null = null;

function map(): Map<string, string> {
  if (parsed) {
    return parsed;
  }
  parsed = new Map();
  for (const pair of (process.env.BITCODEX_KSN_INTERNAL_URLS ?? "").split(
    ",",
  )) {
    const [from, to] = pair.split("=").map((s) => s.trim().replace(/\/+$/, ""));
    if (from && to) {
      parsed.set(from, to);
    }
  }
  return parsed;
}

export function internalKsnUrl(publicUrl: string): string {
  const key = publicUrl.replace(/\/+$/, "");
  return map().get(key) ?? publicUrl;
}
