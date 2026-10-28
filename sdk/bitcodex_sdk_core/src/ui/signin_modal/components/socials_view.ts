import { htmlFromString } from "../dom_utils";
import {
  AppleIcon,
  ChevronLeftIcon,
  DiscordIcon,
  GithubIcon,
  TelegramIcon,
  XIcon,
} from "./icons";
import { createProviderButton } from "./provider_button";
import type { SignInType } from "@bitcodex-sdk-core/types/oauth";

export interface SocialsViewOptions {
  onSelect: (provider: SignInType) => void;
  onBack: () => void;
}

export function createSocialsView(options: SocialsViewOptions): HTMLDivElement {
  const { onSelect, onBack } = options;

  const el = htmlFromString<HTMLDivElement>(`
    <div class="bitcodex-socials-view">
      <div class="bitcodex-back-row">
        <button class="bitcodex-back-btn" type="button"></button>
        <span class="bitcodex-back-title">Login or sign up</span>
      </div>
      <div class="bitcodex-provider-list bitcodex-socials-list"></div>
    </div>
  `);

  const backBtn = el.querySelector(".bitcodex-back-btn")!;
  backBtn.appendChild(ChevronLeftIcon());
  backBtn.addEventListener("click", onBack);

  el.querySelector(".bitcodex-provider-list")!.append(
    createProviderButton({
      icon: XIcon(),
      label: "X",
      onClick: () => onSelect("x"),
    }),
    createProviderButton({
      icon: TelegramIcon(),
      label: "Telegram",
      onClick: () => onSelect("telegram"),
    }),
    createProviderButton({
      icon: DiscordIcon(),
      label: "Discord",
      onClick: () => onSelect("discord"),
    }),
    createProviderButton({
      icon: GithubIcon(),
      label: "GitHub",
      onClick: () => onSelect("github"),
    }),
    createProviderButton({
      icon: AppleIcon(),
      label: "Apple",
      disabled: true,
    }),
  );

  return el;
}
