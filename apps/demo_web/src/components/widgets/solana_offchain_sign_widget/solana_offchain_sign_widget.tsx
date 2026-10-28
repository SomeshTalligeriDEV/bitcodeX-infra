import { SolanaIcon } from "@bitcodex/bitcodex-common-ui/icons/solana_icon";
import { useBitcodeXSvm } from "@bitcodex/bitcodex-sdk-react/svm";

// import styles from "../sign_widget/sign_widget.module.scss";
import { SignWidget } from "@bitcodex-demo-web/components/widgets/sign_widget/sign_widget";

export const SolanaOffchainSignWidget = () => {
  const { svmWallet: bitcodexSvm } = useBitcodeXSvm();

  const handleClickSolOffchainSign = async () => {
    if (bitcodexSvm === null) {
      throw new Error("bitcodexSvm is not initialized");
    }

    // Connect if not already connected
    if (!bitcodexSvm.connected) {
      await bitcodexSvm.connect();
    }

    const message =
      "Welcome to BitcodeX! Try generating an Ed25519 MPC signature.";
    const messageBytes = new TextEncoder().encode(message);

    const signature = await bitcodexSvm.signMessage(messageBytes);

    // Log signature for demo purposes
    console.log("Solana signature:", Buffer.from(signature).toString("hex"));
  };

  return (
    <SignWidget
      chain="Solana"
      chainIcon={<SolanaIcon />}
      signType="offchain"
      signButtonOnClick={handleClickSolOffchainSign}
      // badge={<span className={styles.badge}>Rialo</span>}
    />
  );
};
