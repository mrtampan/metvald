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
            Platform analisis & screening token Solana terlengkap. Evaluasi risiko rugcheck, analisis profil holder & insider, embed chart 3 platform (DexScreener, GMGN, GeckoTerminal), scanner pool Meteora DLMM dengan filter preset, serta list token DexScreener ber-profile centang.
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
            <span>Riwayat Screening Terakhir</span>
          </h2>
          <button 
            @click="screeningStore.clearScreeningHistory()" 
            class="text-xs text-gray-500 hover:text-red-600 transition"
          >
            Hapus Riwayat
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
            Fitur Utama & Pembaruan Terkini
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
              Filter token Solana ber-profile resmi ("Profile Centang") secara real-time dari DexScreener, disaring berdasar Market Cap, Volume 24h & 5m, serta token boosted.
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
              Scanning pool Meteora aktif secara otomatis menggunakan preset filter kustom (Default & Custom Presets) berdasar TVL aktif, usia token, jumlah holder, volume, dan score organik.
            </p>
          </div>

          <!-- 3. Embed Chart 3 Platforms -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-blue-600 font-semibold text-sm">
              <span>📈</span>
              <span>Multi-Platform Charts</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Embed Chart 3 Platform</h3>
            <p class="text-sm text-gray-600">
              Integrasi live chart interaktif dari DexScreener, GMGN.ai, dan GeckoTerminal yang dapat diganti secara instan dalam 1 halaman.
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
              Deteksi otomatis kategori wallet: Dev Wallets, Snipers, Insiders, Bundlers, dan Smart Traders, beserta persentase konsentrasi suplai Top 10% & Top 20%.
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
              Verifikasi Mint Authority, Freeze Authority, persentase LP burn / lock, serta skor tingkat risiko keamanan smart contract token dari Rugcheck.
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
              Pemantauan total fee LP 24h (USD/SOL), Base Fee rate, Dynamic Fee scaling multiplier, dan rasio Fee/TVL untuk proyeksi yield optimal.
            </p>
          </div>

          <!-- 7. External Visualizers Integration -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-2 md:col-span-2 lg:col-span-3 hover:shadow-md transition">
            <div class="flex items-center gap-2 text-cyan-600 font-semibold text-sm">
              <span>🔗</span>
              <span>External Visualizers</span>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Integrasi Platform Visualisasi & Trading</h3>
            <p class="text-sm text-gray-600">
              Akses cepat 1-klik langsung ke Bubblemaps (peta visual hubungan wallet holder), Fabriq Trade, Axiom Trade, dan GMGN untuk analisa wallet cluster secara mendalam.
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


