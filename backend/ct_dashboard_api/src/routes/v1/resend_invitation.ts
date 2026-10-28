import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  CustomerAuthHeaderSchema,
  ResendInvitationRequestSchema,
  ResendInvitationSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { ResendInvitationRequest } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Response } from "express";

import { resendInvitationRequest } from "@bitcodex-ctd-api/api/team_invitation";
import type { CustomerAuthenticatedRequest } from "@bitcodex-ctd-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/team/resend_invitation",
  tags: ["Customer Dashboard - Team"],
  summary: "Resend team invitation",
  description: "Resends an invitation email (5-minute cooldown)",
  security: [{ customerAuth: [] }],
  request: {
    headers: CustomerAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: ResendInvitationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation resent successfully",
      content: {
        "application/json": {
          schema: ResendInvitationSuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Invitation not found",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    429: {
      description: "Resend cooldown not elapsed",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

export async function resendInvitation(
  req: CustomerAuthenticatedRequest<ResendInvitationRequest>,
  res: Response<BitcodeXApiResponse<unknown>>,
) {
  const state = req.app.locals;
  const { customer_id, label } = res.locals.team;

  const result = await resendInvitationRequest(
    state.db,
    req.body,
    { customer_id, label },
    {
      dapp_dashboard_url: state.dapp_dashboard_url,
      from_email: state.from_email,
      smtp_config: {
        smtp_host: state.smtp_host,
        smtp_port: state.smtp_port,
        smtp_user: state.smtp_user,
        smtp_pass: state.smtp_pass,
      },
    },
  );

  if (!result.success) {
    res.status(ErrorCodeMap[result.code] ?? 500).json(result);
    return;
  }

  res.status(200).json(result);
}
