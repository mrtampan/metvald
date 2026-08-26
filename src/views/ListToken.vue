<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { watchDebounced } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useScreeningStore } from "../stores/screeningStore";

const router = useRouter();
const screeningStore = useScreeningStore();
const { screeningHistory } = storeToRefs(screeningStore);

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
const searchToken = ref(""); // Single token search input

// Computed property untuk filter instan di client side berdasarkan kolom data token
const filteredPools = computed(() => {
  if (!searchToken.value || !searchToken.value.trim()) {
    return pools.value;
  }
  const query = searchToken.value.trim().toLowerCase();
  return pools.value.filter((pool) => {
    const tokenXAddr = pool.token_x?.address?.toLowerCase() || "";
    const tokenYAddr = pool.token_y?.address?.toLowerCase() || "";
    const tokenXSym = pool.token_x?.symbol?.toLowerCase() || "";
    const tokenYSym = pool.token_y?.symbol?.toLowerCase() || "";
    const poolAddr = pool.pool_address?.toLowerCase() || "";
    const poolName = pool.name?.toLowerCase() || "";

    return (
      tokenXAddr.includes(query) ||
      tokenYAddr.includes(query) ||
      tokenXSym.includes(query) ||
      tokenYSym.includes(query) ||
      poolAddr.includes(query) ||
      poolName.includes(query)
    );
  });
});

// State & Computed Property Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10); // Default 10 items per page

const totalPages = computed(() => {
  return Math.ceil(filteredPools.value.length / itemsPerPage.value) || 1;
});

const paginatedPools = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPools.value.slice(start, end);
});

const showingStart = computed(() => {
  if (filteredPools.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    filteredPools.value.length,
  );
});

