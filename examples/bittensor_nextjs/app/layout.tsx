import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BitcodeX Bittensor Template",
  description: "Sign in with Google and get a Bittensor wallet, with BitcodeX.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
