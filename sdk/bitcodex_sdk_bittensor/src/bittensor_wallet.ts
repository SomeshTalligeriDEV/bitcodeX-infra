import {
  BitcodeXWallet,
  type BitcodeXWalletInterface,
  type BittensorSignerPayloadJSON,
} from "@bitcodex/bitcodex-sdk-core";
import {
  type Balances,
  caip2ChainId,
  createSiwbMessage,
  DEFAULT_SLIPPAGE_BPS,
  describeCall,
  type EventRecordLike,
  getApi,
  getBalances,
  getStakes,
  listSubnets,
  parseUnits,
  quoteStake,
  quoteUnstake,
  type SiwbFields,
  type StakePosition,
  type SubnetSummary,
  type SwapQuote,
  toAddress,
  toPlainCall,
} from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Call } from "@polkadot/types/interfaces";
import type {
  Signer,
  SignerPayloadJSON,
  SignerPayloadRaw,
  SignerResult,
} from "@polkadot/types/types";
import { isHex, stringToHex, u8aToHex } from "@polkadot/util";
import { checkAddress } from "@polkadot/util-crypto";

import { BittensorWalletEventEmitter } from "./emitter";
import {
  addEntry,
  defaultHistoryStore,
  type HistoryEntry,
  type HistoryStore,
  historyKey,
} from "./history";
import { requestSignature } from "./make_signature";
import { extrinsicOutcome } from "./outcome";
import type {
  BitcodeXBittensorInitArgs,
  BitcodeXBittensorInitError,
  BitcodeXBittensorState,
  BittensorWalletEvent,
  BittensorWalletEventHandler,
  SendResult,
  SignInWithBittensorArgs,
  SignInWithBittensorResult,
  StakeArgs,
  StakeResult,
  UnstakeArgs,
} from "./types";

export class BitcodeXBittensorWallet {
  readonly bitcodexWallet: BitcodeXWalletInterface;
  readonly state: BitcodeXBittensorState;
  readonly waitUntilInitialized: Promise<void>;
  /** polkadot.js `Signer`: pass as `{ signer }` to `signAndSend`. */
  readonly signer: Signer;
  connecting = false;

