"use client";

import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { FC, PropsWithChildren } from "react";

import { BitcodeXProvider } from "@bitcodex-user-dashboard/components/bitcodex_provider/bitcodex_provider";

function makeTanStackQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return queryClient;
}

const queryClient = makeTanStackQueryClient();

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

export const Providers: FC<PropsWithChildren> = ({ children }) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.queryKey[0] === "balances",
        },
      }}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BitcodeXProvider>{children}</BitcodeXProvider>
      </HydrationBoundary>
    </PersistQueryClientProvider>
  );
};
