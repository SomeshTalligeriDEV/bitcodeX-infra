import type { Result } from "@bitcodex/stdlib-js";
import type { Pool, PoolClient } from "pg";

type Db = Pool | PoolClient;

export async function insertWalletLoginNonce(
  db: Db,
  nonce: string,
  address: string,
  appId: string,
  ttlSeconds: number,
): Promise<Result<null, string>> {
  try {
    await db.query(
      `INSERT INTO wallet_login_nonces (nonce, address, app_id, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(secs => $4))`,
      [nonce, address, appId, ttlSeconds],
    );
    return { success: true, data: null };
  } catch (e) {
    return { success: false, err: String(e) };
  }
}

/** Atomically consume a nonce: only an unused, unexpired nonce for this address+app. */
export async function consumeWalletLoginNonce(
  db: Db,
  nonce: string,
  address: string,
  appId: string,
): Promise<Result<boolean, string>> {
  try {
    const r = await db.query(
      `UPDATE wallet_login_nonces SET used_at = now()
       WHERE nonce = $1 AND address = $2 AND app_id = $3 AND used_at IS NULL AND expires_at > now()
       RETURNING nonce`,
      [nonce, address, appId],
    );
    return { success: true, data: (r.rowCount ?? 0) === 1 };
  } catch (e) {
    return { success: false, err: String(e) };
  }
}

export interface LinkedAccount {
  user_id: string;
  type: string;
  subject: string;
  created_at: Date;
}

export async function getUserIdForWallet(db: Db, address: string): Promise<string | null> {
  const r = await db.query(
    "SELECT user_id FROM linked_accounts WHERE type = 'wallet' AND subject = $1",
    [address],
  );
  return r.rows[0]?.user_id ?? null;
}

export async function linkWallet(
  db: Db,
  userId: string,
  address: string,
): Promise<Result<"linked" | "already_linked" | "linked_to_other_user", string>> {
  try {
    const existing = await getUserIdForWallet(db, address);
    if (existing === userId) {
      return { success: true, data: "already_linked" };
    }
    if (existing) {
      return { success: true, data: "linked_to_other_user" };
    }
    await db.query(
      "INSERT INTO linked_accounts (user_id, type, subject) VALUES ($1, 'wallet', $2)",
      [userId, address],
    );
    return { success: true, data: "linked" };
  } catch (e) {
    return { success: false, err: String(e) };
  }
}

export async function getLinkedAccounts(db: Db, userId: string): Promise<LinkedAccount[]> {
  const r = await db.query(
    "SELECT user_id, type, subject, created_at FROM linked_accounts WHERE user_id = $1 ORDER BY created_at",
    [userId],
  );
  return r.rows;
}
