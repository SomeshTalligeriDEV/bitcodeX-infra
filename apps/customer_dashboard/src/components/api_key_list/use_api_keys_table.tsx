import type { APIKey } from "@bitcodex/bitcodex-types/ct_dashboard";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

export const useAPIKeysTable = (data: APIKey[]) => {
  const columns = [
    {
      header: "API Key",
      accessorKey: "hashed_key",
    },
    {
      header: "Created Date",
      accessorKey: "created_at",
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
};
