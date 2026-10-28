import { useQuery } from "@tanstack/react-query";

import { BITCODEX_ADMIN_API_ENDPOINT_V1 } from "..";
import { doFetch } from "../fetcher";
import type { GetKSNodesParams } from "./";
// import { getAllKeyShareNodes } from "@bitcodex-admin/fetch/ks_node";
import { useAppState } from "@bitcodex-admin/state";
import type { GetAllKSNodeResponse } from "@bitcodex-types/admin";

export function useAllKeyShareNodes() {
  const { token } = useAppState();

  return useQuery({
    queryKey: ["all-ks-nodes"],
    queryFn: async () => {
      if (!token) {
        throw new Error("Token is not found");
      }

      const response = await getAllKeyShareNodes({ token });

      if (!response.success) {
        throw new Error(response.msg);
      }

      return response.data;
    },
  });
}

async function getAllKeyShareNodes({ token }: GetKSNodesParams) {
  return doFetch<GetAllKSNodeResponse>(
    `${BITCODEX_ADMIN_API_ENDPOINT_V1}/ks_node/get_all_ks_nodes`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
