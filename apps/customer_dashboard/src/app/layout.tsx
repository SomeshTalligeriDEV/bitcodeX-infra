import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import "./globals.scss";
import "@bitcodex/bitcodex-common-ui/styles/colors.scss";
import "@bitcodex/bitcodex-common-ui/styles/typography.scss";
import "@bitcodex/bitcodex-common-ui/styles/shadow.scss";
import "@bitcodex/bitcodex-common-ui/styles/animation.scss";

import { Providers } from "@bitcodex-ct-dashboard/components/providers/providers";

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
  title: "BitcodeX dApp Dashboard",
  description: "BitcodeX dApp Dashboard",
  icons: {
    icon: "/bitcodex_favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "http://localhost:3203",
    title: "BitcodeX dApp Dashboard",
    description: "BitcodeX dApp Dashboard",
    siteName: "BitcodeX dApp Dashboard",
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
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
