import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import type { PluginOptions } from "@signalwire/docusaurus-plugin-llms-txt/public";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "BitcodeX Docs",
  tagline: "Integrate BitcodeX into your dApp",
  favicon: "img/bitcodex-favicon.svg",

  future: {
    v4: true,
  },
  url: "http://localhost:3205",
  baseUrl: "/",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: "og:type",
        content: "website",
      },
      {
        name: "og:image",
        content:
          "http://localhost:9000/bitcodex-assets/assets/bitcodex-docs-og-image.png",
      },
      { name: "algolia-site-verification", content: "3DDD6577E7B1AAA8" },
    ],
    navbar: {
      logo: {
        alt: "BitcodeX Logo",
        src: "img/bitcodex-logo-light.svg",
        srcDark: "img/bitcodex-logo-dark.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "BitcodeX",
          items: [
            {
              label: "Github",
              href: "https://github.com/SomeshTalligeriDEV/bitcodeX-infra",
            },
          ],
        },
        {
          title: "Keplr",
          items: [
            {
              label: "Keplr",
              href: "https://www.keplr.app",
            },
          ],
        },
        {
          title: "Need Help?",
          items: [
            {
              label: "BitcodeX integration support",
              href: "https://bitcodexwallet.userjot.com/board/integration-support-inquiries",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Keplr`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash"],
    },
    algolia: {
      appId: "XFC1T7WVOO",
      // Public API key: it is safe to commit it
      apiKey: "84cedabc63e83c9aaea60a9066222a2e",
      indexName: "BitcodeX Docs",
    },
  } satisfies Preset.ThemeConfig,
  themes: ["@signalwire/docusaurus-theme-llms-txt"],
  plugins: [
    [
      "@signalwire/docusaurus-plugin-llms-txt",
      {
        llmsTxt: {
          enableLlmsFullTxt: true,
        },
        ui: {
          copyPageContent: {
            contentStrategy: "prefer-markdown",
            display: {
              docs: true,
            },
          },
        },
      } satisfies PluginOptions,
    ],
  ],
};

export default config;
