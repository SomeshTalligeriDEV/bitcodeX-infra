import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  ErrorResponseSchema,
  UserAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  SignEd25519Round1Body,
  SignEd25519Round1Response,
} from "@bitcodex/bitcodex-types/tss";
import type { Response } from "express";

import { runSignEd25519Round1 } from "@bitcodex-api/api/tss/sign_ed25519";
import {
  sendResponseWithNewToken,
  type UserAuthenticatedRequest,
} from "@bitcodex-api/middleware/auth/cosmos_compat_auth";

registry.registerPath({
  method: "post",
  path: "/tss/v2/sign_ed25519/round1",
  tags: ["TSS"],
  summary: "Generate Ed25519 signing commitments (Round 1)",
  description:
    "Server generates nonces and returns commitments for threshold signing",
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
              msg: { type: "array", items: { type: "number" } },
            },
            required: ["msg"],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully generated commitments",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  commitments_0: {
                    type: "object",
                    properties: {
                      identifier: {
                        type: "array",
                        items: { type: "number" },
                      },
                      commitments: {
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

export async function signEd25519Round1(
  req: UserAuthenticatedRequest<SignEd25519Round1Body>,
  res: Response<BitcodeXApiResponse<SignEd25519Round1Response>>,
) {
  const state = req.app.locals;
  const user = res.locals.user;
  const apiKey = res.locals.api_key;
  const body = req.body;

  if (!user.wallet_id_ed25519) {
    res.status(401).json({
      success: false,
      code: "INVALID_REQUEST",
      msg: "Ed25519 wallet not available. Please create an Ed25519 wallet first.",
    });
    return;
  }

  const result = await runSignEd25519Round1(state.db, state.encryption_secret, {
    email: user.email,
    wallet_id: user.wallet_id_ed25519,
    customer_id: apiKey.customer_id,
    msg: body.msg,
  });

  if (result.success === false) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  sendResponseWithNewToken(res, result.data);
}
