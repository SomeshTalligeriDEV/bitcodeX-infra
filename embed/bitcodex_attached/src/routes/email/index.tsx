import { createFileRoute } from "@tanstack/react-router";

import { EmailLogin } from "@bitcodex-attached/components/email/email_login";

export const Route = createFileRoute("/email/")({
  component: EmailLogin,
});
