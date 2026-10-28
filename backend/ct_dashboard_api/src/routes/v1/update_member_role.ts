import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  CustomerAuthHeaderSchema,
  UpdateMemberRoleRequestSchema,
  UpdateMemberRoleSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/ct_dashboard";
import {
  getCTDUserByUserIdAndCustomerId,
  updateCTDUserRole,
} from "@bitcodex/bitcodex-pg-interface/customer_dashboard_users";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type { UpdateMemberRoleRequest } from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Response } from "express";

import type { CustomerAuthenticatedRequest } from "@bitcodex-ctd-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/customer_dashboard/v1/customer/team/update_member_role",
  tags: ["Customer Dashboard - Team"],
  summary: "Update team member role",
  description: "Changes the role of a team member (admin only)",
  security: [{ customerAuth: [] }],
  request: {
    headers: CustomerAuthHeaderSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: UpdateMemberRoleRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role updated successfully",
      content: {
        "application/json": {
          schema: UpdateMemberRoleSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Cannot change own role",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: "Team member not found",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

export async function updateMemberRole(
  req: CustomerAuthenticatedRequest<UpdateMemberRoleRequest>,
  res: Response<BitcodeXApiResponse<unknown>>,
) {
  try {
    const state = req.app.locals;
    const currentUserId = res.locals.user_id;
    const { customer_id: customerId } = res.locals.team;
    const { user_id, role } = req.body;

    if (role !== "admin" && role !== "member") {
      res.status(ErrorCodeMap.INVALID_REQUEST).json({
        success: false,
        code: "INVALID_REQUEST",
        msg: "Role must be 'admin' or 'member'",
      });
      return;
    }

    if (user_id === currentUserId) {
      res.status(ErrorCodeMap.CANNOT_CHANGE_OWN_ROLE).json({
        success: false,
        code: "CANNOT_CHANGE_OWN_ROLE",
        msg: "Cannot change your own role",
      });
      return;
    }

    const memberRes = await getCTDUserByUserIdAndCustomerId(
      state.db,
      user_id,
      customerId,
    );

    if (!memberRes.success) {
      res.status(500).json({
        success: false,
        code: "UNKNOWN_ERROR",
        msg: memberRes.err,
      });
      return;
    }

    if (memberRes.data === null) {
      res.status(ErrorCodeMap.TEAM_MEMBER_NOT_FOUND).json({
        success: false,
        code: "TEAM_MEMBER_NOT_FOUND",
        msg: "Team member not found",
      });
      return;
    }

    const updateRes = await updateCTDUserRole(
      state.db,
      user_id,
      customerId,
      role,
    );

    if (!updateRes.success) {
      res.status(500).json({
        success: false,
        code: "UNKNOWN_ERROR",
        msg: updateRes.err,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user_id, role },
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
