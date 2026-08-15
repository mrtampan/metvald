<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const pools = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

// Presets Standard
const PRESET_DEFAULT = {
  name: "Default Filter",
  minMarketCap: 250000,
  maxTokenAgeHours: 5,
  minHolders: 1000,
  minVolume: 5000,
  minActiveTvl: 5000,
  minOrganicScore: 60,
  noHighSingleOwnership: true,
  noCriticalWarnings: true,
  minFeePct: 1,
};

const PRESET_ALL = {
  name: "Show All",
  minMarketCap: 0,
  maxTokenAgeHours: 0,
  minHolders: 0,
  minVolume: 0,
  minActiveTvl: 0,
  minOrganicScore: 0,
  noHighSingleOwnership: false,
  noCriticalWarnings: false,
  minFeePct: 0,
};

const filters = ref({ ...PRESET_DEFAULT });
const activePresetKey = ref("default"); // 'default', 'all', atau ID custom preset
const customPresets = ref([]);

// State modal buat preset baru
const isModalOpen = ref(false);
const newPresetName = ref("");

// Toggle filter panel visibility
const showFilterPanel = ref(true);

// Load custom presets dari localStorage
const loadCustomPresets = () => {
  try {
    const saved = localStorage.getItem("metvald_custom_presets");
    if (saved) {
      customPresets.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Gagal membaca presets dari localStorage:", e);
  }
};

// Simpan preset custom ke localStorage
const saveCurrentAsPreset = () => {
  if (!newPresetName.value.trim()) return;

  const newPreset = {
    id: Date.now(),
    name: newPresetName.value.trim(),
    filters: { ...filters.value },
  };

  customPresets.value.push(newPreset);
  try {
    localStorage.setItem(
      "metvald_custom_presets",
      JSON.stringify(customPresets.value),
    );
  } catch (e) {
    console.error("Gagal menyimpan preset ke localStorage:", e);
  }

  activePresetKey.value = newPreset.id;
  newPresetName.value = "";
  isModalOpen.value = false;
};

// Hapus custom preset dari localStorage
const deleteCustomPreset = (id, event) => {
  event.stopPropagation();
  customPresets.value = customPresets.value.filter((p) => p.id !== id);
  try {
    localStorage.setItem(
      "metvald_custom_presets",
      JSON.stringify(customPresets.value),
    );
  } catch (e) {
    console.error("Gagal memperbarui localStorage:", e);
  }
  if (activePresetKey.value === id) {
    applyPreset("default");
  }
};

// Terapkan preset
const applyPreset = (key, customPresetObj = null) => {
  activePresetKey.value = key;
  if (key === "default") {
    filters.value = { ...PRESET_DEFAULT };
  } else if (key === "all") {
    filters.value = { ...PRESET_ALL };
  } else if (customPresetObj) {
    filters.value = { ...customPresetObj.filters };
  }
  fetchTokenList();
};

// Helper untuk mengambil base token (selain SOL/USDC)
const getBaseToken = (pool) => {
  if (!pool) return {};
  const quoteSymbols = ["SOL", "WSOL", "USDC", "USDT"];
  if (
    pool.token_x &&
    quoteSymbols.includes(pool.token_x.symbol?.toUpperCase()) &&
    pool.token_y &&
    !quoteSymbols.includes(pool.token_y.symbol?.toUpperCase())
  ) {
    return pool.token_y;
  }
  return pool.token_x || pool.token_y || {};
};

// Fetch data dari Meteora Discovery API
const fetchTokenList = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const filterConditions = [];

    if (filters.value.noCriticalWarnings) {
      filterConditions.push("base_token_has_critical_warnings=false");
      filterConditions.push("quote_token_has_critical_warnings=false");
    }

    if (filters.value.noHighSingleOwnership) {
      filterConditions.push("base_token_has_high_single_ownership=false");
    }

    filterConditions.push("pool_type=dlmm");

    if (filters.value.minMarketCap > 0) {
      filterConditions.push(
        `base_token_market_cap>=${filters.value.minMarketCap}`,
      );
    }

    if (filters.value.maxTokenAgeHours > 0) {
      const maxCreatedAt =
        Date.now() - filters.value.maxTokenAgeHours * 3600 * 1000;
      filterConditions.push(`base_token_created_at<=${maxCreatedAt}`);
    }

    if (filters.value.minHolders > 0) {
      filterConditions.push(`base_token_holders>=${filters.value.minHolders}`);
    }

    if (filters.value.minVolume > 0) {
      filterConditions.push(`volume>=${filters.value.minVolume}`);
    }

    if (filters.value.minFeePct > 0) {
      filterConditions.push(`fee_pct>=${filters.value.minFeePct}`);
    }

    if (filters.value.minActiveTvl > 0) {
      filterConditions.push(`active_tvl>=${filters.value.minActiveTvl}`);
    }

    if (filters.value.minOrganicScore > 0) {
      filterConditions.push(
        `base_token_organic_score>=${filters.value.minOrganicScore}`,
      );
      filterConditions.push(
        `quote_token_organic_score>=${filters.value.minOrganicScore}`,
      );
    }

    const filterByQuery = filterConditions.join("&&");
    const apiUrl = `https://pool-discovery-api.datapi.meteora.ag/pools?page_size=50&timeframe=2h&category=top&filter_by=${encodeURIComponent(filterByQuery)}`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    pools.value = data.pools || data.data || [];
  } catch (err) {
    console.error("Fetch error:", err);
    errorMessage.value = "Gagal mengambil data dari Meteora API.";
  } finally {
    isLoading.value = false;
  }
};