const resetPagination = () => {
  currentPage.value = 1;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

watch([itemsPerPage, searchToken], () => {
  currentPage.value = 1;
});

// Watch searchToken menggunakan watchDebounced VueUse untuk auto refetch API saat input berubah
watchDebounced(
  searchToken,
  (newVal) => {
    const trimmed = (newVal || "").trim();
    if (!trimmed || trimmed.length >= 30) {
      fetchTokenList();
    }
  },
  { debounce: 350, maxWait: 1000 },
);

// Watch filters secara debounced untuk auto fetch ketika input filter berubah secara real-time
watchDebounced(
  filters,
  () => {
    fetchTokenList();
  },
  { debounce: 400, maxWait: 1200, deep: true },
);

// State modal & notification
const isFilterModalOpen = ref(false);
const isModalOpen = ref(false);
const newPresetName = ref("");
const presetSuccessMessage = ref("");

// Computed property untuk mengecek apakah preset saat ini adalah preset custom (dari localStorage)
const isCurrentPresetCustom = computed(() => {
  return (
    activePresetKey.value !== "default" &&
    activePresetKey.value !== "all" &&
    customPresets.value.some((p) => p.id === activePresetKey.value)
  );
});

// Computed property untuk label preset aktif
const activePresetName = computed(() => {
  if (activePresetKey.value === "default") return "Default Filter";
  if (activePresetKey.value === "all") return "Show All";
  const custom = customPresets.value.find(
    (p) => p.id === activePresetKey.value,
  );
  return custom ? custom.name : "Custom Filter";
});

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

// Update preset custom yang sedang aktif di localStorage (Hanya untuk preset custom)
const updateCurrentPreset = () => {
  if (!isCurrentPresetCustom.value) return;
  const index = customPresets.value.findIndex(
    (p) => p.id === activePresetKey.value,
  );
  if (index !== -1) {
    customPresets.value[index].filters = JSON.parse(
      JSON.stringify(filters.value),
    );
    try {
      localStorage.setItem(
        "metvald_custom_presets",
        JSON.stringify(customPresets.value),
      );
      presetSuccessMessage.value = `Preset "${customPresets.value[index].name}" berhasil diperbarui!`;
      setTimeout(() => {
        presetSuccessMessage.value = "";
      }, 3000);
    } catch (e) {
      console.error("Gagal memperbarui preset di localStorage:", e);
    }
  }
};

// Simpan preset custom baru ke localStorage
const saveCurrentAsPreset = () => {
  if (!newPresetName.value.trim()) return;

  const newPreset = {
    id: Date.now(),
    name: newPresetName.value.trim(),
    filters: JSON.parse(JSON.stringify(filters.value)),
  };

  customPresets.value.push(newPreset);
  try {
    localStorage.setItem(
      "metvald_custom_presets",
      JSON.stringify(customPresets.value),
    );
    presetSuccessMessage.value = `Preset "${newPreset.name}" berhasil disimpan!`;
    setTimeout(() => {
      presetSuccessMessage.value = "";
    }, 3000);
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
    filters.value = JSON.parse(JSON.stringify(PRESET_DEFAULT));
  } else if (key === "all") {
    filters.value = JSON.parse(JSON.stringify(PRESET_ALL));
  } else if (customPresetObj) {
    filters.value = JSON.parse(JSON.stringify(customPresetObj.filters));
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

// Helper untuk reset pencarian token
const clearTokenSearch = () => {
  searchToken.value = "";
  fetchTokenList();
};

// Fetch data dari Meteora Discovery API
const fetchTokenList = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const filterConditions = [];

    // Filter pencarian Token Address
    if (searchToken.value && searchToken.value.trim()) {
      const input = searchToken.value.trim();
      if (input.includes("token_x=") || input.includes("token_y=")) {
        filterConditions.push(input);
      } else if (input.includes("&&")) {
        const parts = input.split("&&").map((p) => p.trim());
        if (parts.length === 2) {
          filterConditions.push(`token_x=${parts[0]}&&token_y=${parts[1]}`);
        } else {
          filterConditions.push(input);
        }
      } else if (input.includes(",")) {
        const parts = input.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          filterConditions.push(`token_x=${parts[0]}&&token_y=${parts[1]}`);
        } else {
          filterConditions.push(`token_x=${input}||token_y=${input}`);
        }
      } else {
        filterConditions.push(`token_x=${input}||token_y=${input}`);
      }
    }

    if (filters.value.noCriticalWarnings) {
      filterConditions.push("base_token_has_critical_warnings=false");
      filterConditions.push("quote_token_has_critical_warnings=false");
    }

    if (filters.value.noHighSingleOwnership) {
      filterConditions.push("base_token_has_high_single_ownership=false");
    }

    if (filters.value.newListing) {
      filterConditions.push("base_token_is_new_listing=false");
    }

    if (filters.value.noHighSupplyConcentration) {
      filterConditions.push("base_token_has_high_supply_concentration=false");
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

    if (filters.value.minTvl > 0) {
      filterConditions.push(`tvl>=${filters.value.minTvl}`);
    }

    if (filters.value.minFeeActiveTvlRatio) {
      filterConditions.push(
        `fee_active_tvl_ratio>=${filters.value.minFeeActiveTvlRatio}`,
      );
    }

    const filterByQuery = filterConditions.join("&&");
    const categoryParam =
      searchToken.value && searchToken.value.trim() ? "" : "&category=top";
    const apiUrl = `https://pool-discovery-api.datapi.meteora.ag/pools?page_size=50&timeframe=2h${categoryParam}&filter_by=${encodeURIComponent(filterByQuery)}`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    pools.value = data.pools || data.data || [];
    currentPage.value = 1;
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

// Helper & State Management History Screening (Pinia Store)
const clearScreeningHistory = () => {
  screeningStore.clearScreeningHistory();
};

const truncateAddress = (addr) => {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};

onMounted(() => {
  loadCustomPresets();
  screeningStore.loadScreeningHistory();
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
            @click="isFilterModalOpen = true"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm"
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
            <span>Filter</span>
            <span
              class="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg"
            >
              {{ activePresetName }}
            </span>
          </button>

          <button
            @click="fetchTokenList"
            :disabled="isLoading"
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
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

      <!-- Toast / Notification Success Preset -->
      <div
        v-if="presetSuccessMessage"
        class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center justify-between transition"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>{{ presetSuccessMessage }}</span>
        </div>
        <button
          @click="presetSuccessMessage = ''"
          class="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
        >
          &times;
        </button>
      </div>

      <!-- Full Modal Filter -->
      <div
        v-if="isFilterModalOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto"
        @click.self="isFilterModalOpen = false"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        >
          <!-- Modal Header -->
          <div
            class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
          >
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <svg
                  class="w-5 h-5"
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
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900">
                  Pengaturan Filter
                </h2>
                <p class="text-xs text-gray-500">
                  Sesuaikan kriteria filter. Perubahan pada input akan langsung
                  diterapkan.
                </p>
              </div>
            </div>

            <button
              @click="isFilterModalOpen = false"
              class="text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 p-2 rounded-xl transition"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6 overflow-y-auto">
            <!-- Presets Section -->
            <div>
              <div class="flex items-center justify-between mb-2.5">
                <span
                  class="text-xs font-bold uppercase text-gray-400 tracking-wider"
                  >Pilih Preset</span
                >
                <span class="text-[11px] text-gray-400"
                  >Preset custom disimpan di localStorage</span
                >
              </div>
              <div
                class="flex flex-wrap items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100"
              >
                <!-- Built-in Preset: Default Filter -->
                <button
                  @click="applyPreset('default')"
                  :class="[
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border',
                    activePresetKey === 'default'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100',
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
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100',
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
                      'px-3.5 py-1.5 pr-8 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5',
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
                      'absolute right-1.5 text-xs transition p-1 rounded-full',
                      activePresetKey === preset.id
                        ? 'text-white/80 hover:text-white'
                        : 'text-purple-400 hover:text-red-500',
                    ]"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- Filter Inputs Grid -->
            <div class="space-y-4">
              <h3
                class="text-xs font-bold uppercase text-gray-400 tracking-wider"
              >
                Kriteria Filter
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Organic Score -->
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">
                    Organic Score (≥)
                  </label>
                  <input
                    v-model.number="filters.minOrganicScore"
                    type="number"
                    placeholder="60"
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <!-- Min TVL -->
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">
                    Min TVL ($)
                  </label>
                  <input
                    v-model.number="filters.minTvl"
                    type="number"
                    placeholder="0"
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <!-- Fee/Active TVL -->
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">
                    Min Fee/Active TVL %
                  </label>
                  <input
                    v-model.number="filters.minFeeActiveTvlRatio"
                    type="number"
                    placeholder="0"
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <!-- Min Fee % -->
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">
                    Min Fee (%)
                  </label>
                  <input
                    v-model.number="filters.minFeePct"
                    type="number"
                    placeholder="1"
                    class="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <!-- Security & Status Toggles -->
              <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2"
              >
                <label
                  class="flex items-center gap-2 cursor-pointer select-none bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 hover:bg-gray-100 transition"
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

                <label
                  class="flex items-center gap-2 cursor-pointer select-none bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 hover:bg-gray-100 transition"
                >
                  <input
                    v-model="filters.newListing"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-gray-700">
                    New Listing
                  </span>
                </label>

                <label
                  class="flex items-center gap-2 cursor-pointer select-none bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 hover:bg-gray-100 transition"
                >
                  <input
                    v-model="filters.noHighSupplyConcentration"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-gray-700">
                    No High Supply Concentration
                  </span>
                </label>

                <label
                  class="flex items-center gap-2 cursor-pointer select-none bg-gray-50 p-2.5 rounded-xl border border-gray-200/80 hover:bg-gray-100 transition"
                >
                  <input
                    v-model="filters.noCriticalWarnings"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition cursor-pointer"
                  />
                  <span class="text-xs font-semibold text-gray-700">
                    No Critical Warnings
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div
            class="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div class="text-xs text-gray-500 flex items-center gap-1.5">
              <span
                class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              ></span>
              <span>Filter otomatis diterapkan saat ada perubahan.</span>
            </div>

            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <!-- Update Preset (Hanya muncul jika preset aktif disimpan di localStorage) -->
              <button
                v-if="isCurrentPresetCustom"
                @click="updateCurrentPreset"
                class="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Update Preset Ini
              </button>

              <!-- Tombol Simpan Sebagai Preset Baru -->
              <button
                @click="isModalOpen = true"
                class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
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
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Simpan Preset Baru
              </button>

              <!-- Close Modal -->
              <button
                @click="isFilterModalOpen = false"
                class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History Screening (Di Atas Pencarian) -->
      <div
        v-if="screeningHistory.length > 0"
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg
              class="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span
              class="text-xs font-bold text-gray-700 uppercase tracking-wider"
            >
              History Screening
            </span>
            <span
              class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full"
            >
              {{ screeningHistory.length }}
            </span>
          </div>
          <button
            @click="clearScreeningHistory"
            class="text-[11px] text-gray-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1 font-medium"
            title="Hapus riwayat screening"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Hapus History
          </button>
        </div>

        <!-- Horizontal Scroll Container Item History (Desain: Gambar, Address, Name Token) -->
        <div
          class="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin"
        >
          <a
            v-for="item in screeningHistory"
            :key="item.address"
            :href="`/screening?token=${item.address}`"
            class="flex items-center gap-2.5 px-3 py-2 bg-gray-50 hover:bg-blue-50/80 border border-gray-200 hover:border-blue-300 rounded-xl transition flex-shrink-0 group shadow-2xs"
            :title="`Screening ${item.name} (${item.address})`"
          >
            <!-- 1. Gambar -->
            <img
              :src="
                item.icon ||
                'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
              "
              :alt="item.name"
              class="w-6 h-6 rounded-full object-cover bg-gray-200 ring-1 ring-black/5 flex-shrink-0"
              @error="
                $event.target.src =
                  'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
              "
            />

            <div class="flex flex-col text-left">
              <!-- 2. Name Token -->
              <span
                class="text-xs font-bold text-gray-800 group-hover:text-blue-600 leading-tight truncate max-w-[110px]"
              >
                {{ item.name || "Unknown" }}
              </span>

              <!-- 3. Address Token -->
              <span
                class="text-[10px] font-mono text-gray-400 leading-tight truncate max-w-[110px]"
              >
                {{ truncateAddress(item.address) }}
              </span>
            </div>
          </a>
        </div>
      </div>

      <!-- Single Token Search Bar (Di Bawah Filter) -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3"
      >
        <div class="relative w-full">
          <div
            class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            v-model.trim="searchToken"
            type="text"
            placeholder="Cari berdasarkan Token Address, Symbol, atau Pair (contoh: JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN)..."
            class="w-full pl-10 pr-9 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50/50 font-mono transition"
          />
          <button
            v-if="searchToken"
            @click="clearTokenSearch"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition cursor-pointer"
            title="Hapus pencarian"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Active Search Notice (Di Dalam Card Pencarian) -->
        <div
          v-if="searchToken"
          class="bg-blue-50/80 rounded-xl p-2.5 border border-blue-100 flex items-center justify-between text-xs text-blue-800"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold">Hasil Pencarian Token:</span>
            <span
              class="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono text-[11px]"
            >
              {{ searchToken }}
            </span>
            <span class="text-gray-500 text-[11px]">
              ({{ filteredPools.length }} pool ditemukan)
            </span>
          </div>
          <button
            @click="clearTokenSearch"
            class="text-blue-700 hover:text-red-600 underline text-xs font-semibold ml-2 transition"
          >
            Hapus Pencarian
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
          v-else-if="filteredPools.length === 0"
          class="py-16 text-center text-gray-500"
        >
          <p class="font-medium">Tidak ada pool yang cocok dengan pencarian.</p>
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
                v-for="(pool, index) in paginatedPools"
                :key="pool.pool_address || index"
                class="hover:bg-gray-50 transition"
              >
                <!-- # Index -->
                <td
                  class="py-3 px-4 text-center font-medium text-gray-400 text-xs"
                >
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>

                <!-- Name Pair -->
                <td class="py-3 px-4">
                  <div class="flex items-start gap-3">
                    <div
                      class="flex -space-x-2 overflow-hidden flex-shrink-0 mt-0.5"
                    >
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

                      <!-- External Tool Links -->
                      <div class="flex items-center gap-0.5 mt-1.5">
                        <!-- Bubblemaps Link -->
                        <a
                          :href="`https://v2.bubblemaps.io/map?address=${getBaseToken(pool)?.address || pool.pool_address}&chain=solana`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center justify-center p-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-md transition"
                          title="Bubblemaps"
                        >
                          <img
                            src="https://www.google.com/s2/favicons?domain=bubblemaps.io&sz=64"
                            alt="Bubblemaps"
                            class="w-3.5 h-3.5 rounded-xs object-contain"
                          />
                        </a>

                        <!-- Fabriq Link -->
                        <a
                          :href="`https://fabriq.trade/trending?includeTokens=${getBaseToken(pool)?.address || pool.pool_address}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center justify-center p-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-md transition"
                          title="Fabriq Trade"
                        >
                          <img
                            src="https://www.google.com/s2/favicons?domain=fabriq.trade&sz=64"
                            alt="Fabriq Trade"
                            class="w-3.5 h-3.5 rounded-xs object-contain"
                          />
                        </a>

                        <!-- Axiom Link -->
                        <a
                          :href="`https://axiom.trade/t/${getBaseToken(pool)?.address || pool.pool_address}/`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center justify-center p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md transition"
                          title="Axiom Trade"
                        >
                          <img
                            src="https://www.google.com/s2/favicons?domain=axiom.trade&sz=64"
                            alt="Axiom Trade"
                            class="w-3.5 h-3.5 rounded-xs object-contain"
                          />
                        </a>

                        <!-- GMGN Link -->
                        <a
                          :href="`https://gmgn.ai/sol/token/${getBaseToken(pool)?.address || pool.pool_address}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center justify-center p-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-md transition"
                          title="GMGN"
                        >
                          <img
                            src="https://www.google.com/s2/favicons?domain=gmgn.ai&sz=64"
                            alt="GMGN"
                            class="w-3.5 h-3.5 rounded-xs object-contain"
                          />
                        </a>

                        <!-- Meteora Link -->
                        <a
                          :href="`https://app.meteora.ag/dlmm/${pool.pool_address}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center justify-center p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md transition"
                          title="Meteora"
                        >
                          <img
                            src="https://www.google.com/s2/favicons?domain=meteora.ag&sz=64"
                            alt="Meteora"
                            class="w-3.5 h-3.5 rounded-xs object-contain"
                          />
                        </a>
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
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-xs transition"
                      title="Screening"
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
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls Bar -->
        <div
          v-if="filteredPools.length > 0"
          class="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <!-- Items per page & Showing info -->
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                v-model.number="itemsPerPage"
                @change="resetPagination"
                class="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition cursor-pointer"
              >
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
              <span>per halaman</span>
            </div>
            <span class="hidden md:inline text-gray-300">|</span>
            <div>
              Menampilkan
              <span class="font-bold text-gray-800">{{ showingStart }}</span>
              -
              <span class="font-bold text-gray-800">{{ showingEnd }}</span>
              dari
              <span class="font-bold text-gray-800">{{ filteredPools.length }}</span>
              pool
            </div>
          </div>

          <!-- Page Navigation Buttons -->
          <div class="flex items-center gap-1">
            <!-- Previous Button -->
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Prev</span>
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1 px-1">
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer',
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200',
                ]"
              >
                {{ page }}
              </button>
            </div>

            <!-- Next Button -->
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
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
