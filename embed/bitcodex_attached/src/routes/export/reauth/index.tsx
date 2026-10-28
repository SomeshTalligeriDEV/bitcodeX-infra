import { createFileRoute } from "@tanstack/react-router";

import { ExportReauth } from "@bitcodex-attached/components/export/export_reauth";

export const Route = createFileRoute("/export/reauth/")({
  component: ExportReauth,
});
