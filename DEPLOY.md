# Deploying to Vercel

## Root Directory

Set the Vercel project's **Root Directory to `app/`** — not the repo root.

The repo root has its own `package.json` (for the standalone Cleanverse helper scripts in
`scripts/*.mjs` — just `dotenv` + `ethers`, no Next.js). If Root Directory is left at the
repo root, Vercel's zero-config framework detection will find that `package.json` instead
and fail to recognize this as a Next.js project. The actual app — `package.json`,
`next.config.ts`, the App Router tree, API routes — lives entirely under `app/`.

## Build command

No override needed. Once Root Directory is set to `app/`, Vercel auto-detects Next.js and
runs `next build` / `next start` by default (matches `app/package.json`'s `build` script).

`next.config.ts` sets `turbopack.root` explicitly to the `app/` directory itself, to
disambiguate from the sibling repo-root `package-lock.json` — this resolves correctly on
Vercel's build machine the same way it does locally, no extra config needed.

## Environment variables

Set these in the Vercel dashboard under Project Settings → Environment Variables. Names
only below — see `app/.env.example` for the annotated template with placeholders.

**Required, server-only** (read only inside `app/lib/*.server.ts`, never sent to the browser):

- `CLEANVERSE_API_ID`
- `CLEANVERSE_API_KEY`
- `PRIVATE_KEY` — the demo backend signer (pool owner) key, used to call
  `AvalLending.openCreditLineFor` on the user's behalf.

**Optional, public** (safe to expose — not a secret, deliberately `NEXT_PUBLIC_`-prefixed
so wagmi can use it client-side too):

- `NEXT_PUBLIC_MONAD_RPC_URL` — Monad testnet RPC endpoint. Defaults to
  `https://testnet-rpc.monad.xyz` if unset.

Local dev reads these from `.env` at the repo root, via a `app/.env.local` symlink
(`app/.env.local -> ../.env`, gitignored) — that symlink is a local-only convenience and
irrelevant on Vercel, which injects environment variables directly into `process.env` for
both build and runtime.

## Verified before writing this doc

- `next build` succeeds from a clean state (`.next` removed first, then rebuilt).
- The three secrets are read in exactly one place each, all inside
  `app/lib/cleanverse.server.ts` / `app/lib/serverChain.server.ts`, both guarded with
  `import "server-only"` at the top (a client-side import of either fails the build). No
  client component imports either file — only the `app/api/*/route.ts` handlers do.
- Scanned the actual built `.next/static` client bundle for the three secret values
  directly: zero matches. Confirmed `NEXT_PUBLIC_MONAD_RPC_URL`'s value *does* correctly
  appear in the client bundle, as expected for a `NEXT_PUBLIC_` variable.
