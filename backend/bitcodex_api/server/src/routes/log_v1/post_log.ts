import { ErrorCodeMap } from "@bitcodex/bitcodex-api-error-codes";
import { registry } from "@bitcodex/bitcodex-api-openapi";
import { ErrorResponseSchema } from "@bitcodex/bitcodex-api-openapi/common";
import {
  PostLogRequestSchema,
  PostLogSuccessResponseSchema,
} from "@bitcodex/bitcodex-api-openapi/log";
import type { BitcodeXApiResponse } from "@bitcodex/bitcodex-types/api_response";
import type {
  PostLogBody,
  PostLogResponse,
} from "@bitcodex/bitcodex-types/log";
import type { Request, Response } from "express";

import { ingestLog } from "@bitcodex-api/api/log";

registry.registerPath({
  method: "post",
  path: "/log/v1",
  tags: ["Log"],
  summary: "Ingest client log",
  description: "Ingests client log payload for storage",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: PostLogRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Log ingested successfully",
      content: {
        "application/json": {
          schema: PostLogSuccessResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid log payload",
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

export async function postLog(
  req: Request<any, any, PostLogBody>,
  res: Response<BitcodeXApiResponse<PostLogResponse>>,
) {
  const logger = req.app.locals.logger;

  const ingestLogRes = ingestLog(req.body, logger);
  if (ingestLogRes.success === false) {
    return res.status(ErrorCodeMap[ingestLogRes.code]).json(ingestLogRes);
  }
  return res.status(200).json({
    success: true,
    data: ingestLogRes.data,
  });
}
