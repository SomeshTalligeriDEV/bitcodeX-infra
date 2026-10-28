import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { ValidateInvitationRequest } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Request, Response } from "express";
import { z } from "zod";

import { validateTeamInvitation } from "@bitcodex-ctd-api/api/team_invitation";

const ValidateInvitationRequestSchema = registry.register(
  "ValidateInvitationRequest",
  z.object({
    token: z.string().openapi({
      description: "Invitation token from email link",
    }),
  }),
);

const ValidateInvitationSuccessResponseSchema = registry.register(
  "ValidateInvitationSuccessResponse",
  z.object({
    success: z.literal(true),
    data: z.object({
      email: z.string(),
      role: z.string(),
      team_name: z.string(),
    }),
  }),
);

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/team/validate_invitation",
  tags: ["Customer Dashboard - Team"],
  summary: "Validate invitation token",
  description:
    "Validates an invitation token without accepting it. Used to show the invite accept page.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ValidateInvitationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation is valid",
      content: {
        "application/json": {
          schema: ValidateInvitationSuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Invitation not found",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    410: {
      description: "Invitation expired",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

export async function validateInvitation(
  req: Request<unknown, unknown, ValidateInvitationRequest>,
  res: Response<BitcodeXApiResponse<unknown>>,
) {
  const state = req.app.locals;

  const result = await validateTeamInvitation(state.db, req.body);

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
