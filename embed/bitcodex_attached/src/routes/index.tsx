import { createFileRoute } from "@tanstack/react-router";

import { AttachedInitialized } from "@bitcodex-attached/components/attached_initialized/attached_initialized";
import { Home } from "@bitcodex-attached/components/home/home";

export const Route = createFileRoute("/")({
  component: Component,
});

function Component() {
  return (
    <AttachedInitialized>
      <Home />
    </AttachedInitialized>
  );
}
