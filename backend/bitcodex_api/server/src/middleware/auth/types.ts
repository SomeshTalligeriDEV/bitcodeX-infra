import type { AuthType } from "@bitcodex/bitcodex-types/auth";
import type { APIKey } from "@bitcodex/bitcodex-types/ct_dashboard";

export interface OAuthBody {
  auth_type: AuthType;
}

export interface OAuthUser {
  type: AuthType;
  user_identifier: string;
  // google, auth0, discord
  email?: string;
  // x, telegram, discord
  name?: string;
  // raw metadata from auth provider
  metadata?: Record<string, unknown>;
}

export interface OAuthLocals {
  oauth_user: OAuthUser;
}

export interface OAuthLocalsWithAPIKey extends OAuthLocals {
  api_key: APIKey;
}
