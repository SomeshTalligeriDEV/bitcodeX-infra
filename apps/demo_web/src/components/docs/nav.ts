export interface DocsLink {
  href: string;
  title: string;
}

export const DOCS_NAV: { section: string; links: DocsLink[] }[] = [
  {
    section: "Start here",
    links: [
      { href: "/docs", title: "Introduction" },
      { href: "/docs/quickstart", title: "Quickstart" },
    ],
  },
  {
    section: "SDK",
    links: [
      { href: "/docs/react", title: "React hooks" },
      { href: "/docs/wallet-api", title: "Wallet API" },
      { href: "/docs/hotkeys-staking", title: "Hotkeys, staking, permissions" },
      { href: "/docs/server", title: "Server: verify users" },
    ],
  },
  {
    section: "Run it",
    links: [
      { href: "/docs/networks", title: "Networks & testnet TAO" },
      { href: "/docs/self-host", title: "Self-host & deploy" },
      { href: "/docs/security", title: "Security model" },
      { href: "/docs/status", title: "Status: what is real" },
    ],
  },
];

export const DOCS_FLAT: DocsLink[] = DOCS_NAV.flatMap((s) => s.links);
