import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { BitcodeXLogoColorIcon } from "@bitcodex/bitcodex-common-ui/icons/bitcodex_logo_color_icon";
import { BitcodeXLogoIcon } from "@bitcodex/bitcodex-common-ui/icons/bitcodex_logo_icon";
import { ChevronRightIcon } from "@bitcodex/bitcodex-common-ui/icons/chevron_right";
import { DiscordIcon } from "@bitcodex/bitcodex-common-ui/icons/discord_icon";
import { ExternalLinkOutlinedIcon } from "@bitcodex/bitcodex-common-ui/icons/external_link_outlined";
import { GithubIcon } from "@bitcodex/bitcodex-common-ui/icons/github_icon";
import { GoogleIcon } from "@bitcodex/bitcodex-common-ui/icons/google_icon";
import { TelegramIcon } from "@bitcodex/bitcodex-common-ui/icons/telegram_icon";
import { XIcon } from "@bitcodex/bitcodex-common-ui/icons/x_icon";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { type FC, Fragment } from "react";

import styles from "./login_widget.module.scss";
import { useThemeState } from "@bitcodex-demo-web/state/theme";
import type { LoginMethod } from "@bitcodex-demo-web/types/login";

export interface LoginDefaultViewProps {
  onSignIn: (method: LoginMethod) => void;
  onShowSocials: () => void;
}

export const LoginDefaultView: FC<LoginDefaultViewProps> = ({
  onSignIn,
  onShowSocials,
}) => {
  const theme = useThemeState((state) => state.theme);

  return (
    <Fragment>
      <div className={styles.logoWrapper}>
        <Typography size="sm" weight="medium" color="primary">
          Login or sign up
        </Typography>
        <BitcodeXLogoColorIcon width={84} height={32} theme={theme} />
      </div>

      <div className={styles.loginMethodsWrapper}>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => onSignIn("google")}
        >
          <GoogleIcon width={20} height={20} />
          Google
        </Button>

        {/* Email OTP is disabled: it needs an Auth0 tenant we do not run. */}
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => onSignIn("github")}
        >
          <GithubIcon size={20} />
          GitHub
        </Button>

        <Button variant="secondary" size="md" fullWidth onClick={onShowSocials}>
          <div className={styles.socialIconWrapper}>
            <TelegramIcon size={16} />
            <XIcon size={16} />
            <DiscordIcon size={16} />
            <GithubIcon size={16} />
          </div>
          <Typography
            size="sm"
            weight="semibold"
            color="secondary"
            style={{ padding: "0 2px" }}
          >
            Other Socials
          </Typography>
          <ChevronRightIcon size={20} color={"var(--fg-quaternary)"} />
        </Button>
      </div>

      <Spacing height={28} />

      <div className={styles.getSupportRow}>
        <BitcodeXLogoIcon width={47} height={18} theme={theme} />
        <a
          href="https://bitcodexwallet.userjot.com/board/report-bugs"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.supportLink}
        >
          <Typography
            tagType="span"
            size="xs"
            weight="medium"
            color="secondary"
          >
            Get support
          </Typography>
          <ExternalLinkOutlinedIcon className={styles.supportIcon} />
        </a>
      </div>
    </Fragment>
  );
};
