import type { BitcodeXCoreAction, BitcodeXCoreState } from "./types";

export const initialCoreState: BitcodeXCoreState = {
  wallet: null,
  isReady: false,
  authType: null,
  email: null,
  publicKey: null,
  name: null,
};

export function coreReducer(
  state: BitcodeXCoreState,
  action: BitcodeXCoreAction,
): BitcodeXCoreState {
  switch (action.type) {
    case "INIT_SUCCESS":
      return {
        ...state,
        wallet: action.wallet,
      };

    case "READY":
      return {
        ...state,
        isReady: true,
        authType: action.state.authType,
        email: action.state.email,
        publicKey: action.state.publicKey,
        name: action.state.name,
      };

    case "ACCOUNTS_CHANGED":
      return {
        ...state,
        authType: action.authType,
        email: action.email,
        publicKey: action.publicKey,
        name: action.name,
      };

    default:
      return state;
  }
}
