import type {
  MakeBittensorSigError,
  MakeBittensorSigResult,
  OpenModalAckPayload,
} from "@bitcodex/bitcodex-sdk-core";
import {
  type BittensorChainId,
  getApi,
  isBittensorChainId,
  NETWORKS,
  toAddress,
} from "@bitcodex/bittensor-chain";
import type { ApiPromise } from "@polkadot/api";
import { useEffect, useState } from "react";

import {
  extractKeyPackageHex,
  teddsaKeygenFromHex,
} from "@bitcodex-attached/crypto/keygen_ed25519";
import { makeSignOutputEd25519 } from "@bitcodex-attached/crypto/sign_ed25519";
import { isDemoOrSandboxOrigin } from "@bitcodex-attached/requests/endpoints";
import { useAppState } from "@bitcodex-attached/store/app";
import { useMemoryState } from "@bitcodex-attached/store/memory";

const MODAL_TYPE = "bittensor/make_signature" as const;

export interface UseBittensorSignatureArgs {
  modalId: string;
  hostOrigin: string;
  chainId: string;
  /** SS58 address the host says will sign; must be this wallet's address. */
  signer: string;
  getIsAborted: () => boolean;
}

export type ApiState =
  | { status: "loading" }
  | { status: "ready"; api: ApiPromise; chainId: BittensorChainId }
  | { status: "refused"; reason: string };

export function useBittensorSignature(args: UseBittensorSignatureArgs) {
  const { modalId, hostOrigin, chainId, signer, getIsAborted } = args;
  const { closeModal, setError } = useMemoryState();

  const storageKey = useMemoryState((state) => state.storageKey);
  const isMobileNative = useMemoryState((state) => state.isMobileNative);
  const mobileApiKey = useMemoryState((state) => state.apiKey);
  const theme = useAppState().getTheme(storageKey);
  const apiKey = useAppState().getApiKey(storageKey);
  const authToken = useAppState().getAuthToken(storageKey);
  const walletEd25519 = useAppState().getWalletEd25519(storageKey);
  const keyPackageEd25519 = useAppState().getKeyPackageEd25519(storageKey);

  const [isLoading, setIsLoading] = useState(false);
  const [apiState, setApiState] = useState<ApiState>({ status: "loading" });

  const addressRes = walletEd25519 ? toAddress(walletEd25519.publicKey) : null;
  const walletAddress = addressRes?.success ? addressRes.data : null;
  const signerMatches = !!walletAddress && walletAddress === signer;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isBittensorChainId(chainId)) {
        setApiState({
          status: "refused",
          reason: `Unknown network: ${chainId}`,
        });
        return;
      }
      const res = await getApi(chainId);
      if (cancelled) {
        return;
      }
      setApiState(
        res.success
          ? { status: "ready", api: res.data, chainId }
          : { status: "refused", reason: res.err },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [chainId]);

  const isDemo = isDemoOrSandboxOrigin(hostOrigin, {
    isMobileNative,
    apiKey: mobileApiKey,
  });
  const hasKeys =
    !!walletEd25519 && !!keyPackageEd25519 && !!apiKey && !!authToken;

  function onReject() {
    closeModal({ modal_type: MODAL_TYPE, modal_id: modalId, type: "reject" });
  }

  function emitError(error: MakeBittensorSigError) {
    setError({
      modal_type: MODAL_TYPE,
      modal_id: modalId,
      type: "error",
      error,
    });
  }

  function closeWithResult(sigResult: MakeBittensorSigResult) {
    const ack: OpenModalAckPayload = {
      modal_type: MODAL_TYPE,
      modal_id: modalId,
      type: "approve",
      data: { chain_type: "bittensor", sig_result: sigResult },
    };
    closeModal(ack);
  }

  /** FROST-sign exact bytes with the client share + server round trip. */
  async function signBytes(
    bytes: Uint8Array,
  ): Promise<{ success: true; signature: Uint8Array } | { success: false }> {
    if (!walletEd25519 || !keyPackageEd25519 || !apiKey || !authToken) {
      emitError({
        type: "unknown_error",
        error: "Missing ed25519 wallet, key package, API key, or auth token",
      });
      return { success: false };
    }
    const keyPackageRes = teddsaKeygenFromHex(
      extractKeyPackageHex(
        keyPackageEd25519,
        walletEd25519.publicKeyPackage,
        walletEd25519.publicKey,
      ),
    );
    if (!keyPackageRes.success) {
      emitError({ type: "unknown_error", error: keyPackageRes.err });
      return { success: false };
    }
    const sigRes = await makeSignOutputEd25519(
      bytes,
      {
        keyPackage: keyPackageRes.data.key_package,
        publicKeyPackage: keyPackageRes.data.public_key_package,
        identifier: keyPackageRes.data.identifier,
      },
      apiKey,
      authToken,
      getIsAborted,
    );
    if (!sigRes.success) {
      emitError(sigRes.err);
      return { success: false };
    }
    return { success: true, signature: sigRes.data };
  }

  const networkName = isBittensorChainId(chainId)
    ? NETWORKS[chainId].name
    : chainId;

  return {
    authToken,
    apiState,
    networkName,
    walletAddress,
    signerMatches,
    hasKeys,
    isLoading,
    setIsLoading,
    isDemo,
    theme,
    onReject,
    emitError,
    closeWithResult,
    signBytes,
  };
}
