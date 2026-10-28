import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import "./globals.scss";
import "@bitcodex/bitcodex-common-ui/styles/colors.scss";
import "@bitcodex/bitcodex-common-ui/styles/typography.scss";
import "@bitcodex/bitcodex-common-ui/styles/shadow.scss";
import "@bitcodex/bitcodex-common-ui/styles/animation.scss";

import { themeInitScript } from "@bitcodex-demo-web/state/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BitcodeX Demo",
  description: "BitcodeX Demo",
  icons: {
    icon: "/bitcodex_favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "http://localhost:3200",
    title: "BitcodeX Demo",
    description: "BitcodeX Demo",
    siteName: "BitcodeX Demo",
    images: [
      {
        url: "http://localhost:9000/bitcodex-assets/assets/bitcodex-demo-og-image.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // To prevent flickering in dark mode or light mode in Next.js, an inline script is required.
    // The reason is that even when using LayoutEffect in React, it executes after hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: injecting theme init script */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
