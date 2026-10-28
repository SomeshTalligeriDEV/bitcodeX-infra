import type {
  GetTssAllActivationSettingResponse,
  GetTssSessionListRequest,
  GetTssSessionListResponse,
  SetTssAllActivationSettingRequest,
  SetTssAllActivationSettingResponse,
} from "@bitcodex/bitcodex-types/admin";

import { BITCODEX_ADMIN_API_ENDPOINT_V1 } from "@bitcodex-admin/fetch";
import { doFetch } from "@bitcodex-admin/fetch/fetcher";

export async function getTSSSessionsList({
  token,
  limit = 10,
  offset = 0,
  node_id,
  customer_id,
  curve_type,
}: {
  token: string;
  limit?: number;
  offset?: number;
  node_id?: string;
  customer_id?: string;
  curve_type?: string;
}) {
  const body: GetTssSessionListRequest = {
    limit,
    offset,
    node_id,
    customer_id,
    curve_type,
  };

  return doFetch<GetTssSessionListResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/tss/get_tss_session_list`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );
}

export async function getTssAllActivationSetting({ token }: { token: string }) {
  return doFetch<GetTssAllActivationSettingResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/tss/get_tss_all_activation_setting`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function setTssAllActivationSetting({
  token,
  is_enabled,
}: {
  token: string;
  is_enabled: boolean;
}) {
  const body: SetTssAllActivationSettingRequest = {
    is_enabled,
  };

  return doFetch<SetTssAllActivationSettingResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/tss/set_tss_all_activation_setting`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );
}
