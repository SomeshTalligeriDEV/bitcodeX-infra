import type { CustomerWithAPIKeys } from "@bitcodex/bitcodex-types/customers";
import { useQuery } from "@tanstack/react-query";

import { getCustomerListWithAPIKeys } from "@bitcodex-admin/fetch/customer";
import { useAppState } from "@bitcodex-admin/state";

export function useGetAllCustomers() {
  const { token } = useAppState();

  return useQuery<CustomerWithAPIKeys[]>({
    queryKey: ["all_customers", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) {
        throw new Error("Token is not found");
      }

      const response = await getCustomerListWithAPIKeys({
        token,
        limit: 1000,
        offset: 0,
      });

      if (!response.success) {
        throw new Error(response.msg);
      }

      return response.data.customerWithAPIKeysList;
    },
  });
}
