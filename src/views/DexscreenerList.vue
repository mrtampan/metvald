<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Filter Criteria (Default values matching user requirements)
const filters = ref({
  minMarketCap: 250000,     // marketcap: 250000
  onlyWithProfile: true,    // profile centang
  chain: "solana",          // chain solana
  minVolume24h: 1000000,    // 24h volume: 1000000
  minVolume5m: 5000,        // 5m volume: 5000
});

const searchQuery = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const pairs = ref([]);
const profileAddresses = ref(new Set());
const toastMessage = ref("");
const showToast = ref(false);

const triggerToast = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 2500);
};

// Check if a token has a verified profile ("profile centang")
const checkHasProfile = (pair) => {
  if (!pair) return false;
  
  const tokenAddress = pair.baseToken?.address;
  if (tokenAddress && profileAddresses.value.has(tokenAddress)) {
    return true;
  }
  
  if (pair.info) {
    const hasImage = !!(pair.info.imageUrl || pair.info.header || pair.info.openGraph);
    const hasSocials = Array.isArray(pair.info.socials) && pair.info.socials.length > 0;
    const hasWebsites = Array.isArray(pair.info.websites) && pair.info.websites.length > 0;
    if (hasImage || hasSocials || hasWebsites) {
      return true;
    }
  }
  
  return false;
};

// Fetch data from multiple DexScreener API sources
const fetchTokens = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  pairs.value = [];

  try {
    // 1. Fetch profiles, boosts, and search queries in parallel
    const [profilesRes, boostsRes, topBoostsRes, searchSolRes, searchPumpRes, searchRayRes] = await Promise.allSettled([
      fetch("https://api.dexscreener.com/token-profiles/latest/v1").then((r) => r.json()),
      fetch("https://api.dexscreener.com/token-boosts/latest/v1").then((r) => r.json()),
      fetch("https://api.dexscreener.com/token-boosts/top/v1").then((r) => r.json()),
      fetch("https://api.dexscreener.com/latest/dex/search?q=solana").then((r) => r.json()),
      fetch("https://api.dexscreener.com/latest/dex/search?q=pump").then((r) => r.json()),
      fetch("https://api.dexscreener.com/latest/dex/search?q=sol").then((r) => r.json()),
    ]);

    const collectedProfileAddresses = new Set();
    const tokenAddressesToFetch = new Set();

    const processProfileItems = (res) => {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        res.value.forEach((item) => {
          if (item.tokenAddress) {
            collectedProfileAddresses.add(item.tokenAddress);
            if (!item.chainId || item.chainId.toLowerCase() === "solana") {
              tokenAddressesToFetch.add(item.tokenAddress);
            }
          }
        });
      }
    };

    processProfileItems(profilesRes);
    processProfileItems(boostsRes);
    processProfileItems(topBoostsRes);

    profileAddresses.value = collectedProfileAddresses;

    // 2. Batch fetch pair metrics for profile/boost token addresses (chunks of 30)
    const addressArray = Array.from(tokenAddressesToFetch);
    const fetchedPairsFromTokens = [];

    for (let i = 0; i < addressArray.length; i += 30) {
      const chunk = addressArray.slice(i, i + 30).join(",");
      try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk}`);
        const data = await res.json();
        if (data && Array.isArray(data.pairs)) {
          fetchedPairsFromTokens.push(...data.pairs);
        }
      } catch (err) {
        console.warn("Chunk fetch error:", chunk, err);
      }
    }

    // 3. Collect pairs from search queries
    const searchPairs = [];
    [searchSolRes, searchPumpRes, searchRayRes].forEach((res) => {
      if (res.status === "fulfilled" && res.value && Array.isArray(res.value.pairs)) {
        searchPairs.push(...res.value.pairs);
      }
    });

    // 4. Merge all pairs and deduplicate by pairAddress
    const pairMap = new Map();

    [...fetchedPairsFromTokens, ...searchPairs].forEach((pair) => {
      if (pair && pair.pairAddress) {
        const existing = pairMap.get(pair.pairAddress);
        if (!existing || (!existing.info && pair.info) || ((pair.volume?.h24 || 0) > (existing.volume?.h24 || 0))) {
          pairMap.set(pair.pairAddress, pair);
        }
      }
    });

    pairs.value = Array.from(pairMap.values());
  } catch (err) {
    console.error("Error loading Dexscreener list:", err);
    errorMessage.value = "Failed to load data from Dexscreener API.";
  } finally {
    isLoading.value = false;
  }
};

// Filtered tokens computed
const filteredTokens = computed(() => {
  return pairs.value.filter((item) => {
    // Chain filter
    if (filters.value.chain && item.chainId?.toLowerCase() !== filters.value.chain.toLowerCase()) {
      return false;
    }

    // Market Cap filter (min 250,000)
    const mcap = item.marketCap || item.fdv || 0;
    if (mcap < filters.value.minMarketCap) return false;

    // 24h Volume filter (min 1,000,000)
    const vol24h = item.volume?.h24 || 0;
    if (vol24h < filters.value.minVolume24h) return false;

    // 5m Volume filter (min 5,000)
    const vol5m = item.volume?.m5 || 0;
    if (vol5m < filters.value.minVolume5m) return false;

    // Profile centang filter
    if (filters.value.onlyWithProfile && !checkHasProfile(item)) return false;

    // Search query filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      const symbol = item.baseToken?.symbol?.toLowerCase() || "";
      const name = item.baseToken?.name?.toLowerCase() || "";
      const address = item.baseToken?.address?.toLowerCase() || "";
      if (!symbol.includes(q) && !name.includes(q) && !address.includes(q)) {
        return false;
      }
    }

    return true;
  });
});

// Formatters
const formatUsd = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "$0";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(6)}`;
};

