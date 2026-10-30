// X12 (Preview): TOTP before signing above a limit. The BitcodeX iframe asks for a code
// and verifies it here before it signs; server co-signing does not check MFA yet.
import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import { decryptDataAsync, encryptDataAsync } from "@bitcodex/crypto-js/node";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { getEd25519WalletById } from "@bitcodex-api/access_token/users";
import {
  base32Decode,
  newTotpSecret,
  otpauthUri,
  verifyTotp,
} from "@bitcodex-api/mfa/totp";
import { userJwtMiddlewareV2 } from "@bitcodex-api/middleware/auth/cosmos_compat_auth";
import { rateLimitMiddleware } from "@bitcodex-api/middleware/rate_limit";

for (const [path, summary] of [
  ["/mfa/v1/status", "Is TOTP on, and the signing limit"],
  ["/mfa/v1/totp/enroll", "Start TOTP enrollment (secret + otpauth URI)"],
  ["/mfa/v1/totp/confirm", "Confirm enrollment with a first code"],
  ["/mfa/v1/totp/verify", "Check a code (used by the iframe before signing)"],
  ["/mfa/v1/threshold", "Set the TAO amount that needs a code (needs a code)"],
  ["/mfa/v1/disable", "Turn TOTP off (needs a code)"],
] as const) {
  registry.registerPath({
    method: "post",
    path,
    tags: ["MFA (Preview)"],
    summary,
    responses: {
      200: { description: "OK" },
      401: {
        description: "No session or wrong code",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
      429: {
        description: "Too many attempts",
        content: { "application/json": { schema: ErrorResponseSchema } },
      },
    },
  });
}

const fail = (res: Response, code: keyof typeof ErrorCodeMap, msg: string) =>
  res.status(ErrorCodeMap[code]).json({ success: false, code, msg });

// Per-user lockout on wrong codes (6 digits are brute-forceable without it).
const failures = new Map<string, number[]>();
const WINDOW_MS = 5 * 60_000;
const MAX_FAILS = 5;
function lockedOut(userId: string): boolean {
  const now = Date.now();
  const recent = (failures.get(userId) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  failures.set(userId, recent);
  return recent.length >= MAX_FAILS;
}
const noteFailure = (userId: string) =>
  failures.set(userId, [...(failures.get(userId) ?? []), Date.now()]);

async function resolveUser(req: Request, res: Response, next: NextFunction) {
  const walletId = res.locals.user?.wallet_id_ed25519;
  const wallet = walletId
    ? await getEd25519WalletById(req.app.locals.db, walletId)
    : null;
  if (!wallet) {
    return fail(res, "WALLET_NOT_FOUND", "sign in with BitcodeX first");
  }
  res.locals.mfaUserId = wallet.user_id;
  next();
  return undefined;
}

async function row(req: Request, userId: string) {
  const r = await req.app.locals.db.query(
    "SELECT * FROM user_mfa WHERE user_id = $1",
    [userId],
  );
  return r.rows[0] as
    | {
        totp_secret_enc: string;
        enabled: boolean;
        threshold_rao: string | null;
      }
    | undefined;
}

async function checkCode(
  req: Request,
  res: Response,
  userId: string,
  requireEnabled: boolean,
): Promise<boolean> {
  if (lockedOut(userId)) {
    fail(res, "RATE_LIMIT_EXCEEDED", "too many wrong codes; wait 5 minutes");
    return false;
  }
  const r = await row(req, userId);
  if (!r || (requireEnabled && !r.enabled)) {
    fail(res, "INVALID_REQUEST", "TOTP is not set up");
    return false;
  }
  const secret = base32Decode(
    await decryptDataAsync(r.totp_secret_enc, req.app.locals.encryption_secret),
  );
  if (!verifyTotp(secret, String(req.body?.code ?? ""))) {
    noteFailure(userId);
    fail(res, "INVALID_VERIFICATION_CODE", "wrong or expired code");
    return false;
  }
  failures.delete(userId);
  return true;
}

export function makeMfaRouterV1() {
  const router = express.Router();
  router.use(rateLimitMiddleware({ windowSeconds: 60, maxRequests: 20 }));
  router.use(userJwtMiddlewareV2, resolveUser);

  router.post("/status", async (req, res) => {
    const r = await row(req, res.locals.mfaUserId);
    res.json({
      success: true,
      data: {
        enabled: !!r?.enabled,
        threshold_rao: r?.enabled ? (r.threshold_rao ?? null) : null,
      },
    });
  });

  router.post("/totp/enroll", async (req, res) => {
    const userId = res.locals.mfaUserId as string;
    const r = await row(req, userId);
    if (r?.enabled) {
      return fail(
        res,
        "INVALID_REQUEST",
        "TOTP is already on; disable it first",
      );
    }
    const secret = newTotpSecret();
    const enc = await encryptDataAsync(
      secret,
      req.app.locals.encryption_secret,
    );
    await req.app.locals.db.query(
      `INSERT INTO user_mfa (user_id, totp_secret_enc, enabled) VALUES ($1, $2, false)
       ON CONFLICT (user_id) DO UPDATE SET totp_secret_enc = $2, enabled = false, updated_at = now()`,
      [userId, enc],
    );
    return res.json({
      success: true,
      data: {
        secret,
        otpauth_uri: otpauthUri(secret, res.locals.user?.email ?? userId),
      },
    });
  });

  router.post("/totp/confirm", async (req, res) => {
    const userId = res.locals.mfaUserId as string;
    if (!(await checkCode(req, res, userId, false))) {
      return undefined;
    }
    await req.app.locals.db.query(
      "UPDATE user_mfa SET enabled = true, updated_at = now() WHERE user_id = $1",
      [userId],
    );
    return res.json({ success: true, data: { enabled: true } });
  });

  router.post("/totp/verify", async (req, res) => {
    if (!(await checkCode(req, res, res.locals.mfaUserId, true))) {
      return undefined;
    }
    return res.json({ success: true, data: { ok: true } });
  });

  router.post("/threshold", async (req, res) => {
    const userId = res.locals.mfaUserId as string;
    const raw = req.body?.threshold_rao;
    if (raw !== null && !(typeof raw === "string" && /^\d{1,30}$/.test(raw))) {
      return fail(
        res,
        "INVALID_REQUEST",
        "threshold_rao must be a decimal string of rao, or null (always)",
      );
    }
    if (!(await checkCode(req, res, userId, true))) {
      return undefined;
    }
    await req.app.locals.db.query(
      "UPDATE user_mfa SET threshold_rao = $2, updated_at = now() WHERE user_id = $1",
      [userId, raw],
    );
    return res.json({ success: true, data: { threshold_rao: raw } });
  });

  router.post("/disable", async (req, res) => {
    const userId = res.locals.mfaUserId as string;
    if (!(await checkCode(req, res, userId, true))) {
      return undefined;
    }
    await req.app.locals.db.query("DELETE FROM user_mfa WHERE user_id = $1", [
      userId,
    ]);
    return res.json({ success: true, data: { enabled: false } });
  });

  return router;
}
