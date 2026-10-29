import { BITCODEX_API_ENDPOINT } from "./endpoints";
import { fetchWithRetry } from "./retry";

export interface MfaStatus {
  enabled: boolean;
  /** rao as decimal string; null with enabled = every signature needs a code. */
  threshold_rao: string | null;
}

/** X12 (Preview): the user's MFA settings. Read-only, so retried. */
export async function getMfaStatus(session: string): Promise<MfaStatus | null> {
  try {
    const res = await fetchWithRetry(`${BITCODEX_API_ENDPOINT}/mfa/v1/status`, {
      headers: { Authorization: `Bearer ${session}` },
    });
    const body = await res.json();
    return body.success ? (body.data as MfaStatus) : null;
  } catch {
    return null;
  }
}

/** Check a TOTP code with the server (not retried: each attempt counts). */
export async function verifyMfaCode(
  session: string,
  code: string,
): Promise<string | null> {
  const res = await fetch(`${BITCODEX_API_ENDPOINT}/mfa/v1/totp/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ code }),
  });
  const body = await res.json().catch(() => null);
  return body?.success ? null : (body?.msg ?? `HTTP ${res.status}`);
}
