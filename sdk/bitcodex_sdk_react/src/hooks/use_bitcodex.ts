import type { SignInModalOverrides } from "@bitcodex/bitcodex-sdk-core";
import { useCallback, useContext } from "react";

import { BitcodeXContext } from "../context";
import type {
  BitcodeXWalletTheme,
  SignInType,
  UseBitcodeXReturn,
} from "../types";

export function useBitcodeX(): UseBitcodeXReturn {
  const { state } = useContext(BitcodeXContext);

  const signIn = useCallback(
    async (type: SignInType) => {
      if (!state.wallet) {
        throw new Error(
          "[bitcodex-react] Cannot signIn: wallet not initialized",
        );
      }
      await state.wallet.signIn(type);
    },
    [state.wallet],
  );

  const signOut = useCallback(async () => {
    if (!state.wallet) {
      throw new Error(
        "[bitcodex-react] Cannot signOut: wallet not initialized",
      );
    }
    await state.wallet.signOut();
  }, [state.wallet]);

  const openSignInModal = useCallback(
    async (options?: SignInModalOverrides) => {
      if (!state.wallet) {
        throw new Error(
          "[bitcodex-react] Cannot openSignInModal: wallet not initialized",
        );
      }
      await state.wallet.openSignInModal(options);
    },
    [state.wallet],
  );

  const setTheme = useCallback(
    async (theme: BitcodeXWalletTheme) => {
      if (!state.wallet) {
        throw new Error(
          "[bitcodex-react] Cannot setTheme: wallet not initialized",
        );
      }
      await state.wallet.setTheme(theme);
    },
    [state.wallet],
  );

  return {
    wallet: state.wallet,
    isReady: state.isReady,
    isSignedIn: state.publicKey !== null,
    authType: state.authType,
    email: state.email,
    name: state.name,
    publicKey: state.publicKey,
    signIn,
    signOut,
    openSignInModal,
    setTheme,
  };
}
