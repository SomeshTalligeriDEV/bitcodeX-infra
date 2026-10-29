export interface BitcodeXUser {
  id: string;
  created_at: string;
  linked_accounts: { type: string; email: string }[];
  wallets: { chain: "bittensor"; address: string | null }[];
}

export interface BitcodeXWallet {
  chain: "bittensor";
  address: string | null;
  public_key: string;
  key_type: string;
  created_at: string;
}

export class BitcodeXApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    msg: string,
  ) {
    super(`${code}: ${msg}`);
  }
}

export interface ServerClientOptions {
  apiUrl: string;
  appId: string;
  /** App secret from the developer dashboard. Server only: never ship it to a browser. */
  appSecret: string;
  /** Retries for these read-only calls (network errors, 429, 5xx). Default 3 attempts. */
  attempts?: number;
}

/** Server-to-server client (HTTP Basic: app ID + app secret). */
export function createServerClient(options: ServerClientOptions) {
  const base = options.apiUrl.replace(/\/+$/, "");
  const auth = `Basic ${Buffer.from(`${options.appId}:${options.appSecret}`).toString("base64")}`;
  const attempts = options.attempts ?? 3;

  async function get<T>(path: string): Promise<T> {
    let last: unknown = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(`${base}${path}`, {
          headers: { Authorization: auth },
        });
        const body = (await res.json().catch(() => null)) as
          | { success: true; data: T }
          | { success: false; code: string; msg: string }
          | null;
        if (body?.success) {
          return body.data;
        }
        const err = new BitcodeXApiError(
          body && !body.success ? body.code : "UNKNOWN_ERROR",
          res.status,
          body && !body.success ? body.msg : `HTTP ${res.status}`,
        );
        if (res.status !== 429 && res.status < 500) {
          throw err;
        }
        last = err;
      } catch (e) {
        if (
          e instanceof BitcodeXApiError &&
          e.status !== 429 &&
          e.status < 500
        ) {
          throw e;
        }
        last = e;
      }
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 300 * 4 ** i));
      }
    }
    throw last instanceof Error ? last : new Error(String(last));
  }

  return {
    getUser: (userId: string) =>
      get<BitcodeXUser>(`/server/v1/users/${encodeURIComponent(userId)}`),
    getWallets: (userId: string) =>
      get<BitcodeXWallet[]>(
        `/server/v1/users/${encodeURIComponent(userId)}/wallets`,
      ),
  };
}
