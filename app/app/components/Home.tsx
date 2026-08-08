"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "./motion";
import { BorrowIcon, PoolIcon, ComplianceIcon, AuditIcon } from "./icons";
import type { ComponentType } from "react";

const CARDS: {
  href: string;
  label: string;
  description: string;
  stat?: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    href: "/borrow",
    label: "Borrow",
    description: "Open a credit line against your verified identity.",
    stat: "$500 – $10,000 · tier-based",
    Icon: BorrowIcon,
  },
  {
    href: "/pool",
    label: "Pool",
    description: "Treasury liquidity, utilization, active credit lines.",
    Icon: PoolIcon,
  },
  {
    href: "/compliance",
    label: "Compliance",
    description: "Your CVI tier, verified live against the validator.",
    stat: "Min. tier 20 to qualify",
    Icon: ComplianceIcon,
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Transaction history and Travel Rule reporting.",
    Icon: AuditIcon,
  },
];

export function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <motion.h1
        initial="hidden"
        animate="show"
        custom={0}
        variants={fadeUp}
        className="font-serif text-3xl text-ivory"
      >
        Welcome back.
      </motion.h1>
      <motion.p
        initial="hidden"
        animate="show"
        custom={1}
        variants={fadeUp}
        className="mt-3 text-sm text-muted"
      >
        Choose where to go.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2"
      >
        {CARDS.map(({ href, label, description, stat, Icon }) => (
          <motion.div key={href} variants={fadeUp}>
            <Link
              href={href}
              className="group flex h-full flex-col justify-between rounded-2xl border border-white/8 bg-panel p-7 transition-all duration-300 hover:-translate-y-1 hover:border-teal/30 hover:shadow-[0_0_44px_-14px_rgba(45,212,191,0.45)]"
            >
              <div className="flex items-center justify-between">
                <Icon size={22} className="text-teal transition-transform duration-300 group-hover:scale-110" />
                {stat && (
                  <span className="text-[11px] uppercase tracking-wider text-steel">{stat}</span>
                )}
              </div>
              <div className="mt-8">
                <h2 className="font-serif text-xl text-ivory">{label}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </main>
  );
}
