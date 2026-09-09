# Metvald - Solana & Meteora Token Screening App

Metvald is a comprehensive web application for Solana token analytics, Meteora DLMM liquidity pool screening, and Smart Wallet tracking. It provides real-time market metrics, smart wallet holder detection, holder risk profiling, multi-platform embedded charts, and automated security risk auditing.

## 🚀 Features

- **Token Screening & Analytics**: Search any Solana token address to analyze price action, 24h volume, liquidity pool depth (TVL), dynamic LP fees, and real-time transaction metrics.
- **Smart Wallet Tracking & Radar**: Real-time cross-referencing of token holders against curated smart wallet databases (Metvald Curation & MeteoraIDN Discord community list) via Jupiter Datapi to reveal smart money participation, win rates, PnL stats, and holding percentages.
- **Holder Profile & Risk Analysis**: Categorize wallet distributions (Devs, Insiders, Snipers, Smart Traders, Top Holders) with supply concentration and risk metrics.
- **Multi-Platform Embedded Charts**: Toggle between DexScreener, GMGN.ai, and GeckoTerminal interactive chart views.
- **Contract Security Audit**: Integrated with Rugcheck.xyz to instantly inspect Mint/Freeze authority permissions, LP burn/lock status, and security risk scores.
- **Meteora DLMM Pool Explorer**: Browse top Meteora liquidity pools with volume, TVL, and dynamic fee yield rankings.
- **DexScreener Trending Pairs**: Track boosted listings, high-volume trading pairs, and trending Solana tokens in real-time.

## 🔌 Integrations & APIs

- **Meteora DLMM API**: Liquidity pool metrics, base/dynamic fee stats, and TVL tracking.
- **DexScreener API**: Real-time token pair profiles, price feeds, and embedded chart views.
- **Jupiter Datapi**: Solana token metadata, total holder counts, organic scoring, and batch smart wallet holder cross-referencing (`/v1/holders`).
- **Rugcheck.xyz API**: Smart contract security audits, holder distribution analysis, and risk scoring.
- **Metvald Smart Wallet API (`/api/smartwallet`)**: Vercel serverless backend endpoint for aggregated smart wallet list management and chunked address cross-referencing.
- **GeckoTerminal & GMGN.ai**: Embedded trading charts and wallet inspection links.

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API) + Vite 8
- **State & Router**: Pinia + Vue Router 4
- **Backend / Serverless**: Vercel Serverless Functions (Node.js API routes)
- **Styling**: Tailwind CSS v4
- **Utilities**: `@vueuse/core`, SweetAlert2

## 📦 Installation & Running Locally

1. **Install dependencies**:

   ```sh
   npm install
   ```

2. **Run local development server** (with Vercel Serverless API support):

   ```sh
   vercel dev
   ```

   *Alternatively, run Vite dev server directly (client-only):*

   ```sh
   npm run dev
   ```

3. **Build for production**:

   ```sh
   npm run build
   ```

4. **Preview production build**:

   ```sh
   npm run preview
   ```
