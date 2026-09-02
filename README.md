# Metvald - Solana & Meteora Token Screening App

Metvald is a comprehensive web application for Solana token analytics and Meteora DLMM liquidity pool screening. It provides real-time market metrics, holder risk profiling, multi-platform embedded charts, and security risk auditing.

## 🚀 Features

- **Token Screening**: Analyze any Solana token address to view price action, 24h volume, TVL, dynamic LP fees, and transaction metrics.
- **Holder Profile & Risk Analysis**: Categorize holder wallets (Dev, Insiders, Snipers, Bundlers, Smart Traders) with supply concentration metrics.
- **Multi-Platform Embedded Charts**: Embedded chart views across DexScreener, GMGN.ai, and GeckoTerminal.
- **Contract Security Audit**: Integrated with Rugcheck.xyz to verify Mint/Freeze authorities, LP burn/lock state, and risk scores.
- **Dexscreener & Token Lists**: Dedicated views to browse trending pairs, boosted listings, and top Meteora liquidity pools.

## 🔌 Integrations

- **Meteora DLMM API**: Liquidity pool metrics, base/dynamic fees, and TVL tracking.
- **DexScreener API**: Real-time token pair profiles and embedded chart feeds.
- **Rugcheck.xyz**: Contract security, top holders distribution, and risk assessment audits.
- **Jupiter Datapi**: Solana asset metadata, holder counts, organic scoring, and audit metrics.
- **GeckoTerminal & GMGN.ai**: Embedded trading chart widgets.


## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API) + Vite 8
- **State & Router**: Pinia + Vue Router 4
- **Styling**: Tailwind CSS v4
- **Utilities**: `@vueuse/core`, SweetAlert2

## 📦 Installation & Running Locally

1. **Install dependencies**:

   ```sh
   npm install
   ```

2. **Run local dev server**:

   ```sh
   npm run dev
   ```

   _(Or `vercel dev` for Vercel local environment)_

3. **Build for production**:

   ```sh
   npm run build
   ```

4. **Preview build locally**:
   ```sh
   npm run preview
   ```
