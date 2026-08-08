# AVAL

**Undercollateralized lending, unlocked by verified identity. Your CVI is your collateral.**

Built for the Cleanverse Build: Trusted Assets Hackathon (DeFi track), on Monad testnet.

## The Problem

DeFi lending forces over-collateralization — lock $1,500 to borrow $1,000 — because protocols can't verify who they're lending to. This shuts out real businesses and individuals with income but no idle crypto. Every past attempt at undercollateralized on-chain credit has failed for lack of real, revocable, on-chain identity.

## How AVAL Works

AVAL makes a borrower's CVI (Cleanverse Verified Identity) tier the collateral. A verified borrower's tier is read on-chain at borrow time via the CCP validator's `complianceVerify()`; the tier sets the credit limit and effective LTV. Repayment compounds the limit — reputation that grows, bound to identity, not to a wallet. Revocation freezes the position on-chain: default cannot be outrun with a new wallet.

## Cleanverse Integration (the core, not an add-on)

- **CVI (A-Pass):** issued via `/generate_apass`; tier read at borrow time; revocation via `/update_status` freezes positions.
- **CCP Validator (on-chain):** `AvalLending` is registered as a compliance pool with a tiered `RuleV2` (min tier 20); the contract calls `complianceVerify(pool, borrower)` live at borrow time — this is the on-chain compliance gate, not a UI-layer check.
- **CVA (A-Token):** the lending asset is a compliant 6-decimal A-Token with transfer-time compliance hooks.

Remove any one of these three and the protocol collapses back to the over-collateralized status quo.

## Deployed Contracts (Monad testnet, chain 10143)

| Contract | Address |
|---|---|
| `AvalLending` | [`0x27eF8055CA2ad761FdF4Fc82646ceD1D8604CE81`](https://testnet.monadexplorer.com/address/0x27eF8055CA2ad761FdF4Fc82646ceD1D8604CE81) |
| Asset (aUSDC, 6 decimals) | [`0x3E59009E7b6aD6D6a556010f6EC3f16681952499`](https://testnet.monadexplorer.com/address/0x3E59009E7b6aD6D6a556010f6EC3f16681952499) |
| CCP Validator | [`0xaC7e5179C2C7f03f209136886c172eb34F161792`](https://testnet.monadexplorer.com/address/0xaC7e5179C2C7f03f209136886c172eb34F161792) |

### Proof of execution

Real transactions on Monad testnet, not a simulation:

| Action | Transaction |
|---|---|
| Pool registration (CCP) | [`0x374a06c8eab8294cb2b0c4d6d81a0edadfebc317a1cfd356c2afc88a628ca801`](https://testnet.monadexplorer.com/tx/0x374a06c8eab8294cb2b0c4d6d81a0edadfebc317a1cfd356c2afc88a628ca801) |
| A-Pass issuance | [`0xd7e23073ae1cd18abca21f7bce34a0210908e7ce62b5a9f76642910192f735f6`](https://testnet.monadexplorer.com/tx/0xd7e23073ae1cd18abca21f7bce34a0210908e7ce62b5a9f76642910192f735f6) |
| Borrow | [`0xc94b1672870b5c313139b40f5334108ba9974c24fe8f75a3284971ff7aa7dace`](https://testnet.monadexplorer.com/tx/0xc94b1672870b5c313139b40f5334108ba9974c24fe8f75a3284971ff7aa7dace) |
| Repay | [`0x449adca1eb6d954283b56670eca7c60dee99398bee03d01a6421dd6921ed4599`](https://testnet.monadexplorer.com/tx/0x449adca1eb6d954283b56670eca7c60dee99398bee03d01a6421dd6921ed4599) |

## The Demo Flow

Connect wallet → verify (issue A-Pass, tier read) → credit line unlocks → borrow real aUSDC → repay (limit compounds) → simulate default (freeze) → position locks on-chain.

## Architecture

- **Smart contracts:** Solidity + Foundry — `AvalLending`, the `IAPassComplianceValidator` interface, `MockAUSDC` for local testing.
- **Frontend:** Next.js + wagmi + viem — an institutional dashboard (Borrow / Pool / Compliance / Audit).
- **Backend:** Next.js route handlers (server-side) for Cleanverse API calls (AES-encrypted); keys never exposed client-side.
- **Chain:** Monad testnet.

## Running Locally

**Prerequisites:** [Foundry](https://book.getfoundry.sh/getting-started/installation), Node.js 18+, a Monad testnet wallet funded with MON for gas.

**Environment variables** — copy `.env.example` to `.env` at the repo root (contracts/scripts) and `app/.env.example` to `app/.env.local` (frontend); see those files for the full annotated list. Names only:

- `MONAD_RPC_URL`
- `PRIVATE_KEY`
- `ASSET_ADDRESS` (optional — omit to deploy `MockAUSDC` for local testing)
- `CLEANVERSE_API_ID`
- `CLEANVERSE_API_KEY`
- `NEXT_PUBLIC_MONAD_RPC_URL` (frontend only, optional)

**Contracts:**

```shell
forge install
forge build
forge script script/Deploy.s.sol:Deploy --rpc-url $MONAD_RPC_URL --broadcast --private-key $PRIVATE_KEY
```

**Frontend:**

```shell
cd app
npm install
npm run dev
```

See [`DEPLOY.md`](./DEPLOY.md) for deploying the frontend to Vercel.

## Tech Stack

Solidity · Foundry · Next.js · wagmi · viem · TypeScript · Monad

Built with AI-assisted development (Claude).
