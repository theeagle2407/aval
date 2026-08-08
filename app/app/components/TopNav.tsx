"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { BrandMark } from "./BrandMark";
import { WalletMenu } from "./WalletMenu";

const NAV_ITEMS = [
  { href: "/home", label: "Home" },
  { href: "/borrow", label: "Borrow" },
  { href: "/pool", label: "Pool" },
  { href: "/compliance", label: "Compliance" },
  { href: "/audit", label: "Audit" },
];

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDisconnect() {
    setMenuOpen(false);
    disconnect();
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between border-b border-white/5 px-8 py-5">
      <button
        onClick={() => router.push("/")}
        className="transition-opacity hover:opacity-80"
        aria-label="Return to landing"
      >
        <BrandMark size={36} />
      </button>

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                active ? "bg-panel text-teal" : "text-muted hover:text-ivory"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 py-2 text-xs text-muted transition-colors hover:text-ivory"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          {address ? truncateAddress(address) : "—"}
        </button>

        <AnimatePresence>
          {menuOpen && address && (
            <WalletMenu
              address={address}
              onClose={() => setMenuOpen(false)}
              onDisconnect={handleDisconnect}
            />
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
