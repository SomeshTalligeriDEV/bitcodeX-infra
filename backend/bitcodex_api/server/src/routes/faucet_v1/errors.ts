import type { BitcodeXApiErrorResponse } from "@bitcodex/bitcodex-types/api_response";

import type { FaucetError } from "@bitcodex-api/faucet";

export const FAUCET_DISABLED: BitcodeXApiErrorResponse = {
  success: false,
  code: "FAUCET_DISABLED",
  msg: "The faucet is off (localnet only; set BITCODEX_FAUCET_SURI)",
};

export function faucetErrorResponse(
  err: FaucetError,
): BitcodeXApiErrorResponse {
  switch (err.code) {
    case "INVALID_ADDRESS":
      return { success: false, code: "INVALID_REQUEST", msg: err.msg };
    case "RATE_LIMITED":
      return { success: false, code: "RATE_LIMIT_EXCEEDED", msg: err.msg };
    case "NETWORK_REFUSED":
      return { success: false, code: "FAUCET_NETWORK_REFUSED", msg: err.msg };
    case "TX_FAILED":
      return { success: false, code: "FAUCET_TX_FAILED", msg: err.msg };
  }
}
