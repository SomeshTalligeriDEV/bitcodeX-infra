import { beforeAll, describe, expect, it } from "@jest/globals";
import { Keyring } from "@polkadot/keyring";
import type { KeyringPair } from "@polkadot/keyring/types";
import { stringToU8a, u8aToHex, u8aWrapBytes } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import {
  caip2ChainId,
  createSiwbMessage,
  parseSiwbMessage,
  type SiwbFields,
  verifySiwb,
} from "@bitcodex-bittensor-chain/siwb";

const GENESIS =
  "0xda4f6b75d463bc28dc6d833bb07dbe356ebf1c37aeeb214f57d2e42599fcee1c";
let ed: KeyringPair;
let sr: KeyringPair;

const fields = (address: string, extra: Partial<SiwbFields> = {}) => ({
  domain: "localhost:3200",
  address,
  statement: "Sign in to the BitcodeX demo.",
  uri: "http://localhost:3200/login",
  version: "1",
  chainId: caip2ChainId(GENESIS),
  nonce: "a1b2c3d4e5f6",
  issuedAt: "2026-10-29T10:00:00.000Z",
  expirationTime: "2026-10-29T10:10:00.000Z",
  ...extra,
});

const sign = (pair: KeyringPair, message: string) =>
  u8aToHex(pair.sign(u8aWrapBytes(stringToU8a(message))));

const expectOk = {
  domain: "localhost:3200",
  nonce: "a1b2c3d4e5f6",
  genesisHash: GENESIS,
  now: new Date("2026-10-29T10:05:00.000Z"),
};

beforeAll(async () => {
  await cryptoWaitReady();
  ed = new Keyring({ type: "ed25519", ss58Format: 42 }).addFromUri("//SiwbEd");
  sr = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromUri("//SiwbSr");
});

describe("Sign-In with Bittensor message", () => {
  it("uses the CAIP-122 template and CAIP-2 polkadot chain id", () => {
    expect(caip2ChainId(GENESIS)).toBe(
      "polkadot:da4f6b75d463bc28dc6d833bb07dbe35",
    );
    const res = createSiwbMessage({
      ...fields(ed.address),
      resources: ["https://example.com/terms"],
    });
    expect(res.success && res.data).toBe(
      [
        "localhost:3200 wants you to sign in with your Bittensor account:",
        ed.address,
        "",
        "Sign in to the BitcodeX demo.",
        "",
        "URI: http://localhost:3200/login",
        "Version: 1",
        "Nonce: a1b2c3d4e5f6",
        "Issued At: 2026-10-29T10:00:00.000Z",
        "Expiration Time: 2026-10-29T10:10:00.000Z",
        "Chain ID: polkadot:da4f6b75d463bc28dc6d833bb07dbe35",
        "Resources:",
        "- https://example.com/terms",
      ].join("\n"),
    );
  });

  it("round-trips through parse, with and without optional lines", () => {
    for (const f of [
      fields(ed.address),
      {
        domain: "a.b",
        address: sr.address,
        uri: "https://a.b",
        version: "1",
        chainId: caip2ChainId(GENESIS),
      },
    ]) {
      const msg = createSiwbMessage(f);
      expect(msg.success).toBe(true);
      if (msg.success) {
        expect(parseSiwbMessage(msg.data)).toEqual(f);
      }
    }
    expect(parseSiwbMessage("hello")).toBeNull();
  });

  it("rejects bad fields", () => {
    const bad: Partial<SiwbFields>[] = [
      { domain: "evil.com/path" },
      { address: "1".repeat(48) },
      { statement: "two\nlines" },
      { uri: "not a uri" },
      { version: "2" },
      { chainId: "polkadot:XYZ" },
      { nonce: "short" },
      { issuedAt: "yesterday" },
    ];
    for (const b of bad) {
      expect(createSiwbMessage({ ...fields(ed.address), ...b }).success).toBe(
        false,
      );
    }
  });
});

describe("verifySiwb", () => {
  it("accepts ed25519 (BitcodeX) and sr25519 signatures over <Bytes>message</Bytes>", () => {
    for (const pair of [ed, sr]) {
      const msg = createSiwbMessage(fields(pair.address));
      if (!msg.success) {
        throw new Error(msg.err);
      }
      const res = verifySiwb(msg.data, sign(pair, msg.data), expectOk);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.crypto).toBe(pair.type);
      }
    }
  });

  it("refuses wrong domain, nonce, chain, expired, not-yet-valid, tampered and wrong signer", () => {
    const msg = createSiwbMessage(
      fields(ed.address, { notBefore: "2026-10-29T10:01:00.000Z" }),
    );
    if (!msg.success) {
      throw new Error(msg.err);
    }
    const sig = sign(ed, msg.data);
    const err = (r: ReturnType<typeof verifySiwb>) =>
      r.success ? null : r.err;
    expect(
      err(verifySiwb(msg.data, sig, { ...expectOk, domain: "evil.com" })),
    ).toMatch(/domain/);
    expect(
      err(verifySiwb(msg.data, sig, { ...expectOk, nonce: "zzzzzzzzzz" })),
    ).toMatch(/nonce/);
    expect(
      err(
        verifySiwb(msg.data, sig, {
          ...expectOk,
          genesisHash: `0x${"11".repeat(32)}`,
        }),
      ),
    ).toMatch(/chain/);
    expect(
      err(
        verifySiwb(msg.data, sig, {
          ...expectOk,
          now: new Date("2026-10-29T11:00:00.000Z"),
        }),
      ),
    ).toMatch(/expired/);
    expect(
      err(
        verifySiwb(msg.data, sig, {
          ...expectOk,
          now: new Date("2026-10-29T10:00:30.000Z"),
        }),
      ),
    ).toMatch(/not valid yet/);
    const tampered = msg.data.replace("Sign in to", "Send all to");
    expect(err(verifySiwb(tampered, sig, expectOk))).toMatch(/bad signature/);
    expect(err(verifySiwb(msg.data, sign(sr, msg.data), expectOk))).toMatch(
      /bad signature/,
    );
  });
});
