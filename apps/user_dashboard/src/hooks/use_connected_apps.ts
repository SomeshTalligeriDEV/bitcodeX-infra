import type {
  BitcodeXWalletMsgGetConnectedApps,
  BitcodeXWalletMsgGetConnectedAppsAck,
  ConnectedApp,
  GetConnectedAppsError,
} from "@bitcodex/bitcodex-sdk-core";
import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useQuery } from "@tanstack/react-query";

type UseConnectedAppsResult = UseConnectedAppsSuccess | UseConnectedAppsError;

interface UseConnectedAppsSuccess {
  isSuccess: true;
  data: ConnectedApp[];
  isLoading: boolean;
  error: null;
}

interface UseConnectedAppsError {
  isSuccess: false;
  error: GetConnectedAppsError;
  isLoading: boolean;
  data: never[];
}

// NOTE: The __get_connected_apps__ message should only be called from the user_dashboard,
// so it is not added to the SDK and is instead called separately in useConnectedApp.
export function useConnectedApps(): UseConnectedAppsResult {
  const { cosmosWallet } = useBitcodeXCosmos();

  const { data, isLoading, error } = useQuery<
    ConnectedApp[],
    GetConnectedAppsError
  >({
    queryKey: ["connectedApps"],
    queryFn: async () => {
      if (!cosmosWallet) {
        throw new Error("cosmosWallet not available");
      }
      const res = await cosmosWallet.bitcodexWallet.sendMsgToIframe({
        target: "bitcodex_attached",
        msg_type: "__get_connected_apps__",
        payload: null,
      } as BitcodeXWalletMsgGetConnectedApps as any);

      const resAny = res as unknown as BitcodeXWalletMsgGetConnectedAppsAck;
      if (resAny.msg_type === "__get_connected_apps_ack__") {
        const payload = resAny.payload;

        if (payload.success) {
          return payload.data;
        } else {
          throw payload.error;
        }
      }

      return [];
    },
    enabled: !!cosmosWallet,
  });

  if (error) {
    return {
      isSuccess: false,
      error,
      isLoading,
      data: [],
    };
  }

  return {
    isSuccess: true,
    data: data ?? [],
    isLoading,
    error: null,
  };
}
