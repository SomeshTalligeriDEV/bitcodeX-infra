import {
  makeServerState,
  makeServerState2,
  type SessionId,
  type UserId,
} from "@bitcodex/cait-sith-cosmos-compat-addon/src/state";
import type {
  KeygenEntity,
  PresignEntity,
  SignEntity,
  TECDSAServerState,
  TriplesEntity,
} from "@bitcodex/tecdsa-interface";

// dangerous - for PoC purpose
export const appServerState: AppServerState = (() => {
  console.log("init app server state");

  return {
    serverState: makeServerState(),
    serverState2: makeServerState2(),
  };
})();

export interface AppServerState {
  serverState: TECDSAServerState;
  serverState2: {
    keygens: Map<UserId, KeygenEntity>;
    triples: Map<SessionId, TriplesEntity>;
    presigns: Map<SessionId, PresignEntity>;
    signs: Map<SessionId, SignEntity>;
  };
}
