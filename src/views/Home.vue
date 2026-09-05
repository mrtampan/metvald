<template>
  <div class="bg-gray-100 min-h-screen p-4 sm:p-8">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Hero Section -->
      <section
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10"
      >
        <div class="max-w-3xl">
          <span
            class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4"
          >
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Metvald Solana & Meteora Analytics
          </span>
          <h1
            class="text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            Solana & Meteora Token Screening & Market Intelligence
          </h1>
          <p class="mt-4 text-base md:text-lg text-gray-600 leading-relaxed">
            Comprehensive Solana token screening & analytics platform. Evaluate rugcheck risk, analyze holder & insider profiles, embed multi-platform charts (DexScreener, GMGN, GeckoTerminal), scan Meteora DLMM pools with preset filters, and view verified DexScreener token profiles.
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
              class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2"
            >
              <span>🔍</span>
              <span>Analyze Token</span>
            </button>
          </form>

          <!-- Quick Navigation Links -->
          <div class="mt-6 flex flex-wrap gap-2 text-xs">
            <RouterLink
              to="/screening"
              class="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3.5 py-2 rounded-xl border border-blue-200 transition flex items-center gap-1.5"
            >
              <span>🔍</span>
              <span>Screening Tool</span>
            </RouterLink>

            <RouterLink
              to="/dexscreener-list"
              class="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-3.5 py-2 rounded-xl border border-emerald-200 transition flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Dexscreener List (Verified Profile)</span>
            </RouterLink>

            <RouterLink
              to="/token-list"
              class="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium px-3.5 py-2 rounded-xl border border-purple-200 transition flex items-center gap-1.5"
            >
              <span>🌊</span>
              <span>Meteora Token List (Scanner & Presets)</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- Recent Screening History (If any) -->
      <section v-if="screeningHistory && screeningHistory.length > 0" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>🕒</span>
            <span>Recent Screening History</span>
          </h2>
          <button 
            @click="screeningStore.clearScreeningHistory()" 
            class="text-xs text-gray-500 hover:text-red-600 transition"
          >
            Clear History
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in screeningHistory"
            :key="item.address"
            @click="goToToken(item.address)"
            class="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-xl text-xs text-gray-700 hover:text-blue-700 transition"
          >
            <img :src="item.icon" alt="token logo" class="w-4 h-4 rounded-full object-cover" @error="handleImageError" />
            <span class="font-medium">{{ item.name }}</span>
            <span class="text-gray-400 font-mono text-[10px]">{{ item.address.slice(0, 4) }}...{{ item.address.slice(-4) }}</span>
          </button>
        </div>
      </section>

      <!-- Tool Capabilities & Features Grid -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">
            Key Features & Latest Updates
          </h2>
          <span class="text-xs text-gray-500 font-medium">Metvald Platform Features</span>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 1. DexScreener Verified Profile Filter -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <span>🏷️</span>
              <span>Verified Profile List</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">DexScreener Verified List</h3>
            <p class="text-sm text-gray-600">
              Filter Solana tokens with official verified profiles in real-time from DexScreener, filtered by Market Cap, 24h & 5m Volume, and boosted tokens.
            </p>
          </div>

          <!-- 2. Meteora Pool & Token Scanner -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-purple-600 font-semibold text-sm">
              <span>🌊</span>
              <span>Meteora Pool Scanner</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">DLMM Scanner & Presets</h3>
            <p class="text-sm text-gray-600">
              Automatically scan active Meteora pools using custom filter presets based on active TVL, token age, holder count, volume, and organic score.
            </p>
          </div>

          <!-- 3. Embed Chart 3 Platforms -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>📈</span>
              <span>Multi-Platform Charts</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Multi-Platform Chart Embed</h3>
            <p class="text-sm text-gray-600">
              Interactive live chart integration from DexScreener, GMGN.ai, and GeckoTerminal, instantly switchable on a single page.
            </p>
          </div>

          <!-- 4. Holder Profiles & Smart Wallets -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <span>🕵️‍♂️</span>
              <span>Smart Wallet Profiling</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Holder & Insider Profiling</h3>
            <p class="text-sm text-gray-600">
              Automatic detection of wallet categories: Dev Wallets, Snipers, Insiders, Bundlers, and Smart Traders, alongside Top 10% & Top 20% supply concentration percentages.
            </p>
          </div>

          <!-- 5. Rugcheck & Contract Audit -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-red-600 font-semibold text-sm">
              <span>🛡️</span>
              <span>Security & Audit</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Contract Security Audit</h3>
            <p class="text-sm text-gray-600">
              Verify Mint Authority, Freeze Authority, LP burn / lock percentage, and smart contract security risk score from Rugcheck.
            </p>
          </div>

          <!-- 6. LP Fee & Yield Analytics -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-amber-600 font-semibold text-sm">
              <span>💰</span>
              <span>LP Fee Yields</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Meteora Fee Analytics</h3>
            <p class="text-sm text-gray-600">
              Monitor total 24h LP fees (USD/SOL), Base Fee rate, Dynamic Fee scaling multiplier, and Fee/TVL ratio for optimal yield projections.
            </p>
          </div>

          <!-- 7. External Visualizers Integration -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 md:col-span-2 lg:col-span-3 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-cyan-600 font-semibold text-sm">
              <span>🔗</span>
              <span>External Visualizers</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Visualization & Trading Integration</h3>
            <p class="text-sm text-gray-600">
              1-click quick access to Bubblemaps (holder wallet visual mapping), Fabriq Trade, Axiom Trade, and GMGN for in-depth wallet cluster analysis.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useScreeningStore } from "../stores/screeningStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const screeningStore = useScreeningStore();
const { screeningHistory } = storeToRefs(screeningStore);

const inputAddress = ref("");

onMounted(() => {
  if (screeningStore.loadScreeningHistory) {
    screeningStore.loadScreeningHistory();
  }
});

const submitSearch = () => {
  if (!inputAddress.value.trim()) return;
  router.push({
    path: "/screening",
    query: { token: inputAddress.value.trim() }
  });
};

const goToToken = (address) => {
  if (!address) return;
  router.push({
    path: "/screening",
    query: { token: address }
  });
};

const handleImageError = (e) => {
  e.target.src = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
};
</script>


