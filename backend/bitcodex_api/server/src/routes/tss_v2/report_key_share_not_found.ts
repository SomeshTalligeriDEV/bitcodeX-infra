import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  ReportKeyShareNotFoundBody,
  ReportKeyShareNotFoundResponse,
} from "@bitcodex/bitcodex-types/user";
import type { Response } from "express";

import { reportKeyShareNotFoundV2 } from "@bitcodex-api/api/tss/v2/user";
import type { UserAuthenticatedRequest } from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

export async function reportKeyShareNotFound(
  req: UserAuthenticatedRequest<ReportKeyShareNotFoundBody>,
  res: Response<BitcodeXApiResponse<ReportKeyShareNotFoundResponse>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  if (!body.nodes || body.nodes.length === 0) {
    res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      msg: "nodes array is required and cannot be empty",
    });
    return;
  }

  const result = await reportKeyShareNotFoundV2(
    state.db,
    {
      wallet_id_secp256k1: user.wallet_id_secp256k1,
      wallet_id_ed25519: user.wallet_id_ed25519,
      nodes: body.nodes,
    },
    state.logger,
  );

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json({
    success: true,
    data: result.data,
  });
}
