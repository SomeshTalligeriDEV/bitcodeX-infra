import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  CancelInvitationRequestSchema,
  CancelInvitationSuccessResponseSchema,
  CustomerAuthHeaderSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import {
  getTeamInvitationById,
  updatePendingInvitationStatus,
} from "@bitcodex/bitcodex-pg-interface/customer_team_invitations";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { CancelInvitationRequest } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Response } from "express";

import type { CustomerAuthenticatedRequest } from "@bitcodex-ctd-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/team/cancel_invitation",
  tags: ["Customer Dashboard - Team"],
  summary: "Cancel team invitation",
  description: "Cancels a pending team invitation",
  security: [{ customerAuth: [] }],
  request: {
    headers: CustomerAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: CancelInvitationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation cancelled successfully",
      content: {
        "application/json": {
          schema: CancelInvitationSuccessResponseSchema,
        },
      },
    },
    404: {
      description: "Invitation not found",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

export async function cancelInvitation(
  req: CustomerAuthenticatedRequest<CancelInvitationRequest>,
  res: Response<BitcodeXApiResponse<unknown>>,
) {
  try {
    const state = req.app.locals;
    const { customer_id: customerId } = res.locals.team;
    const { invitation_id } = req.body;

    const invitationRes = await getTeamInvitationById(
      state.db,
      invitation_id,
      customerId,
    );

    if (!invitationRes.success) {
      res.status(500).json({
        success: false,
        code: "UNKNOWN_ERROR",
        msg: invitationRes.err,
      });
      return;
    }

    if (invitationRes.data === null) {
      res.status(ErrorCodeMap.INVITATION_NOT_FOUND).json({
        success: false,
        code: "INVITATION_NOT_FOUND",
        msg: "Invitation not found",
      });
      return;
    }

    if (invitationRes.data.status !== "PENDING") {
      res.status(ErrorCodeMap.INVITATION_NOT_PENDING).json({
        success: false,
        code: "INVITATION_NOT_PENDING",
        msg: "Invitation is no longer pending",
      });
      return;
    }

    const cancelRes = await updatePendingInvitationStatus(
      state.db,
      invitation_id,
      "CANCELLED",
    );

    if (!cancelRes.success) {
      res.status(500).json({
        success: false,
        code: "UNKNOWN_ERROR",
        msg: "Failed to cancel invitation",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { invitation_id },
    });
    return;
  } catch (_error) {
    res.status(500).json({
      success: false,
      code: "UNKNOWN_ERROR",
      msg: "Internal server error",
    });
    return;
  }
}
