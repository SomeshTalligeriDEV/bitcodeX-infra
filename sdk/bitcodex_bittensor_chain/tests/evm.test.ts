import { describe, expect, it } from "@jest/globals";

import {
  evmAddressFromSecp256k1,
  evmMirrorAddress,
  mirrorPublicKey,
} from "@bitcodex-bittensor-chain/evm";

describe("Subtensor EVM mapping", () => {
  it("matches the chain's address-mapping precompile (testnet, 2026-10-29)", () => {
    const h160 = `0x${"ab".repeat(10)}${"cd".repeat(10)}`;
    // eth_call to 0x…080c addressMapping(h160) on wss://test.finney.opentensor.ai returned:
    expect(mirrorPublicKey(h160)).toBe(
      "0x8b1509c14a586015c583bc0c8b7bb77694f249f5c477ae1a36e8e5f5678279a0",
    );
    expect(evmMirrorAddress(h160)).toBe(
      "5FD4mCAikVBFkQ7ND9FJcrSmNf6THmRWA5SqexmQGyczU8n1",
    );
  });

  it("derives the EIP-55 address from a secp256k1 key (Hardhat account #0 vector)", () => {
    // Public key of the well-known test private key 0xac0974…ff80 (Hardhat #0).
    const pub =
      "0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75";
    expect(evmAddressFromSecp256k1(pub)).toBe(
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    );
  });

  it("rejects malformed input", () => {
    expect(() => evmMirrorAddress("0x1234")).toThrow();
    expect(() => evmAddressFromSecp256k1("0x00")).toThrow();
  });
});
