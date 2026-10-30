import { CHAIN_ID } from "@bitcodex-demo-web/bittensor_network";

export type Method = "google" | "github";

// Shown only when a GitHub OAuth app is configured on the server.
export const GITHUB_ENABLED = process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true";
/** Sign-in providers shown for completeness but not built yet. Rendered disabled and tagged "Soon". */
export const SOON_PROVIDERS = [
  { id: "discord", label: "Discord", mark: "DC" },
  { id: "x", label: "X (Twitter)", mark: "X" },
  { id: "telegram", label: "Telegram", mark: "TG" },
  { id: "linkedin", label: "LinkedIn", mark: "in" },
] as const;

// Optional: a testnet faucet website to send users to (no official one is listed).
export const FAUCET_URL = process.env.NEXT_PUBLIC_TESTNET_FAUCET_URL || "";

// "mono" = black-and-white (the BitcodeX default); the rest preview an app's brand colour.
export const ACCENTS = ["mono", "#7F56D9", "#2E90FA", "#12B76A", "#ED6B25"];

export interface Custom {
  methods: Method[];
  accent: string;
  theme: "light" | "dark" | "system";
  logoUrl: string;
}

export const DEFAULT_CUSTOM: Custom = {
  methods: ["google"],
  accent: "mono",
  theme: "system",
  logoUrl: "",
};

/** The exact provider and login code for the current settings (the "Export" card). */
export function exportSnippet(c: Custom): string {
  const social = c.methods;
  const lines = [
    `<BitcodeXProvider`,
    `  config={{`,
    `    apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY,`,
    `    sdkEndpoint: "https://wallet.your-domain.com",`,
    `    bittensor: { chainId: "${CHAIN_ID}" },`,
    `  }}`,
    `>`,
    `  <App />`,
    `</BitcodeXProvider>`,
    ``,
    `// Client-side login window settings`,
    `openSignInModal({`,
    `  loginMethods: ${JSON.stringify(social)},`,
    c.accent === "mono"
      ? `  // accent: black and white (default)`
      : `  accentColor: "${c.accent}",`,
    `  theme: "${c.theme}",${c.logoUrl.trim() ? `\n  logoUrl: "${c.logoUrl.trim()}",` : ""}`,
    `});`,
  ];
  return lines.join("\n");
}
