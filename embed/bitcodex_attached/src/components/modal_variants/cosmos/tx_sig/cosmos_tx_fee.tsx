import { Skeleton } from "@bitcodex/bitcodex-common-ui/skeleton";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { ChainInfoForAttachedModal } from "@bitcodex/bitcodex-sdk-core";
import type { StdSignDoc } from "@keplr-wallet/types";
import cn from "classnames";
import type { FC } from "react";

import styles from "./cosmos_tx_fee.module.scss";
import type { InsufficientBalanceFee } from "./types";
import { useGetFee } from "@bitcodex-attached/web3/cosmos/use_get_fee";

export const CosmosTxFee: FC<CosmosTxFeeProps> = ({
  chainInfo,
  signDocJson,
  forceIsLoading,
  insufficientBalanceFee,
}) => {
  const { feePretty, isLoading } = useGetFee({
    signDocJson,
    chainInfo,
  });

  const isInsufficientBalanceHavingError =
    !forceIsLoading && !isLoading && !feePretty;

  return (
    <div className={styles.feeSummaryContainer}>
      <div className={styles.feeContainer}>
        <Typography color="tertiary" size="xs" weight="medium">
          Fee
        </Typography>
        {isLoading || forceIsLoading ? (
          <Skeleton width="100px" className="skeleton--text-md" />
        ) : (
          <Typography color="tertiary" size="xs" weight="medium">
            {isInsufficientBalanceHavingError
              ? insufficientBalanceFee?.amount.maxDecimals(6).toString()
              : (feePretty?.maxDecimals(6).toString() ?? "-")}
          </Typography>
        )}
      </div>
      {isInsufficientBalanceHavingError && (
        <div className={cn(styles.errorMessage, "common-list-scroll")}>
          <Typography color="warning-primary" size="xs" weight="medium">
            Insufficient balance to cover the transaction
          </Typography>
        </div>
      )}
    </div>
  );
};

export interface CosmosTxFeeProps {
  // payload: CosmosTxSignPayload;
  chainInfo: ChainInfoForAttachedModal;
  signDocJson: StdSignDoc;
  forceIsLoading?: boolean;
  modalId: string;
  insufficientBalanceFee: InsufficientBalanceFee | null;
}
