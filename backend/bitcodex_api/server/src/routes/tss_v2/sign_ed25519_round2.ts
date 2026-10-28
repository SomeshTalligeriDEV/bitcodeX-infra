import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  SignEd25519Round2Body,
  SignEd25519Round2Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runSignEd25519Round2 } from "@bitcodex-api/api/tss/sign_ed25519";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v2/sign_ed25519/round2",
  tags: ["TSS"],
  summary: "Generate Ed25519 signature share (Round 2)",
  description: "Server generates signature share using collected commitments",
  security: [{ userAuth: [] }],
  request: {
    headers: UserAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              session_id: { type: "string" },
              commitments_1: {
                type: "object",
                properties: {
                  identifier: { type: "array", items: { type: "number" } },
                  commitments: { type: "array", items: { type: "number" } },
                },
              },
            },
            required: ["session_id", "commitments_1"],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully generated signature share",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  signature_share_0: {
                    type: "object",
                    properties: {
                      identifier: {
                        type: "array",
                        items: { type: "number" },
                      },
                      signature_share: {
                        type: "array",
                        items: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

export async function signEd25519Round2(
  req: UserAuthenticatedRequest<SignEd25519Round2Body>,
  res: Response<BitcodeXApiResponse<SignEd25519Round2Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const body = req.body;

  if (!user.wallet_id_ed25519) {
    res.status(401).json({
      success: false,
      code: "INVALID_REQUEST",
      msg: "Ed25519 wallet not available. Please create an Ed25519 wallet first.",
    });
    return;
  }

  const result = await runSignEd25519Round2(state.db, state.encryption_secret, {
    email: user.email,
    wallet_id: user.wallet_id_ed25519,
    session_id: body.session_id,
    commitments_1: body.commitments_1,
  });

  if (result.success === false) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  sendResponseWithNewToken(res, result.data);
}
