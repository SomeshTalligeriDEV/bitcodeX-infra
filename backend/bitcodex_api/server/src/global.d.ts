import type { ServerState } from "@bitcodex/bitcodex-api-server-state";

declare global {
  namespace Express {
    interface Locals extends ServerState {}
  }
}

export {};