const goToScreening = (tokenAddress) => {
  if (!tokenAddress) return;
  router.push({ name: "screening", query: { token: tokenAddress } });
};

const copiedAddress = ref("");
const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  copiedAddress.value = text;
  setTimeout(() => {
    copiedAddress.value = "";
  }, 2000);
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "$0";
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${Number(val).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

const formatAge = (createdAt) => {
  if (!createdAt) return "N/A";
  const diffMs = Date.now() - createdAt;
  if (diffMs < 0) return "Just now";
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
};

onMounted(() => {
  loadCustomPresets();
  fetchTokenList();
});
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Header Banner -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">List Token</h1>
          <p class="text-gray-500 text-sm mt-1">
            Data pool Meteora DLMM sesuai filter kriteria pasar.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="showFilterPanel = !showFilterPanel"
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {{ showFilterPanel ? "Sembunyikan Filter" : "Tampilkan Filter" }}
          </button>

          <button
            @click="fetchTokenList"
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <svg
              :class="['w-4 h-4', isLoading ? 'animate-spin' : '']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      <!-- Presets & Filter Panel -->
      <div
        v-if="showFilterPanel"
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <!-- Preset Selector Bar -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="text-xs font-bold uppercase text-gray-400 mr-1 tracking-wider"
              >Presets:</span
            >

            <!-- Built-in Preset: Default Filter -->
            <button
              @click="applyPreset('default')"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border',
                activePresetKey === 'default'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
              ]"
            >
              Default Filter
            </button>

            <!-- Built-in Preset: Show All -->
            <button
              @click="applyPreset('all')"
              :class="[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border',
                activePresetKey === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
              ]"
            >
              Show All
            </button>

            <!-- Custom Presets list from localStorage -->
            <div
              v-for="preset in customPresets"
              :key="preset.id"
              class="relative group inline-flex items-center"
            >
              <button
                @click="applyPreset(preset.id, preset)"
                :class="[
                  'px-3.5 py-1.5 pr-7 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5',
                  activePresetKey === preset.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                ]"
              >
                ★ {{ preset.name }}
              </button>
              <button
                @click="(e) => deleteCustomPreset(preset.id, e)"
                title="Hapus Preset"
                :class="[
                  'absolute right-1.5 text-xs hover:text-red-600 transition p-0.5 rounded-full',
                  activePresetKey === preset.id
                    ? 'text-white/80 hover:text-white'
                    : 'text-purple-400',
                ]"
              >
                &times;
              </button>
            </div>
          </div>

          <!-- Add Preset Button -->
          <button
            @click="isModalOpen = true"
            class="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition flex items-center gap-1"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Simpan Preset Ini
          </button>
        </div>

        <!-- Filter Input Grid -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4"
        >
          <!-- Organic Score -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Organic Score (≥)
            </label>
            <input
              v-model.number="filters.minOrganicScore"
              type="number"
              placeholder="60"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Min Market Cap -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Min MCap ($)
            </label>
            <input
              v-model.number="filters.minMarketCap"
              type="number"
              placeholder="250000"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Token Age (Hours) -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Token Age (Jam)
            </label>
            <input
              v-model.number="filters.maxTokenAgeHours"
              type="number"
              placeholder="5"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Min Holders -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Min Holders
            </label>
            <input
              v-model.number="filters.minHolders"
              type="number"
              placeholder="1000"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Min Volume -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Min Volume ($)
            </label>
            <input
              v-model.number="filters.minVolume"
              type="number"
              placeholder="5000"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- Min Active TVL -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">
              Min Active TVL ($)
            </label>
            <input
              v-model.number="filters.minActiveTvl"
              type="number"
              placeholder="5000"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <!-- No High Single Ownership Checkbox -->
          <div class="flex items-center pt-5">
            <label
              class="relative flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                v-model="filters.noHighSingleOwnership"
                type="checkbox"
                class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition cursor-pointer"
              />
              <span class="text-xs font-semibold text-gray-700">
                No High Single Ownership
              </span>
            </label>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="fetchTokenList"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
          >
            Terapkan Filter Manual
          </button>
        </div>
      </div>

      <!-- Table Card -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="py-16 text-center text-gray-500">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"
          ></div>
          <p class="font-medium">Memuat data dari Meteora API...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="p-8 text-center bg-red-50 text-red-600"
        >
          <p class="font-bold mb-2">{{ errorMessage }}</p>
          <button
            @click="fetchTokenList"
            class="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="pools.length === 0"
          class="py-16 text-center text-gray-500"
        >
          <p class="font-medium">Tidak ada pool yang ditemukan.</p>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                <th class="py-3 px-4 text-center w-12">#</th>
                <th class="py-3 px-4">Name Pair</th>
                <th class="py-3 px-4">Position Created</th>
                <th class="py-3 px-4">Volume / Active TVL</th>
                <th class="py-3 px-4">Fees</th>
                <th class="py-3 px-4">Token Age</th>
                <th class="py-3 px-4">MarketCap</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
              <tr
                v-for="(pool, index) in pools"
                :key="pool.pool_address || index"
                class="hover:bg-gray-50 transition"
              >
                <!-- # Index -->
                <td
                  class="py-3 px-4 text-center font-medium text-gray-400 text-xs"
                >
                  {{ index + 1 }}
                </td>

                <!-- Name Pair -->
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <div class="flex -space-x-2 overflow-hidden flex-shrink-0">
                      <img
                        :src="
                          pool.token_x?.icon ||
                          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                        "
                        :alt="pool.token_x?.symbol"
                        class="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-gray-100"
                      />
                      <img
                        :src="
                          pool.token_y?.icon ||
                          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                        "
                        :alt="pool.token_y?.symbol"
                        class="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-gray-100"
                      />
                    </div>

                    <div>
                      <div class="font-bold text-gray-900">
                        {{
                          pool.name ||
                          `${pool.token_x?.symbol}-${pool.token_y?.symbol}`
                        }}
                      </div>
                      <div
                        class="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"
                      >
                        <span>{{ getBaseToken(pool)?.symbol }}</span>
                        <button
                          @click="
                            copyToClipboard(
                              getBaseToken(pool)?.address || pool.pool_address,
                            )
                          "
                          class="hover:text-gray-600 transition"
                          title="Copy Address"
                        >
                          <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"
                            />
                          </svg>
                        </button>
                        <span
                          v-if="
                            copiedAddress ===
                            (getBaseToken(pool)?.address || pool.pool_address)
                          "
                          class="text-[10px] text-green-600 font-semibold"
                        >
                          Copied!
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Position Created -->
                <td class="py-3 px-4 font-medium text-gray-700">
                  {{ pool.positions_created || 0 }}
                </td>

                <!-- Volume / Active TVL -->
                <td class="py-3 px-4 font-semibold text-amber-600">
                  {{
                    (
                      pool.volume_active_tvl_ratio ||
                      (pool.active_tvl ? pool.volume / pool.active_tvl : 0)
                    ).toFixed(2)
                  }}x
                </td>

                <!-- Fees -->
                <td class="py-3 px-4 font-semibold text-emerald-600">
                  {{ formatCurrency(pool.fee) }}
                </td>

                <!-- Token Age -->
                <td class="py-3 px-4 text-gray-600 font-medium text-xs">
                  {{
                    formatAge(
                      getBaseToken(pool)?.created_at || pool.pool_created_at,
                    )
                  }}
                </td>

                <!-- MarketCap -->
                <td class="py-3 px-4 font-bold text-gray-900">
                  {{
                    formatCurrency(
                      getBaseToken(pool)?.market_cap ||
                        pool.base_token_market_cap,
                    )
                  }}
                </td>

                <!-- Action -->
                <td class="py-3 px-4 text-right">
                  <div
                    class="flex items-center justify-end gap-1.5 whitespace-nowrap"
                  >
                    <!-- Screening Link (New Tab) -->
                    <a
                      :href="`/screening?token=${getBaseToken(pool)?.address}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition"
                    >
                      Screening
                      <svg
                        class="w-3 h-3 opacity-80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>

                    <!-- GMGN Link (New Tab) -->
                    <a
                      :href="`https://gmgn.ai/solana/token/${getBaseToken(pool)?.address}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                    >
                      GMGN
                      <svg
                        class="w-3 h-3 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>

                    <!-- Meteora Link (New Tab) -->
                    <a
                      :href="`https://app.meteora.ag/dlmm/${pool.pool_address}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                    >
                      Meteora
                      <svg
                        class="w-3 h-3 opacity-60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Simpan Preset Baru -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h3 class="text-lg font-bold text-gray-900">Simpan Custom Preset</h3>
        <p class="text-xs text-gray-500">
          Simpan pengaturan filter yang aktif saat ini sebagai preset kustom di
          browser (localStorage).
        </p>

        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1"
            >Nama Preset</label
          >
          <input
            v-model="newPresetName"
            type="text"
            placeholder="Contoh: Gem Hunter 5m"
            @keyup.enter="saveCurrentAsPreset"
            class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="isModalOpen = false"
            class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Batal
          </button>
          <button
            @click="saveCurrentAsPreset"
            :disabled="!newPresetName.trim()"
            class="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
