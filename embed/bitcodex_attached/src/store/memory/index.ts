import type {
  BitcodeXWalletMsgOpenModalAck,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { MemoryActions, MemoryState, ReferralInfo } from "./types";
import type { AppError } from "@bitcodex-attached/errors";
import { BITCODEX_SDK_TARGET } from "@bitcodex-attached/window_msgs/target";

const initialState: MemoryState = {
  hostOrigin: null,
  appName: "",
  storageKey: "",
  isMobileNative: false,
  apiKey: null,
  modalRequest: null,
  error: null,
  referralInfo: null,
  resolvedTheme: null,
};

export const useMemoryState = create(
  combine<MemoryState, MemoryActions>(initialState, (set, get) => ({
    setHostOrigin: (hostOrigin: string) => {
      set({ hostOrigin });
    },
    setAppName: (appName: string) => {
      set({ appName });
    },
    setStorageKey: (storageKey: string) => {
      set({ storageKey });
    },
    setIsMobileNative: (value: boolean) => {
      set({ isMobileNative: value });
    },
    setApiKey: (apiKey: string | null) => {
      set({ apiKey });
    },
    openModal: ({ port, msg }) => {
      if (msg.msg_type !== "open_modal") {
        return;
      }

      set((_prev) => {
        return {
          modalRequest: {
            port,
            msg,
          },
        };
      });
    },
    closeModal: (payload: OpenModalAckPayload) => {
      const modalRequest = get().modalRequest;
      if (modalRequest) {
        const { port } = modalRequest;

        const ack: BitcodeXWalletMsgOpenModalAck = {
          target: BITCODEX_SDK_TARGET,
          msg_type: "open_modal_ack",
          payload,
        };

        port.postMessage(ack);

        set({ modalRequest: null });
      }
    },
    setError: (error: AppError) => {
      set({ error });
    },
    clearError: () => {
      set({ error: null });
    },
    setReferralInfo: (info: ReferralInfo) => {
      set({ referralInfo: info });
    },
    clearReferralInfo: () => {
      set({ referralInfo: null });
    },
    setResolvedTheme: (theme: "light" | "dark") => {
      set({ resolvedTheme: theme });
    },
  })),
);
