import { makeBitcodeXAdminRouter } from "@bitcodex/admin-api";
import { makeCustomerRouter } from "@bitcodex/ct-dashboard-api";
import { makeUserRouter } from "@bitcodex/user-dashboard-api";
import type { Express } from "express";

import { mountAccessTokenRoutes } from "./access_token_v1";
import { makeAppConfigRouterV1 } from "./app_config_v1";
import { makeFaucetRouterV1 } from "./faucet_v1";
import { getStatus } from "./get_status";
import { makeLogRouterV1 } from "./log_v1";
import { makeServerRouterV1 } from "./server_v1";
import { makeSocialLoginRouter } from "./social_login_v1";
import { makeSocialLoginV2Router } from "./social_login_v2";
import { makeTSSRouterV1 } from "./tss_v1";
import { makeTSSRouterV2 } from "./tss_v2";
import { makeWalletLoginRouterV1 } from "./wallet_login_v1";

export function setRoutes(app: Express) {
  app.use("/customer_dashboard/v1", makeCustomerRouter());

  app.use("/bitcodex_admin/v1", makeBitcodeXAdminRouter());

  app.use("/tss/v1", makeTSSRouterV1());

  app.use("/tss/v2", makeTSSRouterV2());

  app.use("/user_dashboard/v1", makeUserRouter());

  app.use("/log/v1", makeLogRouterV1());

  app.use("/social-login/v1", makeSocialLoginRouter());

  app.use("/social-login/v2", makeSocialLoginV2Router());

  app.use("/faucet/v1", makeFaucetRouterV1());

  app.use("/app_config/v1", makeAppConfigRouterV1());

  mountAccessTokenRoutes(app);

  app.use("/server/v1", makeServerRouterV1());

  app.use("/wallet_login/v1", makeWalletLoginRouterV1());

  app.get("/status", getStatus);
}
