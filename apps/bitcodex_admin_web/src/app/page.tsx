import { RedirectType, redirect } from "next/navigation";

import { paths } from "@bitcodex-admin/paths";

export default function Home() {
  return redirect(paths.apps, RedirectType.replace);
}
