import type { MakeSigError } from "@bitcodex/bitcodex-sdk-core";
import {
  encodeEthereumSignature,
  hashEthereumMessage,
  hashEthereumTransaction,
  hashEthereumTypedData,
  parseTypedDataDefinition,
} from "@bitcodex/bitcodex-sdk-eth";
import type { Result } from "@bitcodex/stdlib-js";
import {
  type Hex,
  type SignableMessage,
  serializeSignature,
  serializeTransaction,
  type TransactionSerializable,
} from "viem";

import { makeSignature } from "@bitcodex-attached/web3/sig";

export async function makeEthereumTxSignature(
  storageKey: string,
  txSerializable: TransactionSerializable,
  getIsAborted: () => boolean,
): Promise<Result<Hex, MakeSigError>> {
  const msgHash = hashEthereumTransaction(txSerializable);

  const signOutputRes = await makeSignature(storageKey, msgHash, getIsAborted);
  if (!signOutputRes.success) {
    return { success: false, err: signOutputRes.err };
  }

  const signOutput = signOutputRes.data;

  const signature = encodeEthereumSignature(signOutput);

  const signedTransaction = serializeTransaction(txSerializable, signature);

  return { success: true, data: signedTransaction };
}

export async function makeEthereumArbitraryMessageSignature(
  storageKey: string,
  message: SignableMessage,
  getIsAborted: () => boolean,
): Promise<Result<Hex, MakeSigError>> {
  const msgHash = hashEthereumMessage(message);

  const signOutputRes = await makeSignature(storageKey, msgHash, getIsAborted);
  if (!signOutputRes.success) {
    return { success: false, err: signOutputRes.err };
  }

  const signOutput = signOutputRes.data;

  const signature = encodeEthereumSignature(signOutput);

  return { success: true, data: serializeSignature(signature) };
}

export async function makeEthereumEip712Signature(
  storageKey: string,
  serializedTypedData: string,
  getIsAborted: () => boolean,
): Promise<Result<Hex, MakeSigError>> {
  const typedData = parseTypedDataDefinition(serializedTypedData);

  const msgHash = hashEthereumTypedData(typedData);

  const signOutputRes = await makeSignature(storageKey, msgHash, getIsAborted);
  if (!signOutputRes.success) {
    return { success: false, err: signOutputRes.err };
  }

  const signOutput = signOutputRes.data;

  const signature = encodeEthereumSignature(signOutput);

  return { success: true, data: serializeSignature(signature) };
}
