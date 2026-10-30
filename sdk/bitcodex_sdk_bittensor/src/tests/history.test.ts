import { describe, expect, it } from "@jest/globals";

import {
  addEntry,
  defaultHistoryStore,
  type HistoryEntry,
  historyKey,
} from "../history";

const entry = (txHash: string, status: HistoryEntry["status"] = "success") =>
  ({
    chainId: "bittensor:localnet",
    txHash,
    blockHash: "0xb",
    blockNumber: 1,
    status,
    error: status === "failed" ? "swap.PriceLimitExceeded" : null,
    section: "balances",
    method: "transferKeepAlive",
    title: "Send TAO",
    rows: [],
    timestamp: 0,
  }) satisfies HistoryEntry;

describe("history", () => {
  it("keeps newest first and replaces a re-recorded tx", () => {
    let list: HistoryEntry[] = [];
    list = addEntry(list, entry("0x1"));
    list = addEntry(list, entry("0x2"));
    list = addEntry(list, entry("0x1", "failed"));
    expect(list.map((e) => [e.txHash, e.status])).toEqual([
      ["0x1", "failed"],
      ["0x2", "success"],
    ]);
  });

  it("caps the list at 200 entries", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < 250; i++) {
      list = addEntry(list, entry(`0x${i}`));
    }
    expect(list).toHaveLength(200);
    expect(list[0].txHash).toBe("0x249");
  });

  it("store works without localStorage (memory fallback), keyed per chain and address", () => {
    const store = defaultHistoryStore();
    const a = historyKey("bittensor:localnet", "5A");
    const b = historyKey("bittensor:localnet", "5B");
    store.save(a, [entry("0x1")]);
    expect(store.load(a)).toHaveLength(1);
    expect(store.load(b)).toEqual([]);
  });
});
