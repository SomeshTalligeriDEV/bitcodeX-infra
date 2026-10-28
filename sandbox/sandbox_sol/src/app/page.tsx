"use client";

import ConnectedView from "@/components/ConnectedView";
import LoginView from "@/components/LoginView";
import { useBitcodeXSvm } from "@/hooks/use_bitcodex_svm";

export default function Home() {
  const {
    isInitialized,
    isInitializing,
    isConnected,
    publicKey,
    connect,
    disconnect,
  } = useBitcodeXSvm();

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      {!isConnected ? (
        <LoginView
          isInitialized={isInitialized}
          isInitializing={isInitializing}
          onConnect={connect}
        />
      ) : (
        <ConnectedView publicKey={publicKey!} onDisconnect={disconnect} />
      )}
    </main>
  );
}
