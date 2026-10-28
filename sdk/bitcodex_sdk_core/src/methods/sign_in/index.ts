import { handleDiscordSignIn } from "./discord";
import { handleEmailSignIn } from "./email";
import { EMAIL_LOGIN_ENABLED } from "./flags";
import { handleGithubSignIn } from "./github";
import { handleGoogleSignIn } from "./google";
import { handleTelegramSignIn } from "./telegram";
import { handleXSignIn } from "./x";
import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import type { SignInType } from "@bitcodex-sdk-core/types/oauth";

export async function signIn(
  this: BitcodeXWalletWebInterface,
  type: SignInType,
) {
  // NOTE: Do NOT await before calling handlers that use window.open().
  // Awaiting here loses the user gesture context, causing browsers to
  // open a new tab instead of a popup window.

  try {
    switch (type) {
      case "google":
        await handleGoogleSignIn(this);
        break;
      case "email":
        if (!EMAIL_LOGIN_ENABLED) {
          throw new Error("email login is disabled: no email OTP backend");
        }
        await handleEmailSignIn(this);
        break;
      case "x":
        await handleXSignIn(this);
        break;
      case "telegram":
        await handleTelegramSignIn(this);
        break;
      case "discord":
        await handleDiscordSignIn(this);
        break;
      case "github":
        await handleGithubSignIn(this);
        break;
      default:
        throw new Error(`not supported sign in type, type: ${type}`);
    }
  } catch (err) {
    throw new Error(`Sign in error, err: ${err}`);
  }

  const walletInfo = await this.getWalletInfo();

  if (!walletInfo) {
    return;
  }

  this.state = {
    authType: walletInfo.authType,
    publicKey: walletInfo.publicKey,
    email: walletInfo.email,
    name: walletInfo.name,
  };

  if (walletInfo.authType && walletInfo.publicKey) {
    console.log("[bitcodex] emit CORE__accountsChanged");

    this.eventEmitter.emit({
      type: "CORE__accountsChanged",
      authType: walletInfo.authType,
      publicKey: walletInfo.publicKey,
      email: walletInfo.email,
      name: walletInfo.name,
    });
  }
}
