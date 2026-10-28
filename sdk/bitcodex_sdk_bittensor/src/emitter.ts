import { EventEmitter } from "eventemitter3";

import type {
  BittensorWalletEvent,
  BittensorWalletEventHandler,
  BittensorWalletEventMap,
} from "./types";

export class BittensorWalletEventEmitter extends EventEmitter<BittensorWalletEvent> {
  on<K extends BittensorWalletEvent>(
    event: K,
    handler: BittensorWalletEventHandler<K>,
  ): this {
    return super.on(event, handler as (...args: unknown[]) => void);
  }

  off<K extends BittensorWalletEvent>(
    event: K,
    handler: BittensorWalletEventHandler<K>,
  ): this {
    return super.off(event, handler as (...args: unknown[]) => void);
  }

  emit<K extends BittensorWalletEvent>(
    event: K,
    ...args: BittensorWalletEventMap[K] extends undefined
      ? []
      : [BittensorWalletEventMap[K]]
  ): boolean {
    return super.emit(event, ...args);
  }
}
