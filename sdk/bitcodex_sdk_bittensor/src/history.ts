import type { BittensorChainId, CardRow } from "@bitcodex/bittensor-chain";

/** One extrinsic sent through this wallet, recorded once it is in a block. */
export interface HistoryEntry {
  chainId: BittensorChainId;
  txHash: string;
  blockHash: string;
  blockNumber: number | null;
  status: "success" | "failed";
  /** Decoded chain error for failed calls, e.g. "swap.PriceLimitExceeded". */
  error: string | null;
  section: string;
  method: string;
  title: string;
  rows: CardRow[];
  /** ms since epoch when the inclusion was seen. */
  timestamp: number;
}

export interface HistoryStore {
  load(key: string): HistoryEntry[];
  save(key: string, entries: HistoryEntry[]): void;
}

const MAX_ENTRIES = 200;

/**
 * localStorage on the app's origin, falling back to memory where storage is blocked.
 * Not an indexer: only transactions sent from this browser through BitcodeX are listed.
 */
export function defaultHistoryStore(): HistoryStore {
  const memory = new Map<string, HistoryEntry[]>();
  const storage = (): Storage | null => {
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  };
  return {
    load(key) {
      try {
        const raw = storage()?.getItem(key);
        if (raw) {
          return JSON.parse(raw) as HistoryEntry[];
        }
      } catch {
        // fall through to memory
      }
      return memory.get(key) ?? [];
    },
    save(key, entries) {
      memory.set(key, entries);
      try {
        storage()?.setItem(key, JSON.stringify(entries));
      } catch {
        // memory copy is kept
      }
    },
  };
}

export function historyKey(chainId: BittensorChainId, address: string) {
  return `bitcodex:bittensor:history:${chainId}:${address}`;
}

/** Newest first; a re-recorded tx hash replaces its earlier entry. */
export function addEntry(
  entries: HistoryEntry[],
  entry: HistoryEntry,
): HistoryEntry[] {
  return [entry, ...entries.filter((e) => e.txHash !== entry.txHash)].slice(
    0,
    MAX_ENTRIES,
  );
}
