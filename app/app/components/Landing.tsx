"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAccount, useConnect, type Connector } from "wagmi";
import { NetworkBackground } from "./NetworkBackground";
import { BrandMark } from "./BrandMark";
import { WalletPicker } from "./WalletPicker";
import { Spinner } from "./Spinner";
import { fadeUp } from "./motion";

function friendlyConnectError(error: unknown): string {
  const code = (error as { code?: number } | undefined)?.code;
  const rawMessage =
    error instanceof Error ? error.message : (error as { message?: string } | undefined)?.message;
  const message = (rawMessage ?? "").toLowerCase();

  if (code === 4001 || message.includes("reject") || message.includes("denied") || message.includes("cancel")) {
    return "Connection cancelled — try again.";
  }
  if (message.includes("account") || message.includes("unlock") || message.includes("lock")) {
    return "Unlock your wallet and try again.";
  }
  return "Couldn't connect — try again.";
}

export function Landing() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [connectErrorMessage, setConnectErrorMessage] = useState<string | null>(null);

  async function attemptConnect(connector: Connector) {
    console.log("[AVAL] connecting via", connector.name);
    setConnectErrorMessage(null);
    setConnectingUid(connector.uid);
    try {
      await connectAsync({ connector });
      setPickerOpen(false);
      router.push("/home");
    } catch (err) {
      console.error("[AVAL] connect failed", err);
      setConnectErrorMessage(friendlyConnectError(err));
    } finally {
      setConnectingUid(null);
    }
  }

  function handleConnectClick() {
    console.log("[AVAL] connect wallet clicked", { connectorCount: connectors.length });
    setConnectErrorMessage(null);

    if (connectors.length === 0) return;
    if (connectors.length === 1) {
      void attemptConnect(connectors[0]);
      return;
    }
    setPickerOpen((open) => !open);
  }

  const isConnecting = connectingUid !== null;

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <NetworkBackground />

      <motion.div
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="absolute left-8 top-[26px] z-20"
      >
        <BrandMark size={36} />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/15 blur-3xl"
          aria-hidden
        />

        <motion.h1
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
          className="relative max-w-2xl text-balance font-serif text-4xl leading-tight text-ivory sm:text-5xl"
        >
          DeFi lending trusts only the rich.
          <br />
          AVAL changes who gets trusted.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
          className="relative mt-6 max-w-md text-sm leading-relaxed text-muted"
        >
          Your verified identity is your collateral. Borrow against who you are.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
          className="relative mt-12 flex flex-col items-center"
        >
          {isConnected ? (
            <button
              onClick={() => router.push("/home")}
              className="group relative rounded-full bg-teal px-8 py-3.5 text-sm font-medium tracking-wide text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(45,212,191,0.55)]"
            >
              Go to dashboard
            </button>
          ) : (
            <>
              <button
                onClick={handleConnectClick}
                disabled={isConnecting || connectors.length === 0}
                className="group relative flex items-center gap-2 rounded-full bg-teal px-8 py-3.5 text-sm font-medium tracking-wide text-navy transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(45,212,191,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting && <Spinner size={14} />}
                {isConnecting ? "Connecting…" : "Connect wallet"}
              </button>

              <AnimatePresence>
                {pickerOpen && (
                  <div className="mt-4">
                    <WalletPicker
                      connectors={connectors}
                      connectingUid={connectingUid}
                      onSelect={attemptConnect}
                    />
                  </div>
                )}
              </AnimatePresence>

              {connectors.length === 0 && (
                <p className="mt-4 text-xs text-muted">
                  No wallet detected — install MetaMask or another wallet extension to continue.
                </p>
              )}

              {connectErrorMessage && (
                <p className="mt-4 text-xs text-red">{connectErrorMessage}</p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
