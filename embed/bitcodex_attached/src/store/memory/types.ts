import type {
  BitcodeXWalletMsgOpenModal,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";

import type { AppError } from "@bitcodex-attached/errors";

export interface ModalRequest {
  port: MessagePort;
  msg: BitcodeXWalletMsgOpenModal;
}

export interface ReferralInfo {
  origin: string;
  utmSource: string | null;
  utmCampaign: string | null;
}

export interface MemoryState {
  hostOrigin: string | null;
  appName: string;
  storageKey: string;
  isMobileNative: boolean;
  apiKey: string | null;
  modalRequest: ModalRequest | null;
  error: AppError | null;
  referralInfo: ReferralInfo | null;
  resolvedTheme: "light" | "dark" | null;
}

export interface MemoryActions {
  setHostOrigin: (hostOrigin: string) => void;
  setAppName: (appName: string) => void;
  setStorageKey: (storageKey: string) => void;
  setIsMobileNative: (value: boolean) => void;
  setApiKey: (apiKey: string | null) => void;
  openModal: (req: ModalRequest) => void;
  closeModal: (payload: OpenModalAckPayload) => void;
  setError: (error: AppError) => void;
  clearError: () => void;
  setReferralInfo: (info: ReferralInfo) => void;
  clearReferralInfo: () => void;
  setResolvedTheme: (theme: "light" | "dark") => void;
}
