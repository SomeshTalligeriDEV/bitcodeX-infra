import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import "./globals.scss";
import "@bitcodex/bitcodex-common-ui/styles/colors.scss";
import "@bitcodex/bitcodex-common-ui/styles/typography.scss";
import "@bitcodex/bitcodex-common-ui/styles/shadow.scss";
import "@bitcodex/bitcodex-common-ui/styles/animation.scss";

import { Auth } from "@bitcodex-admin/components/auth";
import { GlobalHeader } from "@bitcodex-admin/components/global_header/global_header";
import { MainFrame } from "@bitcodex-admin/components/main_frame/main_frame";
import { TopProvider } from "@bitcodex-admin/components/top_provider/top_provider";

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
  title: "BitcodeX Admin",
  description: "BitcodeX Admin",
  icons: {
    icon: "/bitcodex_favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "http://localhost:3204",
    title: "BitcodeX Admin",
    description: "BitcodeX Admin",
    siteName: "BitcodeX Admin",
    images: [
      {
        url: "http://localhost:9000/bitcodex-assets/assets/bitcodex-og-image.png",
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
        <TopProvider>
          <Auth>
            <MainFrame>
              <GlobalHeader />
              {children}
            </MainFrame>
          </Auth>
        </TopProvider>
      </body>
    </html>
  );
}
