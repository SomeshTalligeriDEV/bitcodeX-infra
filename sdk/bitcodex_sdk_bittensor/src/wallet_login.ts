import type { BitcodeXWalletInterface } from "@bitcodex/bitcodex-sdk-core";
import { createSiwbMessage } from "@bitcodex/bittensor-chain";
import type { Signer } from "@polkadot/types/types";
import { stringToHex } from "@polkadot/util";

import { INJECTED_NAME } from "./inject";

export interface ExtensionAccount {
  address: string;
  name?: string;
  /** Extension id, e.g. "talisman", "subwallet-js", "polkadot-js". */
  source: string;
}

export interface WalletLoginResult {
  address: string;
  /** "wallet:<address>", or the BitcodeX user id when this wallet is linked to one. */
  userId: string;
  /** Access token for your backend (verify with @bitcodex/server). */
  accessToken: string;
  /** The extension's own polkadot.js Signer: the user keeps signing in their extension. */
  signer: Signer;
  source: string;
}

async function proxy(
  wallet: BitcodeXWalletInterface,
  action: "nonce" | "verify" | "link",
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await wallet.sendMsgToIframe({
    target: "bitcodex_attached",
    msg_type: "wallet_login",
    payload: { action, body },
  });
  if (res.msg_type !== "wallet_login_ack") {
    throw new Error("unexpected reply from BitcodeX");
  }
  if (!res.payload.success) {
    throw new Error(res.payload.err);
  }
  return res.payload.data;
}

/** Substrate extensions in this browser (Talisman, SubWallet, Polkadot.js…), not BitcodeX itself. */
export async function listExtensionAccounts(
  appName: string,
): Promise<ExtensionAccount[]> {
  const { web3Accounts, web3Enable } = await import("@polkadot/extension-dapp");
  const extensions = await web3Enable(appName);
  if (extensions.length === 0) {
    return [];
  }
  const accounts = await web3Accounts({ ss58Format: 42 });
  return accounts
    .filter((a) => a.meta.source !== INJECTED_NAME)
    .map((a) => ({
      address: a.address,
      name: a.meta.name,
      source: a.meta.source,
    }));
}

async function signSiwb(
  wallet: BitcodeXWalletInterface,
  account: ExtensionAccount,
  statement: string,
): Promise<{ message: string; signature: string; signer: Signer }> {
  const { web3FromSource } = await import("@polkadot/extension-dapp");
  const injector = await web3FromSource(account.source);
  if (!injector.signer.signRaw) {
    throw new Error(`${account.source} cannot sign messages`);
  }
  const n = await proxy(wallet, "nonce", { address: account.address });
  const issued = new Date();
  const msg = createSiwbMessage({
    domain: window.location.host,
    address: account.address,
    statement,
    uri: window.location.origin,
    version: "1",
    chainId: String(n.chain_id),
    nonce: String(n.nonce),
    issuedAt: issued.toISOString(),
    expirationTime: new Date(issued.getTime() + 10 * 60_000).toISOString(),
  });
  if (!msg.success) {
    throw new Error(msg.err);
  }
  // The extension shows its own confirmation and wraps the bytes in <Bytes>.
  const { signature } = await injector.signer.signRaw({
    address: account.address,
    data: stringToHex(msg.data),
    type: "bytes",
  });
  return { message: msg.data, signature, signer: injector.signer };
}

/** Privy-style "login with wallet": prove control of an extension account. */
export async function loginWithWallet(
  wallet: BitcodeXWalletInterface,
  account: ExtensionAccount,
): Promise<WalletLoginResult> {
  const signed = await signSiwb(
    wallet,
    account,
    `Sign in to ${window.location.host} with your wallet.`,
  );
  const v = await proxy(wallet, "verify", {
    message: signed.message,
    signature: signed.signature,
  });
  return {
    address: String(v.address),
    userId: String(v.user_id),
    accessToken: String(v.access_token),
    signer: signed.signer,
    source: account.source,
  };
}

/** Link an extension account to the signed-in BitcodeX user (shows in getUser). */
export async function linkExtensionWallet(
  wallet: BitcodeXWalletInterface,
  account: ExtensionAccount,
): Promise<{ address: string; status: string }> {
  const signed = await signSiwb(
    wallet,
    account,
    `Link this wallet to your account on ${window.location.host}.`,
  );
  const r = await proxy(wallet, "link", {
    message: signed.message,
    signature: signed.signature,
  });
  return { address: String(r.address), status: String(r.status) };
}
