import {
  BitcodeXWallet,
  type BitcodeXWalletInterface,
  type BittensorSignerPayloadJSON,
} from "@bitcodex/bitcodex-sdk-core";
import { type EventRecordLike, toAddress } from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type {
  Signer,
  SignerPayloadJSON,
  SignerPayloadRaw,
  SignerResult,
} from "@polkadot/types/types";
import { isHex, stringToHex, u8aToHex } from "@polkadot/util";

import { BittensorWalletEventEmitter } from "./emitter";
import { requestSignature } from "./make_signature";
import { extrinsicOutcome } from "./outcome";
import type {
  BitcodeXBittensorInitArgs,
  BitcodeXBittensorInitError,
  BitcodeXBittensorState,
  BittensorWalletEvent,
  BittensorWalletEventHandler,
  SendResult,
} from "./types";

export class BitcodeXBittensorWallet {
  readonly bitcodexWallet: BitcodeXWalletInterface;
  readonly state: BitcodeXBittensorState;
  readonly waitUntilInitialized: Promise<void>;
  /** polkadot.js `Signer`: pass as `{ signer }` to `signAndSend`. */
  readonly signer: Signer;
  connecting = false;

  private readonly emitter = new BittensorWalletEventEmitter();
  private signId = 0;

  static init(
    args: BitcodeXBittensorInitArgs,
  ): Result<BitcodeXBittensorWallet, BitcodeXBittensorInitError> {
    const coreRes = BitcodeXWallet.init(args);
    if (!coreRes.success) {
      return {
        success: false,
        err: {
          type: "bitcodex_bittensor_wallet_init_fail",
          msg: String(coreRes.err),
        },
      };
    }
    return {
      success: true,
      data: new BitcodeXBittensorWallet(coreRes.data, args.chain_id),
    };
  }

  constructor(
    bitcodexWallet: BitcodeXWalletInterface,
    chainId: BitcodeXBittensorState["chainId"],
  ) {
    this.bitcodexWallet = bitcodexWallet;
    this.state = { address: null, publicKeyRaw: null, chainId };
    this.signer = {
      signPayload: (payload) => this.signPayload(payload),
      signRaw: (raw) => this.signRaw(raw),
    };
    bitcodexWallet.on({
      type: "CORE__accountsChanged",
      handler: this.onCoreAccountsChanged,
    });
    this.waitUntilInitialized = this.lazyInit();
  }

  get address(): string | null {
    return this.state.address;
  }

  get connected(): boolean {
    return this.state.address !== null;
  }

  on<K extends BittensorWalletEvent>(
    event: K,
    handler: BittensorWalletEventHandler<K>,
  ): void {
    this.emitter.on(event, handler);
  }

  off<K extends BittensorWalletEvent>(
    event: K,
    handler: BittensorWalletEventHandler<K>,
  ): void {
    this.emitter.off(event, handler);
  }

  /** Address of the signed-in user's coldkey. Throws when not signed in. */
  async connect(): Promise<string> {
    if (this.state.address) {
      return this.state.address;
    }
    this.connecting = true;
    try {
      await this.waitUntilInitialized;
      const address = await this.loadAddress();
      if (!address) {
        throw new Error("No BitcodeX wallet. Please sign in first.");
      }
      this.emitter.emit("connect", address);
      return address;
    } finally {
      this.connecting = false;
    }
  }

  async getAddress(): Promise<string | null> {
    await this.waitUntilInitialized;
    return this.state.address ?? this.loadAddress();
  }

  async disconnect(): Promise<void> {
    await this.bitcodexWallet.signOut();
    this.setAccount(null, null);
    this.emitter.emit("disconnect");
  }

