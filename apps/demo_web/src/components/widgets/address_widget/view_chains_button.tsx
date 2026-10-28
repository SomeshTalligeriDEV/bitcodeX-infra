import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { CosmosIcon } from "@bitcodex/bitcodex-common-ui/icons/cosmos_icon";
import { EthereumBlueIcon } from "@bitcodex/bitcodex-common-ui/icons/ethereum_blue_icon";
import { OsmosisIcon } from "@bitcodex/bitcodex-common-ui/icons/osmosis_icon";
import { SolanaIcon } from "@bitcodex/bitcodex-common-ui/icons/solana_icon";
import type { FC } from "react";

import styles from "./view_chains_button.module.scss";

export const ViewChainsButton: FC<ViewChainsButtonProps> = ({ onClick }) => {
  return (
    <Button onClick={onClick} variant="secondary" fullWidth>
      <div className={styles.icons}>
        <EthereumBlueIcon />
        <CosmosIcon />
        <OsmosisIcon />
        <SolanaIcon />
      </div>
      View Supported Chains
    </Button>
  );
};

export interface ViewChainsButtonProps {
  onClick?: () => void;
}
