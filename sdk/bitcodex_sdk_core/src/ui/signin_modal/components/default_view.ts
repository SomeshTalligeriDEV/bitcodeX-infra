import { htmlFromString } from "../dom_utils";
import { S3_LOGO_URL, S3_LOGO_WITH_NAME_URL } from "../icons";
import type { ResolvedTheme } from "../types";
import {
  AppleSmallIcon,
  ChevronRightIcon,
  EmailIcon,
  ExternalLinkIcon,
  GithubIcon,
  GoogleIcon,
  TelegramSmallIcon,
  XSmallIcon,
} from "./icons";
import { createProviderButton } from "./provider_button";
import { EMAIL_LOGIN_ENABLED } from "@bitcodex-sdk-core/methods/sign_in/flags";
import type { SignInType } from "@bitcodex-sdk-core/types/oauth";

export interface DefaultViewOptions {
  theme: ResolvedTheme;
  onSelect: (provider: SignInType) => void;
  onShowSocials: () => void;
}

export function createDefaultView(options: DefaultViewOptions): HTMLDivElement {
  const { theme, onSelect, onShowSocials } = options;

  const el = htmlFromString<HTMLDivElement>(`
    <div class="bitcodex-default-view">
      <div class="bitcodex-logo-wrapper">
        <img src="${S3_LOGO_URL[theme]}" alt="BitcodeX" width="84" height="32" />
      </div>
      <div class="bitcodex-provider-list"></div>
      <div class="bitcodex-modal-footer">
        <img
          class="bitcodex-footer-logo"
          src="${S3_LOGO_WITH_NAME_URL[theme]}"
          alt="BitcodeX"
          width="52"
          height="20"
        />
        <a
          class="bitcodex-footer-link"
          href="https://bitcodexwallet.userjot.com/board/report-bugs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get support
          <span class="bitcodex-external-icon"></span>
        </a>
      </div>
    </div>
  `);

  const providerList = el.querySelector(".bitcodex-provider-list")!;
  if (EMAIL_LOGIN_ENABLED) {
    providerList.append(
      createProviderButton({
        icon: EmailIcon(),
        label: "Email",
        onClick: () => onSelect("email"),
      }),
    );
  }
  providerList.append(
    createProviderButton({
      icon: GoogleIcon(),
      label: "Google",
      onClick: () => onSelect("google"),
    }),
    createProviderButton({
      icon: GithubIcon(),
      label: "GitHub",
      onClick: () => onSelect("github"),
    }),
    createSocialsButton(onShowSocials),
  );

  el.querySelector(".bitcodex-external-icon")!.appendChild(ExternalLinkIcon());

  return el;
}

function createSocialsButton(onShowSocials: () => void): HTMLButtonElement {
  const btn = htmlFromString<HTMLButtonElement>(`
    <button class="bitcodex-provider-btn" type="button">
      <span class="bitcodex-social-icons-wrapper">
        <span class="bitcodex-social-icon" data-icon="x"></span>
        <span class="bitcodex-social-icon" data-icon="telegram"></span>
        <span class="bitcodex-social-icon" data-icon="apple"></span>
      </span>
      <span class="bitcodex-provider-label">Other Socials</span>
      <span class="bitcodex-chevron-icon"></span>
    </button>
  `);

  btn.addEventListener("click", onShowSocials);

  btn.querySelector('[data-icon="x"]')!.appendChild(XSmallIcon());
  btn.querySelector('[data-icon="telegram"]')!.appendChild(TelegramSmallIcon());
  btn.querySelector('[data-icon="apple"]')!.appendChild(AppleSmallIcon());
  btn.querySelector(".bitcodex-chevron-icon")!.appendChild(ChevronRightIcon());

  return btn;
}
