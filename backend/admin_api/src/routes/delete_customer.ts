import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import {
  CustomerIdParamSchema,
  DeleteCustomerSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/bitcodex_admin";
import {
  AdminAuthHeaderSchema,
  ErrorResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/common";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  DeleteCustomerAndCustomerDashboardUsersRequest,
  DeleteCustomerAndCustomerDashboardUsersResponse,
} from "@bitcodex/bitcodex-types/customers";
import type { Response } from "express";

import { deleteCustomerAndUsers } from "@bitcodex-admin-api/api/customer";
import type { AuthenticatedAdminRequest } from "@bitcodex-admin-api/middleware/auth";

registry.registerPath({
  method: "post",
  path: "/bitcodex_admin/v1/customer/delete_customer/{customer_id}",
  tags: ["Admin"],
  summary: "Delete customer by ID",
  description: "Deletes a customer by customer ID",
  security: [{ adminAuth: [] }],
  request: {
    headers: AdminAuthHeaderSchema,
    params: CustomerIdParamSchema,
  },
  responses: {
    200: {
      description: "Customer deleted successfully",
      content: {
        "application/json": {
          schema: DeleteCustomerSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export async function delete_customer(
  req: AuthenticatedAdminRequest<DeleteCustomerAndCustomerDashboardUsersRequest>,
  res: Response<
    BitcodeXApiResponse<DeleteCustomerAndCustomerDashboardUsersResponse>
  >,
) {
  const state = req.app.locals;
  const { customer_id: customerId } = req.params;

  if (!customerId) {
    res.status(400).json({
      success: false,
      code: "MISSING_CUSTOMER_ID",
      msg: "Customer ID is required",
    });
    return;
  }

  const deleteCustomerAndUsersRes = await deleteCustomerAndUsers(
    state.db,
    customerId,
  );
  if (deleteCustomerAndUsersRes.success === false) {
    res
      .status(ErrorCodeMap[deleteCustomerAndUsersRes.code] ?? 500)
      .json(deleteCustomerAndUsersRes);
    return;
  }

  res.status(200).json({
    success: true,
    data: deleteCustomerAndUsersRes.data,
  });
  return;
}
