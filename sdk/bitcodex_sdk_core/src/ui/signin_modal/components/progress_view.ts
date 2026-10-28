import { htmlFromString } from "../dom_utils";
import {
  DiscordIcon,
  EmailIcon,
  GithubIcon,
  GoogleIcon,
  SpinnerFailedIcon,
  SpinnerLoadingIcon,
  TelegramIcon,
  XIcon,
} from "./icons";
import type { SignInType } from "@bitcodex-sdk-core/types/oauth";

export interface ProgressViewOptions {
  status: "loading" | "failed";
  provider: SignInType;
  onRetry: () => void;
}

const PROVIDER_ICONS: Record<SignInType, () => SVGSVGElement> = {
  email: EmailIcon,
  google: GoogleIcon,
  x: XIcon,
  telegram: TelegramIcon,
  discord: DiscordIcon,
  github: GithubIcon,
};

export function createProgressView(
  options: ProgressViewOptions,
): HTMLDivElement {
  const { status, provider, onRetry } = options;
  const isLoading = status === "loading";

  const el = htmlFromString<HTMLDivElement>(`
    <div class="bitcodex-progress-view">
      <div class="bitcodex-progress-circle">
        <span class="bitcodex-provider-icon"></span>
        <span class="bitcodex-spinner-overlay${isLoading ? " bitcodex-spinning" : ""}"></span>
      </div>
      <div class="bitcodex-progress-text">${isLoading ? "Signing in" : "Login failed"}</div>
    </div>
  `);

  el.querySelector(".bitcodex-provider-icon")!.appendChild(
    PROVIDER_ICONS[provider](),
  );
  el.querySelector(".bitcodex-spinner-overlay")!.appendChild(
    isLoading ? SpinnerLoadingIcon() : SpinnerFailedIcon(),
  );

  if (status === "failed") {
    const retryBtn = htmlFromString<HTMLButtonElement>(
      `<button class="bitcodex-retry-btn" type="button">Retry</button>`,
    );
    retryBtn.addEventListener("click", onRetry);
    el.appendChild(retryBtn);
  }

  return el;
}
