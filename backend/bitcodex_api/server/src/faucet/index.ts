import { getApi, SS58_PREFIX, TAO_DECIMALS } from "@bitcodex/bittensor-chain";
import type { Result } from "@bitcodex/stdlib-js";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { checkAddress, cryptoWaitReady } from "@polkadot/util-crypto";

import { AddressRateLimiter } from "./rate_limiter";

const RAO_PER_TAO = BigInt(10) ** BigInt(TAO_DECIMALS);

export interface FaucetConfig {
  /** Dev account URI (e.g. //Alice). Localnet only; never a real key. */
  suri: string;
  rpcUrl: string;
  amountTao: number;
  /** One drip per address per this many seconds. */
  cooldownSeconds: number;
}

export interface FaucetStatus {
  network: "bittensor:localnet";
  amountTao: number;
  cooldownSeconds: number;
  faucetAddress: string;
  faucetBalanceRao: string;
}

export interface DripResult {
  address: string;
  amountRao: string;
  txHash: string;
  blockHash: string;
}

export type FaucetErrorCode =
  | "INVALID_ADDRESS"
  | "RATE_LIMITED"
  | "NETWORK_REFUSED"
  | "TX_FAILED";

export interface FaucetError {
  code: FaucetErrorCode;
  msg: string;
  retryAfterSeconds?: number;
}

export class Faucet {
  private readonly limiter: AddressRateLimiter;
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(
    private readonly config: FaucetConfig,
    private readonly pair: KeyringPair,
  ) {
    this.limiter = new AddressRateLimiter(config.cooldownSeconds * 1000);
  }

  static async create(config: FaucetConfig): Promise<Faucet> {
    await cryptoWaitReady();
    const keyring = new Keyring({ type: "sr25519", ss58Format: SS58_PREFIX });
    return new Faucet(config, keyring.addFromUri(config.suri));
  }

  get amountRao(): bigint {
    return BigInt(this.config.amountTao) * RAO_PER_TAO;
  }

  async status(): Promise<Result<FaucetStatus, FaucetError>> {
    const apiRes = await this.api();
    if (!apiRes.success) {
      return apiRes;
    }
    const account = (await apiRes.data.query.system.account(
      this.pair.address,
    )) as unknown as { data: { free: { toString(): string } } };
    return {
      success: true,
      data: {
        network: "bittensor:localnet",
        amountTao: this.config.amountTao,
        cooldownSeconds: this.config.cooldownSeconds,
        faucetAddress: this.pair.address,
        faucetBalanceRao: account.data.free.toString(),
      },
    };
  }

  /** Send `amountTao` from the dev account; resolves once the transfer is in a block. */
  async drip(address: string): Promise<Result<DripResult, FaucetError>> {
    const [valid, reason] = checkAddress(address, SS58_PREFIX);
    if (!valid) {
      return {
        success: false,
        err: {
          code: "INVALID_ADDRESS",
          msg: `not a Bittensor (SS58 42) address: ${reason ?? "invalid"}`,
        },
      };
    }
    const wait = this.limiter.take(address);
    if (wait > 0) {
      return {
        success: false,
        err: {
          code: "RATE_LIMITED",
          msg: `this address was funded recently; try again in ${wait} s`,
          retryAfterSeconds: wait,
        },
      };
    }

    // One transfer at a time so the dev account's nonce never collides.
    const run = this.queue.then(() => this.transfer(address));
    this.queue = run.catch(() => undefined);
    const res = await run;
    if (!res.success) {
      this.limiter.release(address);
    }
    return res;
  }

  private async transfer(
    address: string,
  ): Promise<Result<DripResult, FaucetError>> {
    // Re-checked on every drip: the faucet never sends on anything but localnet.
    const apiRes = await this.api();
    if (!apiRes.success) {
      return apiRes;
    }
    const api = apiRes.data;
    const amount = this.amountRao;
    const tx = api.tx.balances.transferKeepAlive(address, amount);

    return new Promise((resolve) => {
      let unsub: (() => void) | undefined;
      tx.signAndSend(
        this.pair,
        { nonce: -1 },
        ({ status, dispatchError, txHash }) => {
          if (dispatchError) {
            unsub?.();
            let msg = dispatchError.toString();
            if (dispatchError.isModule) {
              const meta = api.registry.findMetaError(dispatchError.asModule);
              msg = `${meta.section}.${meta.name}`;
            }
            resolve({ success: false, err: { code: "TX_FAILED", msg } });
            return;
          }
          if (status.isInBlock) {
            unsub?.();
            resolve({
              success: true,
              data: {
                address,
                amountRao: amount.toString(),
                txHash: txHash.toHex(),
                blockHash: status.asInBlock.toHex(),
              },
            });
          }
        },
      )
        .then((u) => {
          unsub = u;
        })
        .catch((err: unknown) =>
          resolve({
            success: false,
            err: { code: "TX_FAILED", msg: String(err) },
          }),
        );
    });
  }

  private async api() {
    const res = await getApi("bittensor:localnet", {
      rpcUrl: this.config.rpcUrl,
    });
    if (!res.success) {
      return {
        success: false as const,
        err: { code: "NETWORK_REFUSED" as const, msg: res.err },
      };
    }
    return res;
  }
}

let faucet: Faucet | null = null;

export function setFaucet(f: Faucet | null) {
  faucet = f;
}

/** The running faucet, or null when BITCODEX_FAUCET_SURI is unset. */
export function getFaucet(): Faucet | null {
  return faucet;
}
