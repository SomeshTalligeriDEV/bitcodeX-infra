import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "@bitcodex/bitcodex-common-ui/styles/colors.scss";
import "@bitcodex/bitcodex-common-ui/styles/typography.scss";
import "@bitcodex/bitcodex-common-ui/styles/shadow.scss";
import "@bitcodex/bitcodex-common-ui/styles/animation.scss";

import { Providers } from "@bitcodex-user-dashboard/components/providers/providers";

import "./globals.scss";

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

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BitcodeX Home",
  description: "BitcodeX Home",
  icons: {
    icon: "/bitcodex_favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "http://localhost:3206",
    title: "BitcodeX Home",
    description: "BitcodeX Home",
    siteName: "BitcodeX Home",
    images: [
      {
        url: "http://localhost:9000/bitcodex-assets/assets/bitcodex-dapp-og-image.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${robotoMono.variable}`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
