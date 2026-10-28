import type {
  EmailLoginModalErrorAckPayload,
  MakeSigModalErrorAckPayload,
  OtherModalErrorAckPayload,
} from "@bitcodex/bitcodex-sdk-core";

export type AppError =
  | MakeSigModalErrorAckPayload
  | OtherModalErrorAckPayload
  | EmailLoginModalErrorAckPayload;
