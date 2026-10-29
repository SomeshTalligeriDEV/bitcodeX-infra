import type { Pool } from "pg";

export interface UserRow {
  user_id: string;
  email: string;
  auth_type: string;
  created_at: Date;
}

export interface WalletRow {
  wallet_id: string;
  user_id: string;
  curve_type: string;
  public_key_hex: string;
  created_at: Date;
}

export async function getEd25519WalletById(
  db: Pool,
  walletId: string,
): Promise<WalletRow | null> {
  const r = await db.query(
    `SELECT wallet_id, user_id, curve_type, encode(public_key, 'hex') AS public_key_hex, created_at
     FROM bitcodex_wallets WHERE wallet_id = $1 AND curve_type = 'ed25519'`,
    [walletId],
  );
  return r.rows[0] ?? null;
}

/** The user, only if they have signed in to an app of this customer. */
export async function getUserForCustomer(
  db: Pool,
  customerId: string,
  userId: string,
): Promise<UserRow | null> {
  const r = await db.query(
    `SELECT u.user_id, u.email, u.auth_type, u.created_at
     FROM bitcodex_users u
     JOIN bitcodex_user_customer_connections c ON c.user_id = u.user_id
     WHERE c.customer_id = $1 AND u.user_id = $2`,
    [customerId, userId],
  );
  return r.rows[0] ?? null;
}

export async function getEd25519Wallets(
  db: Pool,
  userId: string,
): Promise<WalletRow[]> {
  const r = await db.query(
    `SELECT wallet_id, user_id, curve_type, encode(public_key, 'hex') AS public_key_hex, created_at
     FROM bitcodex_wallets WHERE user_id = $1 AND curve_type = 'ed25519' ORDER BY created_at`,
    [userId],
  );
  return r.rows;
}
