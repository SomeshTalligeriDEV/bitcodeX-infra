/**
 * Retries for READ-ONLY requests only (GETs such as app config). Signing and keygen
 * calls are one-shot commit-reveal steps: replaying one could repeat a step the server
 * already ran, so they are never retried here.
 * Retries on network errors, 429 and 5xx, with exponential backoff (honours Retry-After).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  {
    attempts = 3,
    baseDelayMs = 300,
  }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  if (init.method && init.method.toUpperCase() !== "GET") {
    throw new Error("fetchWithRetry is for GET requests only");
  }
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status !== 429 && res.status < 500) {
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
      const retryAfter = Number(res.headers.get("Retry-After"));
      if (i < attempts - 1) {
        await sleep(
          Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 10_000)
            : baseDelayMs * 4 ** i,
        );
      }
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await sleep(baseDelayMs * 4 ** i);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
