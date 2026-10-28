import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { ArrowRightOutlinedIcon } from "@bitcodex/bitcodex-common-ui/icons/arrow_right_outlined";
import { BobitcodexpenIcon } from "@bitcodex/bitcodex-common-ui/icons/book_open";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import type { FC } from "react";

import { Widget } from "../widget_components";
import styles from "./docs_widget.module.scss";

export const DocsWidget: FC = () => {
  const { isSignedIn } = useBitcodeX();

  const handleOpenDocs = () => {
    window.open(process.env.NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT, "_blank");
  };

  return (
    <Widget>
      <div className={styles.container}>
        <div className={styles.title}>
          <BobitcodexpenIcon size={16} color="#ED6B25" />
          <Typography tagType="h3" size="md" weight="semibold" color="primary">
            Build with BitcodeX
          </Typography>
        </div>

        <Typography
          size="sm"
          weight="medium"
          color="tertiary"
          className={styles.content}
        >
          Explore the SDK, APIs, and integration guides to start building.
        </Typography>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={handleOpenDocs}
        >
          Open Docs
          <ArrowRightOutlinedIcon
            color={isSignedIn ? "var(--fg-quaternary)" : "var(--brand-300)"}
            className={styles.arrowIcon}
          />
        </Button>
      </div>
    </Widget>
  );
};
