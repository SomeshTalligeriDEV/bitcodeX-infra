import type {
  ApiName as BitcodeXApiName,
  CommitRevealParams,
} from "@bitcodex/bitcodex-types/commit_reveal";
import type { ApiName as KsnApiName } from "@bitcodex/ksn-interface/commit_reveal";
import type { Result } from "@bitcodex/stdlib-js";

import type { ClientCommitRevealSession } from "./types";
import { createRevealSignature } from "./utils";

export function createBitcodeXApiSignature(
  session: ClientCommitRevealSession,
  apiName: BitcodeXApiName,
): Result<string, string> {
  if (!session.bitcodex_api_node_pubkey) {
    return { success: false, err: "bitcodex_api node pubkey not set" };
  }
  return createRevealSignature(
    session.client_keypair.privateKey,
    session.bitcodex_api_node_pubkey,
    session.session_id,
    session.auth_type,
    session.id_token,
    session.operation_type,
    apiName,
  );
}

export function createKsnSignature(
  session: ClientCommitRevealSession,
  nodeUrl: string,
  apiName: KsnApiName,
): Result<string, string> {
  const nodePubkey = session.ksn_node_pubkeys[nodeUrl];
  const operationType = session.ksn_operation_types[nodeUrl];
  if (!nodePubkey) {
    return { success: false, err: `ks node pubkey not found for ${nodeUrl}` };
  }
  if (!operationType) {
    return {
      success: false,
      err: `ks operation type not found for ${nodeUrl}`,
    };
  }

  return createRevealSignature(
    session.client_keypair.privateKey,
    nodePubkey,
    session.session_id,
    session.auth_type,
    session.id_token,
    operationType,
    apiName,
  );
}

export function createBitcodeXApiCommitRevealParams(
  session: ClientCommitRevealSession,
  apiName: BitcodeXApiName,
): Result<CommitRevealParams, string> {
  const sigRes = createBitcodeXApiSignature(session, apiName);
  if (!sigRes.success) {
    return { success: false, err: sigRes.err };
  }
  return {
    success: true,
    data: {
      cr_session_id: session.session_id,
      cr_signature: sigRes.data,
    },
  };
}

export function createKsnCommitRevealParams(
  session: ClientCommitRevealSession,
  nodeEndpoint: string,
  apiName: KsnApiName,
): Result<CommitRevealParams, string> {
  const ksnSigRes = createKsnSignature(session, nodeEndpoint, apiName);
  if (!ksnSigRes.success) {
    return { success: false, err: ksnSigRes.err };
  }
  return {
    success: true,
    data: {
      cr_session_id: session.session_id,
      cr_signature: ksnSigRes.data,
    },
  };
}