  private readonly emitter = new BittensorWalletEventEmitter();
  private readonly history: HistoryStore;
  private readonly rpcUrl: string | undefined;
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
      data: new BitcodeXBittensorWallet(coreRes.data, args.chain_id, {
        rpcUrl: args.rpc_url,
        history: args.history_store,
      }),
    };
  }

  constructor(
    bitcodexWallet: BitcodeXWalletInterface,
    chainId: BitcodeXBittensorState["chainId"],
    options: { rpcUrl?: string; history?: HistoryStore } = {},
  ) {
    this.bitcodexWallet = bitcodexWallet;
    this.rpcUrl = options.rpcUrl;
    this.history = options.history ?? defaultHistoryStore();
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
          const result = {
            txHash: txHash.toHex(),
            blockHash: (status.isInBlock
              ? status.asInBlock
              : status.asFinalized
            ).toHex(),
          };
          this.record(
            address,
            tx,
            result,
            outcome.success ? null : outcome.err,
          ).finally(() => {
            if (!outcome.success) {
              reject(new Error(`${outcome.err} (tx ${result.txHash})`));
            } else {
              resolve(result);
            }
          });
        },
      )
        .then((u) => {
          unsub = u;
        })
        .catch(reject);
    });
  }

  /** Network-checked connection for this wallet's chain (same cache as `getApi`). */
  async api(): Promise<ApiPromise> {
    const res = await getApi(this.state.chainId, { rpcUrl: this.rpcUrl });
    if (!res.success) {
      throw new Error(res.err);
    }
    return res.data;
  }

  async getBalances(): Promise<Balances> {
    return getBalances(await this.api(), await this.connect());
  }

  /** Stake per (hotkey, subnet), valued at what unstaking would return now. */
  async getStakes(): Promise<StakePosition[]> {
    return getStakes(await this.api(), await this.connect());
  }

  /** Live subnets with name, symbol, owner hotkey and spot price. */
  async listSubnets(): Promise<SubnetSummary[]> {
    return listSubnets(await this.api());
  }

  /** Expected alpha, fee, price impact and limit price; nothing is signed. */
  async quoteStake(args: Omit<StakeArgs, "hotkey">): Promise<SwapQuote> {
    const amount = mustParse(args.amountTao);
    return quoteStake(
      await this.api(),
      args.netuid,
      amount,
      args.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    );
  }

  async quoteUnstake(args: Omit<UnstakeArgs, "hotkey">): Promise<SwapQuote> {
    const amount = mustParse(args.amountAlpha);
    return quoteUnstake(
      await this.api(),
      args.netuid,
      amount,
      args.slippageBps ?? DEFAULT_SLIPPAGE_BPS,
    );
  }

  /** `balances.transferKeepAlive`: never closes the sending account. */
  async sendTao(to: string, amountTao: string): Promise<SendResult> {
    const [valid, reason] = checkAddress(to, 42);
    if (!valid) {
      throw new Error(`not a Bittensor address: ${reason ?? to}`);
    }
    const api = await this.api();
    return this.signAndSend(
      api.tx.balances.transferKeepAlive(to, mustParse(amountTao)),
    );
  }

  /**
   * `subtensorModule.addStakeLimit` at the quoted price plus slippage. With
   * `allowPartial` false (default) the chain rejects it if the price moves too far.
   */
  async stake(args: StakeArgs): Promise<StakeResult> {
    const api = await this.api();
    const quote = await this.quoteStake(args);
    const res = await this.signAndSend(
      api.tx.subtensorModule.addStakeLimit(
        args.hotkey,
        args.netuid,
        quote.tao,
        quote.limitPrice,
        args.allowPartial ?? false,
      ),
    );
    return { ...res, quote };
  }

  /** `subtensorModule.removeStakeLimit` at the quoted price minus slippage. */
  async unstake(args: UnstakeArgs): Promise<StakeResult> {
    const api = await this.api();
    const quote = await this.quoteUnstake(args);
    const res = await this.signAndSend(
      api.tx.subtensorModule.removeStakeLimit(
        args.hotkey,
        args.netuid,
        quote.alpha,
        quote.limitPrice,
        args.allowPartial ?? false,
      ),
    );
    return { ...res, quote };
  }

  /** Transactions sent from this browser through BitcodeX, newest first. */
  async getHistory(): Promise<HistoryEntry[]> {
    const address = await this.connect();
    return this.history.load(historyKey(this.state.chainId, address));
  }

  private async record(
    address: string,
    tx: SubmittableExtrinsic<"promise">,
    result: SendResult,
    error: string | null,
  ) {
    try {
      const card = describeCall(toPlainCall(tx.method as unknown as Call));
      let blockNumber: number | null = null;
      try {
        const api = await this.api();
        blockNumber = (
          await api.rpc.chain.getHeader(result.blockHash)
        ).number.toNumber();
      } catch {
        // keep the entry without a block number
      }
      const key = historyKey(this.state.chainId, address);
      const entry: HistoryEntry = {
        chainId: this.state.chainId,
        txHash: result.txHash,
        blockHash: result.blockHash,
        blockNumber,
        status: error ? "failed" : "success",
        error,
        section: card.section,
        method: card.method,
        title: card.title,
        rows: card.rows,
        timestamp: Date.now(),
      };
      this.history.save(key, addEntry(this.history.load(key), entry));
      this.emitter.emit("historyChanged", entry);
    } catch (err) {
      console.warn("[bittensor sdk] failed to record history:", err);
    }
  }

  /**
   * Sign-In with Bittensor (CAIP-122 profile, see `@bitcodex/bittensor-chain` siwb.ts).
   * The app's server issues `nonce` and checks the result with `verifySiwb`.
   */
  async signInWithBittensor(
    args: SignInWithBittensorArgs,
  ): Promise<SignInWithBittensorResult> {
    const address = await this.connect();
    const api = await this.api();
    const issued = new Date();
    const fields: SiwbFields = {
      domain: args.domain ?? window.location.host,
      address,
      statement: args.statement,
      uri: args.uri ?? window.location.origin,
      version: "1",
      chainId: caip2ChainId(api.genesisHash.toHex()),
      nonce: args.nonce,
      issuedAt: issued.toISOString(),
      expirationTime: new Date(
        issued.getTime() + (args.expirationMinutes ?? 10) * 60_000,
      ).toISOString(),
      requestId: args.requestId,
      resources: args.resources,
    };
    const message = createSiwbMessage(fields);
    if (!message.success) {
      throw new Error(message.err);
    }
    const signature = await this.signMessage(message.data);
    return { message: message.data, signature, address, fields };
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

function mustParse(amount: string): bigint {
  const res = parseUnits(amount);
  if (!res.success) {
    throw new Error(res.err);
  }
  if (res.data <= BigInt(0)) {
    throw new Error("amount must be greater than 0");
  }
  return res.data;
}
