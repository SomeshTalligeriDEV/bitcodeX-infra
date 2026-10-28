import type { BitcodeXCosmosWalletInterface } from "@bitcodex/bitcodex-sdk-cosmos";
import type {
  BroadcastMode,
  SignOptions,
  StdSignature,
  Wallet,
  WalletAccount,
} from "@interchain-kit/core";
import { CosmosWallet } from "@interchain-kit/core";

/**
 * BitcodeX Cosmos Wallet implementation for interchain-kit
 */
export class BitcodeXWallet extends CosmosWallet {
  private bitcodexClient: BitcodeXCosmosWalletInterface;
  defaultSignOptions: {
    preferNoSetFee: boolean;
    preferNoSetMemo: boolean;
    disableBalanceCheck: boolean;
  } = {
    preferNoSetFee: false,
    preferNoSetMemo: false,
    disableBalanceCheck: false,
  };

  constructor(
    walletInfo: Wallet,
    bitcodexClient: BitcodeXCosmosWalletInterface,
  ) {
    super(walletInfo);
    this.bitcodexClient = bitcodexClient;

    // Expose client for interchain-kit
    (this as any).client = bitcodexClient;
  }

  setSignOptions(options: SignOptions): void {
    this.defaultSignOptions = {
      ...this.defaultSignOptions,
      ...options,
    };
  }

  async init(): Promise<void> {
    await this.bitcodexClient.waitUntilInitialized;
  }

  async connect(_chainId: string): Promise<void> {}

  async disconnect(_chainId: string): Promise<void> {
    await this.bitcodexClient.bitcodexWallet.signOut();
  }

  async getAccount(chainId: string): Promise<WalletAccount> {
    // Check if user is already signed in
    const publicKey = await this.bitcodexClient.bitcodexWallet.getPublicKey();

    // If not signed in, trigger the sign-in flow
    if (!publicKey) {
      await this.bitcodexClient.bitcodexWallet.openSignInModal();
    }

    const key = await this.bitcodexClient.getKey(chainId);

    // Normalize pubkey to a plain Uint8Array.
    // key.pubKey may be a Buffer, a deserialized {type:"Buffer",data:[...]}
    // object, or already a Uint8Array.
    let raw: Uint8Array;
    const pk = key.pubKey as any;
    if (
      pk &&
      typeof pk === "object" &&
      pk.type === "Buffer" &&
      Array.isArray(pk.data)
    ) {
      raw = new Uint8Array(pk.data);
    } else {
      raw = new Uint8Array(pk);
    }

    return {
      username: key.name,
      address: key.bech32Address,
      algo: key.algo as any,
      pubkey: raw,
      isNanoLedger: key.isNanoLedger,
    };
  }

  async getOfflineSigner(chainId: string): Promise<any> {
    return this.bitcodexClient.getOfflineSigner(chainId);
  }

  async signAmino(
    chainId: string,
    signer: string,
    signDoc: any,
    _signOptions?: any,
  ): Promise<any> {
    return this.bitcodexClient.signAmino(chainId, signer, signDoc);
  }

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
  ): Promise<StdSignature> {
    return await this.bitcodexClient.signArbitrary(chainId, signer, data);
  }

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: any,
    _signOptions?: any,
  ): Promise<any> {
    return this.bitcodexClient.signDirect(chainId, signer, signDoc);
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode) {
    return await this.bitcodexClient.sendTx(chainId, tx, mode);
  }

  async addSuggestChain(_chainId: string): Promise<void> {}
}
