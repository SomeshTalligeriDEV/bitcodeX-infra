import { useEffect, useState } from "react";

// Public CoinGecko simple-price endpoint (no key). This is the MAINNET TAO price:
// localnet/testnet TAO is test money with no value, so the UI labels it as reference.
const PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bittensor&vs_currencies=usd&include_last_updated_at=true";
const CACHE_MS = 60_000;
const STORAGE_KEY = "bitcodex:tao_usd";

export interface TaoPrice {
  usd: number;
  /** ms since epoch of the price itself (from the API). */
  updatedAt: number;
  /** True when this is a remembered price because the API is unreachable. */
  stale: boolean;
}

let memory: { price: TaoPrice; fetchedAt: number } | null = null;

function remembered(): TaoPrice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...(JSON.parse(raw) as TaoPrice), stale: true } : null;
  } catch {
    return null;
  }
}

async function fetchPrice(): Promise<TaoPrice | null> {
  if (memory && Date.now() - memory.fetchedAt < CACHE_MS) {
    return memory.price;
  }
  try {
    const res = await fetch(PRICE_URL, { cache: "no-store" });
    const body = (await res.json()) as {
      bittensor?: { usd?: number; last_updated_at?: number };
    };
    const usd = body.bittensor?.usd;
    if (typeof usd !== "number" || !Number.isFinite(usd)) {
      throw new Error("no price in response");
    }
    const price: TaoPrice = {
      usd,
      updatedAt: (body.bittensor?.last_updated_at ?? 0) * 1000,
      stale: false,
    };
    memory = { price, fetchedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(price));
    } catch {
      // remembering the price is optional
    }
    return price;
  } catch {
    return remembered();
  }
}

/** TAO/USD, refreshed every 60 s; null when the API was never reachable. */
export function useTaoPrice(): TaoPrice | null {
  const [price, setPrice] = useState<TaoPrice | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchPrice().then((p) => {
        if (!cancelled) {
          setPrice(p);
        }
      });
    load();
    const t = setInterval(load, CACHE_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);
  return price;
}