  /**
   * Sign with the BitcodeX modal and submit; resolves when included in a block.
   * Rejects on a dispatch error and, for proxy.proxy calls, on a failed inner call.
   */
  async signAndSend(tx: SubmittableExtrinsic<"promise">): Promise<SendResult> {
    const address = await this.connect();
    const call = { section: tx.method.section, method: tx.method.method };
    return new Promise<SendResult>((resolve, reject) => {
      let unsub: (() => void) | undefined;
      tx.signAndSend(
        address,
        { signer: this.signer },
        ({ status, dispatchError, events, txHash }) => {
          if (!status.isInBlock && !status.isFinalized && !dispatchError) {
            return;
          }
          unsub?.();
          const outcome = extrinsicOutcome(
            tx.registry,
            call,
            dispatchError,
            events as unknown as EventRecordLike[],
          );
          if (!outcome.success) {
            reject(new Error(`${outcome.err} (tx ${txHash.toHex()})`));
            return;
          }
          resolve({
            txHash: txHash.toHex(),
            blockHash: (status.isInBlock
              ? status.asInBlock
              : status.asFinalized
            ).toHex(),
          });
        },
      )
        .then((u) => {
          unsub = u;
        })
        .catch(reject);
    });
  }

  /** Sign a message (wrapped in <Bytes> by the iframe); returns the 64-byte signature hex. */
  async signMessage(message: string | Uint8Array): Promise<string> {
    const address = await this.connect();
    const data =
      typeof message === "string"
        ? isHex(message)
          ? message
          : stringToHex(message)
        : u8aToHex(message);
    const res = await this.signRaw({ address, data, type: "bytes" });
    return res.signature;
  }

  private async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    const address = await this.connect();
    if (payload.address !== address) {
      throw new Error("payload is for a different account");
    }
    const result = await requestSignature(this.bitcodexWallet, {
      chain_type: "bittensor",
      sign_type: "extrinsic",
      payload: {
        origin: this.bitcodexWallet.origin,
        signer: address,
        chain_id: this.state.chainId,
        data: {
          signer_payload: payload as unknown as BittensorSignerPayloadJSON,
        },
      },
    });
    if (result.type !== "multi_signature") {
      throw new Error("unexpected signature type for an extrinsic");
    }
    return { id: ++this.signId, signature: result.signature as `0x${string}` };
  }

  private async signRaw(raw: SignerPayloadRaw): Promise<SignerResult> {
    const address = await this.connect();
    if (raw.address !== address) {
      throw new Error("message is for a different account");
    }
    // Only <Bytes> messages: "payload" raw signing could authorize an extrinsic.
    if (raw.type !== "bytes") {
      throw new Error("only type 'bytes' raw signing is supported");
    }
    const result = await requestSignature(this.bitcodexWallet, {
      chain_type: "bittensor",
      sign_type: "raw",
      payload: {
        origin: this.bitcodexWallet.origin,
        signer: address,
        chain_id: this.state.chainId,
        data: { message: raw.data },
      },
    });
    if (result.type !== "signature") {
      throw new Error("unexpected signature type for a message");
    }
    return { id: ++this.signId, signature: result.signature as `0x${string}` };
  }

  private async lazyInit(): Promise<void> {
    const coreRes = await this.bitcodexWallet.waitUntilInitialized;
    if (!coreRes.success) {
      return;
    }
    try {
      await this.loadAddress();
    } catch (err) {
      console.warn("[bittensor sdk] failed to load ed25519 key on init:", err);
    }
  }

  private async loadAddress(): Promise<string | null> {
    const keyHex = await this.bitcodexWallet.getPublicKeyEd25519();
    if (!keyHex) {
      return null;
    }
    const addressRes = toAddress(keyHex);
    if (!addressRes.success) {
      throw new Error(addressRes.err);
    }
    this.setAccount(addressRes.data, keyHex);
    return addressRes.data;
  }

  private setAccount(address: string | null, keyHex: string | null) {
    const changed = address !== this.state.address;
    this.state.address = address;
    this.state.publicKeyRaw = keyHex;
    if (changed) {
      this.emitter.emit("accountChanged", address);
    }
  }

  private onCoreAccountsChanged = async (payload: {
    publicKey: string | null;
  }) => {
    if (payload.publicKey === null) {
      this.setAccount(null, null);
      return;
    }
    try {
      await this.loadAddress();
    } catch (err) {
      console.warn("[bittensor sdk] failed to load ed25519 key:", err);
    }
  };
}
