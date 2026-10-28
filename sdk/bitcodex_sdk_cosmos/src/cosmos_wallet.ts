import { BitcodeXCosmosWallet } from "./constructor";
import { init } from "./static/init";
import { enable } from "@bitcodex-sdk-cosmos/methods/enable";
import { experimentalSuggestChain } from "@bitcodex-sdk-cosmos/methods/experimental_suggest_chain";
import { getAccounts } from "@bitcodex-sdk-cosmos/methods/get_accounts";
import { getCosmosChainInfo } from "@bitcodex-sdk-cosmos/methods/get_cosmos_chain_info";
import { getKey } from "@bitcodex-sdk-cosmos/methods/get_key";
import { getKeysSettled } from "@bitcodex-sdk-cosmos/methods/get_keys_settled";
import { getOfflineSigner } from "@bitcodex-sdk-cosmos/methods/get_offline_signer";
import { getOfflineSignerAuto } from "@bitcodex-sdk-cosmos/methods/get_offline_signer_auto";
import { getOfflineSignerOnlyAmino } from "@bitcodex-sdk-cosmos/methods/get_offline_signer_only_amino";
import { getPublicKey } from "@bitcodex-sdk-cosmos/methods/get_public_key";
import { off } from "@bitcodex-sdk-cosmos/methods/off";
import { on } from "@bitcodex-sdk-cosmos/methods/on";
import { openModal } from "@bitcodex-sdk-cosmos/methods/open_modal";
import { sendTx } from "@bitcodex-sdk-cosmos/methods/send_tx";
import { signAmino } from "@bitcodex-sdk-cosmos/methods/sign_amino";
import { signArbitrary } from "@bitcodex-sdk-cosmos/methods/sign_arbitrary";
import { signDirect } from "@bitcodex-sdk-cosmos/methods/sign_direct";
import { verifyArbitrary } from "@bitcodex-sdk-cosmos/methods/verify_arbitrary";
import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

BitcodeXCosmosWallet.init = init;

const ptype: BitcodeXCosmosWalletInterface = BitcodeXCosmosWallet.prototype;

ptype.enable = enable;
ptype.on = on;
ptype.off = off;
ptype.getPublicKey = getPublicKey;
ptype.getCosmosChainInfo = getCosmosChainInfo;
ptype.experimentalSuggestChain = experimentalSuggestChain;
ptype.getAccounts = getAccounts;
ptype.getOfflineSigner = getOfflineSigner;
ptype.getOfflineSignerOnlyAmino = getOfflineSignerOnlyAmino;
ptype.getOfflineSignerAuto = getOfflineSignerAuto;
ptype.getKey = getKey;
ptype.getKeysSettled = getKeysSettled;
ptype.sendTx = sendTx;
ptype.signAmino = signAmino;
ptype.signDirect = signDirect;
ptype.signArbitrary = signArbitrary;
ptype.verifyArbitrary = verifyArbitrary;
ptype.openModal = openModal;

export { BitcodeXCosmosWallet };
