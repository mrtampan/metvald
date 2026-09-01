<template>
  <div class="bg-gray-100 min-h-screen p-4 sm:p-8">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Hero Section -->
      <section
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10"
      >
        <div class="max-w-3xl">
          <span
            class="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4"
          >
            Metvald Screening Tool
          </span>
          <h1
            class="text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            Professional Solana & Meteora Token Screening.
          </h1>
          <p class="mt-4 text-base md:text-lg text-gray-600 leading-relaxed">
            Evaluate token risk, analyze holder profiles, inspect multi-platform charts, and monitor Meteora liquidity pools with a single token address.
          </p>

          <!-- Simple Search Bar -->
          <form @submit.prevent="submitSearch" class="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              v-model="inputAddress"
              type="text"
              placeholder="Paste Solana token address..."
              class="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <button
              type="submit"
              class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-300"
            >
              Analyze Token
            </button>
          </form>

          <!-- Quick Navigation Links -->
          <div class="mt-6 flex flex-wrap gap-2 text-xs">
            <RouterLink
              to="/screening"
              class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-1.5 rounded-lg transition"
            >
              Screening Tool
            </RouterLink>

            <RouterLink
              to="/dexscreener-list"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
            >
              Dexscreener List
            </RouterLink>
            <RouterLink
              to="/token-list"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition"
            >
              Token List
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Updated Features Section -->
      <section class="space-y-4">
        <h2 class="text-xl font-bold text-gray-800">
          Tool Capabilities & Updates
        </h2>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 1. Embed Chart 3 Platforms -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>📈</span>
              <span>Embed Chart 3 Platforms</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Multi-Chart View</h3>
            <p class="text-sm text-gray-600">
              Integrates embedded chart feeds from DexScreener, GMGN.ai, and GeckoTerminal.
            </p>
          </div>

          <!-- 2. Token Analytics -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>📊</span>
              <span>Token Analytics</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Live Market Metrics</h3>
            <p class="text-sm text-gray-600">
              Real-time price action, market cap, 24h volume, liquidity depth, and buy/sell transaction ratios.
            </p>
          </div>

          <!-- 3. Holder Analysis Profile -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>🕵️‍♂️</span>
              <span>Holder Profiles</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Smart Wallet Profiling</h3>
            <p class="text-sm text-gray-600">
              Categorizes holders into Bundlers, Snipers, Insiders, Dev Wallets, and Smart Traders.
            </p>
          </div>

          <!-- 4. Total Fees Data -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>💰</span>
              <span>Total Fees Data</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">LP Yield & Fee Analytics</h3>
            <p class="text-sm text-gray-600">
              Tracks 24h total LP fees (USD/SOL), Base Fee rates, Dynamic Fee scaling, and Fee/TVL ratios.
            </p>
          </div>

          <!-- 5. Rugcheck Data -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>🛡️</span>
              <span>Rugcheck Audit</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Contract Security Audit</h3>
            <p class="text-sm text-gray-600">
              Verifies Mint Authority, Freeze Authority, LP burn/lock percentage, and security risk score.
            </p>
          </div>

          <!-- 6. Meteora Pool List -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>🌊</span>
              <span>Meteora Pool List</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Dynamic Liquidity Pools</h3>
            <p class="text-sm text-gray-600">
              Lists active Meteora DLMM and Dynamic Pools with volume, TVL, and fee breakdowns.
            </p>
          </div>

          <!-- 7. Holder Analytics -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 md:col-span-2 lg:col-span-3">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>👥</span>
              <span>Holder Analytics</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Supply Distribution & Concentration</h3>
            <p class="text-sm text-gray-600">
              Analyzes total holder counts, Top 10% and Top 20% supply concentration percentages, and holder balance distribution.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const inputAddress = ref("");

const submitSearch = () => {
  if (!inputAddress.value.trim()) return;
  router.push({
    path: "/screening",
    query: { token: inputAddress.value.trim() }
  });
};
</script>


