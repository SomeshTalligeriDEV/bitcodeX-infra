import type {
  BitcodeXEIP1193Provider,
  BitcodeXEthWalletInitArgs,
  BitcodeXEthWalletInterface,
} from "@bitcodex/bitcodex-sdk-eth";
import {
  connectorsForWallets,
  type Wallet,
  type WalletDetailsParams,
} from "@rainbow-me/rainbowkit";
import { type Address, createClient, getAddress, http, toHex } from "viem";
import { sepolia } from "viem/chains";
import { type CreateConnectorFn, createConfig, createConnector } from "wagmi";

import bitcodexIcon from "@/public/icon.svg";

export const defaultWallets = [
  toBitcodeX({
    api_key: process.env.NEXT_PUBLIC_BITCODEX_API_KEY ?? "",
    sdk_endpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT ?? undefined,
  }),
];

function toBitcodeX(args: BitcodeXEthWalletInitArgs): () => Wallet {
  return () => ({
    id: "bitcodex",
    name: "BitcodeX",
    // TODO:
    iconUrl: (bitcodexIcon as any).src,
    shortName: "BitcodeX",
    rdns: "bitcodex.app",
    iconBackground: "#0c2f78",
    installed: true,
    createConnector: (walletDetails) => bitcodexConnector(walletDetails, args),
  });
}

export interface WalletConnectOptions {
  projectId: string;
}

function bitcodexConnector(
  walletDetails: WalletDetailsParams,
  args: BitcodeXEthWalletInitArgs,
): CreateConnectorFn {
  let bitcodexEth: BitcodeXEthWalletInterface | null = null;
  let cachedProvider: BitcodeXEIP1193Provider | null = null;

  async function initBitcodeXEthOnce(): Promise<BitcodeXEthWalletInterface> {
    if (bitcodexEth) {
      return bitcodexEth;
    }

    const { BitcodeXEthWallet } = await import("@bitcodex/bitcodex-sdk-eth");
    const initRes = BitcodeXEthWallet.init(args);

    if (!initRes.success) {
      throw new Error(`init fail: ${initRes.err}`);
    }

    // NOTE: order matters, wait until initialized before setting bitcodexEth
    await initRes.data.waitUntilInitialized;

    bitcodexEth = initRes.data;

    return bitcodexEth;
  }

  return createConnector<BitcodeXEIP1193Provider>((config) => {
    const wallet = {
      id: "bitcodex",
      name: "BitcodeX",
      type: "bitcodex" as const,
      icon: (bitcodexIcon as any).src,
      setup: async () => {
        // Only setup in browser environment
        if (typeof window !== "undefined") {
          await initBitcodeXEthOnce();
        } else {
          console.log("bitcodex can only be initialized in browser");
        }
      },
      connect: async <WithCapabilities extends boolean = false>(parameters?: {
        chainId?: number | undefined;
        isReconnecting?: boolean | undefined;
        withCapabilities?: WithCapabilities | boolean | undefined;
      }) => {
        if (!bitcodexEth) {
          await initBitcodeXEthOnce();

          // DO NOT fallthrough here to manually retry connect
          // as popup on safari will be blocked by async initialization
          throw new Error("bitcodex just initialized");
        }

        let accounts = await wallet.getAccounts();

        if (accounts.length === 0) {
          if (parameters?.isReconnecting) {
            return {
              accounts: accounts as unknown as WithCapabilities extends true
                ? readonly {
                    address: Address;
                    capabilities: Record<string, unknown>;
                  }[]
                : readonly Address[],
              chainId: await wallet.getChainId(),
            };
          }

          await bitcodexEth.bitcodexWallet.signIn("google");
        }

        const chainId = await wallet.getChainId();

        accounts = await wallet.getAccounts();

        return {
          accounts: accounts as unknown as WithCapabilities extends true
            ? readonly {
                address: Address;
                capabilities: Record<string, unknown>;
              }[]
            : readonly Address[],
          chainId,
        };
      },
      disconnect: async () => {
        const provider = await wallet.getProvider();
        provider.removeListener("accountsChanged", wallet.onAccountsChanged);
        provider.removeListener("chainChanged", wallet.onChainChanged);

        if (bitcodexEth) {
          await bitcodexEth.bitcodexWallet.signOut();
        }
      },
      getAccounts: async () => {
        const provider = await wallet.getProvider();
        const accounts = await provider.request({
          method: "eth_accounts",
        });
        return accounts.map((x: string) => getAddress(x));
      },
      getChainId: async () => {
        const provider = await wallet.getProvider();
        const chainId = await provider.request({
          method: "eth_chainId",
        });
        return Number(chainId);
      },
      getProvider: async () => {
        if (cachedProvider) {
          return cachedProvider;
        }

        const bitcodexEth = await initBitcodeXEthOnce();

        cachedProvider = await bitcodexEth.getEthereumProvider();

        cachedProvider.on("chainChanged", (chainId) => {
          wallet.onChainChanged(chainId);
        });

        cachedProvider.on("accountsChanged", (accounts) => {
          wallet.onAccountsChanged(accounts);
        });

        return cachedProvider;
      },
      isAuthorized: async () => {
        const accounts = await wallet.getAccounts();
        return accounts.length > 0;
      },
      switchChain: async ({ chainId }: { chainId: number }) => {
        const chain = config.chains.find((network) => network.id === chainId);
        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }

        const provider = await wallet.getProvider();
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: toHex(chainId) }],
        });

        return chain;
      },
      onAccountsChanged: (accounts: string[]) => {
        if (accounts.length === 0) {
          wallet.onDisconnect();
        } else {
          config.emitter.emit("change", {
            accounts: accounts.map((x: string) => getAddress(x)),
          });
        }
      },
      onChainChanged: (chainId: string | number) => {
        const chainIdNumber = Number(chainId);
        config.emitter.emit("change", { chainId: chainIdNumber });
      },
      onDisconnect: () => {
        config.emitter.emit("disconnect");
      },
      ...walletDetails,
    };

    return wallet;
  });
}

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: connectorsForWallets(
    [
      {
        groupName: "Supported Wallets",
        wallets: defaultWallets,
      },
    ],
    {
      appName: "BitcodeX EVM Wagmi Template",
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
    },
  ),
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});
