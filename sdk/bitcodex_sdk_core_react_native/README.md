# @bitcodex/bitcodex-sdk-core-react-native

React Native SDK for [BitcodeX](https://bitcodex.invalid) — an embedded wallet powered by
MPC threshold signatures. Uses the OS browser (ASWebAuthenticationSession on
iOS, Chrome Custom Tabs on Android) for authentication and signing instead of
a WebView.

## Installation

```bash
npm install @bitcodex/bitcodex-sdk-core-react-native
```

### Peer Dependencies

| Package | Version | Required |
| --- | --- | --- |
| `react` | >=18 | Yes |
| `react-native` | >=0.70 | Yes |
| `@react-native-async-storage/async-storage` | >=1.17 | Yes |
| `react-native-get-random-values` | >=1 | Yes |
| `expo-web-browser` | >=14 | No (Expo projects) |
| `react-native-inappbrowser-reborn` | >=3 | No (Bare RN projects) |

One of `expo-web-browser` or `react-native-inappbrowser-reborn` is required.

## Usage

```tsx
import { BitcodeXWalletProvider, useBitcodeXWallet } from "@bitcodex/bitcodex-sdk-core-react-native";

function App() {
  return (
    <BitcodeXWalletProvider apiKey="your-api-key">
      <SignIn />
    </BitcodeXWalletProvider>
  );
}

function SignIn() {
  const wallet = useBitcodeXWallet();

  const handleSignIn = async () => {
    await wallet.signIn("google");
    const info = await wallet.getWalletInfo();
    console.log("Signed in:", info?.email);
  };

  return <Button title="Sign In" onPress={handleSignIn} />;
}
```

### Chain-Specific SDKs

The chain SDKs work with the RN wallet instance:

```bash
npm install @bitcodex/bitcodex-sdk-eth     # Ethereum / EVM
npm install @bitcodex/bitcodex-sdk-cosmos  # Cosmos
npm install @bitcodex/bitcodex-sdk-svm     # Solana
```

```tsx
import { useBitcodeXWallet } from "@bitcodex/bitcodex-sdk-core-react-native";
import { BitcodeXEthWallet } from "@bitcodex/bitcodex-sdk-eth";

const wallet = useBitcodeXWallet();
const eth = new BitcodeXEthWallet(wallet);
```

## Documentation

For the complete setup guide, platform configuration, and API reference:

- [React Native Integration](http://localhost:3205/docs/v0/sdk-usage/mobile/react-native-integration)
- [React Native Platform Setup](http://localhost:3205/docs/v0/sdk-usage/mobile/react-native-platform-setup)
