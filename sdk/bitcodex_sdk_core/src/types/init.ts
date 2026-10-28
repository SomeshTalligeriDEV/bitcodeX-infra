import type { AuthType } from "@bitcodex/bitcodex-types/auth";

export type InitPayload = {
  auth_type: AuthType | null;
  email: string | null;
  public_key: string | null;
  name: string | null;
};
