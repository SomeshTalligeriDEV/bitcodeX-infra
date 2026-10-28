import type { TssSessionWithCustomerAndUser } from "@bitcodex-types/tss";
import type { TssActivationSetting } from "@bitcodex-types/tss_activate";

export interface GetTssSessionListRequest {
  limit: number;
  offset: number;
  node_id?: string;
  customer_id?: string;
  curve_type?: string;
}

export interface GetTssSessionListResponse {
  tss_sessions: TssSessionWithCustomerAndUser[];
  pagination: {
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface GetTssAllActivationSettingResponse {
  tss_activation_setting: TssActivationSetting;
  key_share_node_meta?: {
    sss_threshold: number;
    registration_threshold: number | null;
  };
}

export interface SetTssAllActivationSettingRequest {
  is_enabled: boolean;
}

export interface SetTssAllActivationSettingResponse {
  tss_activation_setting: TssActivationSetting;
}