const copyAddress = async (address) => {
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    triggerToast("Contract address copied successfully!");
  } catch (e) {
    triggerToast("Failed to copy.");
  }
};

const goToScreening = (address) => {
  router.push({ path: "/screening", query: { token: address } });
};

onMounted(() => {
  fetchTokens();
});
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- Toast Notification -->
      <div
        v-if="showToast"
        class="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm border border-gray-700 animate-bounce"
      >
        <span class="text-green-400">✓</span>
        <span>{{ toastMessage }}</span>
      </div>

      <!-- Header Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              DexScreener Live API
            </span>
            <span class="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>✓</span> Verified Profile Active
            </span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Dexscreener Token List</h1>
          <p class="text-sm text-gray-500 mt-0.5">
            Filtered token list from Dexscreener API: Market Cap ≥ $250k, Verified Profile, Solana, 24h Vol ≥ $1M, & 5m Vol ≥ $5k.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="fetchTokens"
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
          >
            <span v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Token Filters</h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Market Cap -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Min Market Cap ($)</label>
            <input
              type="number"
              v-model.number="filters.minMarketCap"
              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="250000"
            />
          </div>

          <!-- 24h Volume -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Min 24h Volume ($)</label>
            <input
              type="number"
              v-model.number="filters.minVolume24h"
              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="1000000"
            />
          </div>

          <!-- 5m Volume -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Min 5m Volume ($)</label>
            <input
              type="number"
              v-model.number="filters.minVolume5m"
              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="5000"
            />
          </div>

          <!-- Chain -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Chain</label>
            <select
              v-model="filters.chain"
              class="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
            >
              <option value="solana">Solana</option>
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="base">Base</option>
            </select>
          </div>

          <!-- Profile Centang Toggle -->
          <div class="flex items-end">
            <label
              @click="filters.onlyWithProfile = !filters.onlyWithProfile"
              class="w-full cursor-pointer bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm font-semibold text-blue-700 flex items-center justify-between select-none"
            >
              <span class="flex items-center gap-1.5 text-xs">
                <span class="text-blue-600 font-bold">✓</span> Verified Profile
              </span>
              <input
                type="checkbox"
                v-model="filters.onlyWithProfile"
                class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        <!-- Search input -->
        <div class="pt-2 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search token name / symbol / address..."
            class="w-full sm:w-80 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <span class="text-xs text-gray-500 font-medium">
            Showing <strong class="text-gray-900">{{ filteredTokens.length }}</strong> of {{ pairs.length }} tokens
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-gray-600 text-sm font-medium">Loading tokens from Dexscreener API...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTokens.length === 0" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center space-y-3">
        <p class="text-gray-500 font-medium">No tokens match the current filter criteria.</p>
        <p class="text-xs text-gray-400">
          Current filter criteria: Market Cap ≥ {{ formatUsd(filters.minMarketCap) }}, 24h Vol ≥ {{ formatUsd(filters.minVolume24h) }}, 5m Vol ≥ {{ formatUsd(filters.minVolume5m) }}, Chain: {{ filters.chain }}.
        </p>
        <button
          @click="filters.minMarketCap = 0; filters.minVolume24h = 0; filters.minVolume5m = 0;"
          class="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-4 py-2 rounded-xl transition"
        >
          Reset Minimum Limits
        </button>
      </div>

      <!-- Token Table -->
      <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <th class="py-3.5 px-4">Token</th>
                <th class="py-3.5 px-4 text-right">Price</th>
                <th class="py-3.5 px-4 text-right">Market Cap</th>
                <th class="py-3.5 px-4 text-right">24h Volume</th>
                <th class="py-3.5 px-4 text-right">5m Volume</th>
                <th class="py-3.5 px-4 text-right">24h Change</th>
                <th class="py-3.5 px-4 text-center">Profile</th>
                <th class="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 text-sm">
              <tr v-for="item in filteredTokens" :key="item.pairAddress" class="hover:bg-gray-50/80 transition">
                
                <!-- Token Info -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div class="relative flex-shrink-0">
                      <img
                        :src="item.info?.imageUrl || 'https://dexscreener.com/favicon.ico'"
                        @error="(e) => (e.target.src = 'https://dexscreener.com/favicon.ico')"
                        class="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 object-cover"
                        alt="Logo"
                      />
                      <span
                        v-if="checkHasProfile(item)"
                        class="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-sm"
                        title="Verified Profile"
                      >
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-gray-900">{{ item.baseToken?.symbol }}</span>
                        <span class="text-xs text-gray-500 truncate max-w-[120px]">{{ item.baseToken?.name }}</span>
                        <button
                          @click="copyAddress(item.baseToken?.address)"
                          class="text-gray-400 hover:text-blue-600 text-xs"
                          title="Copy Contract Address"
                        >
                          📋
                        </button>
                      </div>
                      <span class="text-[11px] text-gray-400 uppercase font-mono">{{ item.dexId }}</span>
                    </div>
                  </div>
                </td>

                <!-- Price -->
                <td class="py-3.5 px-4 text-right font-mono font-medium text-gray-900">
                  {{ formatUsd(Number(item.priceUsd)) }}
                </td>

                <!-- Market Cap -->
                <td class="py-3.5 px-4 text-right font-bold text-gray-900">
                  {{ formatUsd(item.marketCap || item.fdv) }}
                </td>

                <!-- 24h Volume -->
                <td class="py-3.5 px-4 text-right font-bold text-blue-600">
                  {{ formatUsd(item.volume?.h24) }}
                </td>

                <!-- 5m Volume -->
                <td class="py-3.5 px-4 text-right font-bold text-emerald-600">
                  {{ formatUsd(item.volume?.m5) }}
                </td>

                <!-- 24h Change -->
                <td class="py-3.5 px-4 text-right font-semibold">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs font-mono font-bold',
                      (item.priceChange?.h24 || 0) >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    ]"
                  >
                    {{ (item.priceChange?.h24 || 0) >= 0 ? '+' : '' }}{{ item.priceChange?.h24?.toFixed(2) || '0.00' }}%
                  </span>
                </td>

                <!-- Profile Centang Badge -->
                <td class="py-3.5 px-4 text-center">
                  <span
                    v-if="checkHasProfile(item)"
                    class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200"
                  >
                    <span>✓</span> Verified Profile
                  </span>
                  <span v-else class="text-xs text-gray-400">-</span>
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="goToScreening(item.baseToken?.address)"
                      class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
                    >
                      Screen
                    </button>
                  </div>
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>
