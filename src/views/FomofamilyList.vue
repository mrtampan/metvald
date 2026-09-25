<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "@lucide/vue";

const router = useRouter();

// Key localStorage untuk Bearer Token
const STORAGE_KEY_TOKEN = "fomo_family_bearer_token";

// State Token Input
const bearerTokenInput = ref("");
const showToken = ref(false);
const tokenSavedSuccess = ref(false);

// State Data
const tokens = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");
const toastMessage = ref("");
const showToast = ref(false);
const copiedAddress = ref("");

// State Search & Filter
const searchQuery = ref("");
const filterDirection = ref("all"); // 'all', 'gainers', 'losers'

// State Sorting (default kosong agar urutan data 100% mengikuti urutan asli dari API Fomo Family)
const sortKey = ref("");
const sortOrder = ref("desc");

// State Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);

const triggerToast = (msg) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2500);
};

// Membersihkan prefix "Bearer " jika user menempelkannya lengkap
const cleanToken = (raw) => {
  if (!raw) return "";
  let trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    trimmed = trimmed.substring(7).trim();
  }
  return trimmed;
};

// Simpan Token ke localStorage
const saveToken = () => {
  const token = cleanToken(bearerTokenInput.value);
  if (!token) {
    errorMessage.value = "Bearer token tidak boleh kosong.";
    return;
  }
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  tokenSavedSuccess.value = true;
  setTimeout(() => {
    tokenSavedSuccess.value = false;
  }, 2500);
  triggerToast("Bearer token berhasil disimpan!");
  fetchTrendingTokens();
};

// Hapus Token
const clearToken = () => {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  bearerTokenInput.value = "";
  tokens.value = [];
  triggerToast("Bearer token dihapus.");
};

// Fetch data trending tokens langsung ke endpoint API Fomo Family
const fetchTrendingTokens = async () => {
  const token = cleanToken(bearerTokenInput.value);

  if (!token) {
    errorMessage.value =
      "Silakan masukkan Bearer Token terlebih dahulu untuk mengambil data trending tokens.";
    tokens.value = [];
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await fetch("/api/trendingTokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 430) {
      throw new Error("Bearer token tidak valid atau sudah expired. Silakan perbarui token.");
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(
        errBody?.error || `HTTP Error ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();
    const list = data.responseObject || data.data || [];
    tokens.value = Array.isArray(list) ? list : [];
    sortKey.value = ""; // Pastikan urutan selalu mengikuti data asli API
    currentPage.value = 1;
    triggerToast(`Berhasil memuat ${tokens.value.length} trending tokens!`);
  } catch (err) {
    console.error("Fetch trendingTokens error:", err);
    errorMessage.value = err.message || "Gagal menghubungi API Fomo Family.";
  } finally {
    isLoading.value = false;
  }
};

// Copy address ke clipboard
const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
  copiedAddress.value = text;
  triggerToast("Address berhasil disalin!");
  setTimeout(() => {
    copiedAddress.value = "";
  }, 2000);
};

// Navigasi ke halaman screening
const goToScreening = (address) => {
  if (!address) return;
  router.push({ name: "screening", query: { token: address } });
};

// Format Nilai Mata Uang (MCap)
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "$0";
  const num = Number(val);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};

// Format Kenaikan Persen (%)
const getPercentChangeNumber = (change24) => {
  if (change24 === undefined || change24 === null || isNaN(change24)) return 0;
  return Number(change24) * 100;
};

const formatPercent = (change24) => {
  const pct = getPercentChangeNumber(change24);
  const prefix = pct > 0 ? "+" : "";
  return `${prefix}${pct.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

// Computed Filtered Tokens
const filteredTokens = computed(() => {
  let list = tokens.value;

  // Filter Kenaikan (All / Gainers / Losers)
  if (filterDirection.value === "gainers") {
    list = list.filter((item) => Number(item.change24 || 0) >= 0);
  } else if (filterDirection.value === "losers") {
    list = list.filter((item) => Number(item.change24 || 0) < 0);
  }

  // Filter Search Query
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter((item) => {
      const name = item.token?.name?.toLowerCase() || "";
      const symbol = item.token?.symbol?.toLowerCase() || "";
      const address = item.token?.address?.toLowerCase() || "";
      return name.includes(q) || symbol.includes(q) || address.includes(q);
    });
  }

  return list;
});

// Computed Sorted Tokens
const sortedTokens = computed(() => {
  if (!sortKey.value) return filteredTokens.value;

  return [...filteredTokens.value].sort((a, b) => {
    let valA, valB;

    switch (sortKey.value) {
      case "name":
        valA = (a.token?.name || a.token?.symbol || "").toLowerCase();
        valB = (b.token?.name || b.token?.symbol || "").toLowerCase();
        return sortOrder.value === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);

      case "marketCap":
        valA = Number(a.marketCap || 0);
        valB = Number(b.marketCap || 0);
        break;

      case "change24":
        valA = Number(a.change24 || 0);
        valB = Number(b.change24 || 0);
        break;

      default:
        return 0;
    }

    if (sortOrder.value === "asc") {
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    }
  });
});

// Sorting Handler
const toggleSort = (key) => {
  if (sortKey.value === key) {
    if (sortOrder.value === "desc") {
      sortOrder.value = "asc";
    } else {
      sortKey.value = "";
      sortOrder.value = "desc";
    }
  } else {
    sortKey.value = key;
    sortOrder.value = key === "name" ? "asc" : "desc";
  }
  currentPage.value = 1;
};

// Computed Pagination
const totalPages = computed(() => {
  return Math.ceil(sortedTokens.value.length / itemsPerPage.value) || 1;
});

const paginatedTokens = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return sortedTokens.value.slice(start, start + itemsPerPage.value);
});

const showingStart = computed(() => {
  if (sortedTokens.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage.value,
    sortedTokens.value.length
  );
});

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

watch([itemsPerPage, searchQuery, filterDirection], () => {
  currentPage.value = 1;
});

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (saved) {
    bearerTokenInput.value = saved;
    fetchTrendingTokens();
  }
});
</script>

<template>
  <div class="bg-gray-100 min-h-screen p-4 md:p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Toast Notification -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-2 opacity-0"
      >
        <div
          v-if="showToast"
          class="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium border border-gray-800"
        >
          <Check class="w-4 h-4 text-green-400" />
          <span>{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- Header & Bearer Token Input Card -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <div class="flex items-center gap-2.5">
              <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles class="w-5 h-5" />
              </div>
              <h1 class="text-2xl font-bold text-gray-900">
                Fomo Family Trending
              </h1>
            </div>
            <p class="text-gray-500 text-sm mt-1">
              Daftar token trending dari Fomo Family API (nama token, logo, market cap, dan persentase kenaikan).
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="fetchTrendingTokens"
              :disabled="isLoading"
              class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        <!-- Section Bearer Token Input -->
        <div class="pt-4 border-t border-gray-100 space-y-2.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <label
              class="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Key class="w-3.5 h-3.5 text-blue-600" />
              <span>Bearer Token Authentication</span>
            </label>
            <span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200">
              Masa aktif token ~24 jam (tersimpan di browser)
            </span>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div class="relative flex-1">
              <input
                :type="showToken ? 'text' : 'password'"
                v-model="bearerTokenInput"
                placeholder="Tempel Bearer token di sini (eyJhbGciOi...)"
                class="w-full pl-3.5 pr-20 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-gray-50/50 hover:bg-white transition"
              />
              <button
                type="button"
                @click="showToken = !showToken"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition"
                :title="showToken ? 'Sembunyikan' : 'Perlihatkan'"
              >
                <EyeOff v-if="showToken" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="saveToken"
                :disabled="isLoading"
                class="bg-gray-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Check v-if="tokenSavedSuccess" class="w-3.5 h-3.5 text-green-400" />
                <span>{{ tokenSavedSuccess ? "Tersimpan!" : "Terapkan & Simpan" }}</span>
              </button>

              <button
                @click="clearToken"
                title="Hapus token"
                class="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 p-2.5 rounded-xl transition border border-gray-200 cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics & Search Toolbar -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <Search
            class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari token berdasarkan nama, simbol, atau address..."
            class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
          >
            &times;
          </button>
        </div>

        <!-- Filter Arah Kenaikan (Gainers / Losers / All) -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              @click="filterDirection = 'all'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                filterDirection === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
            >
              Semua ({{ tokens.length }})
            </button>
            <button
              @click="filterDirection = 'gainers'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1',
                filterDirection === 'gainers'
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-green-600',
              ]"
            >
              <TrendingUp class="w-3 h-3" />
              <span>Naik</span>
            </button>
            <button
              @click="filterDirection = 'losers'"
              :class="[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1',
                filterDirection === 'losers'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-red-600',
              ]"
            >
              <TrendingDown class="w-3 h-3" />
              <span>Turun</span>
            </button>
          </div>

          <!-- Items Per Page -->
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <span class="hidden sm:inline">Per halaman:</span>
            <select
              v-model="itemsPerPage"
              class="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="py-20 text-center text-gray-500">
          <div
            class="inline-block animate-spin rounded-full h-9 w-9 border-4 border-blue-600 border-t-transparent mb-3"
          ></div>
          <p class="font-medium text-gray-700">Memuat trending tokens dari Fomo Family...</p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="errorMessage"
          class="p-8 text-center bg-red-50/70 text-red-600 space-y-3"
        >
          <AlertCircle class="w-8 h-8 mx-auto text-red-500" />
          <div>
            <p class="font-bold text-base">{{ errorMessage }}</p>
            <p class="text-xs text-red-500/80 mt-1">
              Pastikan Bearer Token masih aktif dan belum kedaluwarsa.
            </p>
          </div>
          <button
            @click="fetchTrendingTokens"
            class="bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="sortedTokens.length === 0"
          class="py-16 text-center text-gray-500"
        >
          <p class="font-semibold text-gray-700">Tidak ada token yang sesuai kriteria.</p>
          <p class="text-xs text-gray-400 mt-1" v-if="searchQuery">
            Coba ubah kata kunci pencarian "{{ searchQuery }}".
          </p>
        </div>

        <!-- Table View -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none"
              >
                <th class="py-3.5 px-4 text-center w-14">#</th>

                <!-- Kolom Token (Logo & Nama) -->
                <th
                  @click="toggleSort('name')"
                  class="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition group"
                  :class="{
                    'text-blue-600 font-bold bg-blue-50/50': sortKey === 'name',
                  }"
                  title="Urutkan berdasarkan Nama Token"
                >
                  <div class="flex items-center gap-1.5">
                    <span>Token (Logo & Nama)</span>
                    <ChevronUp
                      v-if="sortKey === 'name' && sortOrder === 'asc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ChevronDown
                      v-else-if="sortKey === 'name' && sortOrder === 'desc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ArrowUpDown
                      v-else
                      class="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100"
                    />
                  </div>
                </th>

                <!-- Kolom Market Cap (MCap) -->
                <th
                  @click="toggleSort('marketCap')"
                  class="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition group text-right"
                  :class="{
                    'text-blue-600 font-bold bg-blue-50/50': sortKey === 'marketCap',
                  }"
                  title="Urutkan berdasarkan Market Cap"
                >
                  <div class="flex items-center justify-end gap-1.5">
                    <span>Market Cap (MCap)</span>
                    <ChevronUp
                      v-if="sortKey === 'marketCap' && sortOrder === 'asc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ChevronDown
                      v-else-if="sortKey === 'marketCap' && sortOrder === 'desc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ArrowUpDown
                      v-else
                      class="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100"
                    />
                  </div>
                </th>

                <!-- Kolom Kenaikan (%) -->
                <th
                  @click="toggleSort('change24')"
                  class="py-3.5 px-4 cursor-pointer hover:bg-gray-100/80 transition group text-right"
                  :class="{
                    'text-blue-600 font-bold bg-blue-50/50': sortKey === 'change24',
                  }"
                  title="Urutkan berdasarkan Kenaikan (%)"
                >
                  <div class="flex items-center justify-end gap-1.5">
                    <span>Kenaikan (24h %)</span>
                    <ChevronUp
                      v-if="sortKey === 'change24' && sortOrder === 'asc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ChevronDown
                      v-else-if="sortKey === 'change24' && sortOrder === 'desc'"
                      class="w-3.5 h-3.5 text-blue-600"
                    />
                    <ArrowUpDown
                      v-else
                      class="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100"
                    />
                  </div>
                </th>

                <!-- Kolom Aksi -->
                <th class="py-3.5 px-4 text-center w-28">
                  <span>Aksi</span>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-gray-100 text-sm">
              <tr
                v-for="(item, index) in paginatedTokens"
                :key="item.token?.address || index"
                @click="goToScreening(item.token?.address)"
                class="hover:bg-blue-50/40 cursor-pointer transition"
              >
                <!-- # Index -->
                <td
                  class="py-3 px-4 text-center font-medium text-gray-400 text-xs"
                >
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>

                <!-- Token: Logo + Nama + Symbol -->
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <!-- Logo Token -->
                    <div class="relative flex-shrink-0">
                      <img
                        :src="
                          item.token?.info?.imageSmallUrl ||
                          item.token?.info?.imageThumbUrl ||
                          item.token?.info?.imageLargeUrl ||
                          'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                        "
                        :alt="item.token?.name || item.token?.symbol"
                        class="w-10 h-10 rounded-full object-cover bg-gray-100 ring-2 ring-gray-100"
                        @error="
                          $event.target.src =
                            'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                        "
                      />
                    </div>

                    <!-- Nama, Symbol & Contract Address -->
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-gray-900 truncate">
                          {{ item.token?.name || "Unknown Token" }}
                        </span>
                        <span
                          class="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-md"
                        >
                          {{ item.token?.symbol || "-" }}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span class="font-mono">
                          {{
                            item.token?.address
                              ? item.token.address.slice(0, 4) +
                                "..." +
                                item.token.address.slice(-4)
                              : ""
                          }}
                        </span>
                        <button
                          @click.stop="copyToClipboard(item.token?.address)"
                          class="hover:text-blue-600 transition p-0.5 rounded"
                          title="Salin Address"
                        >
                          <Copy class="w-3 h-3" />
                        </button>

                        <!-- External Links (Dexscreener) -->
                        <div class="flex items-center gap-1 ml-1" @click.stop>
                          <a
                            :href="`https://dexscreener.com/solana/${item.token?.address}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-400 hover:text-blue-600 transition"
                            title="Buka di DexScreener"
                          >
                            <ExternalLink class="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Market Cap (MCap) -->
                <td class="py-3 px-4 text-right">
                  <span class="font-bold text-gray-900 text-sm">
                    {{ formatCurrency(item.marketCap) }}
                  </span>
                </td>

                <!-- Kenaikan Berapa Persen (%) -->
                <td class="py-3 px-4 text-right">
                  <div
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold"
                    :class="[
                      getPercentChangeNumber(item.change24) >= 0
                        ? 'bg-green-50 text-green-700 border border-green-200/60'
                        : 'bg-red-50 text-red-700 border border-red-200/60',
                    ]"
                  >
                    <TrendingUp
                      v-if="getPercentChangeNumber(item.change24) >= 0"
                      class="w-3.5 h-3.5"
                    />
                    <TrendingDown v-else class="w-3.5 h-3.5" />
                    <span>{{ formatPercent(item.change24) }}</span>
                  </div>
                </td>

                <!-- Aksi Button -->
                <td class="py-3 px-4 text-center" @click.stop>
                  <button
                    @click="goToScreening(item.token?.address)"
                    class="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-blue-200 hover:border-blue-600 cursor-pointer"
                  >
                    Screening
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div
          v-if="sortedTokens.length > 0"
          class="px-4 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50"
        >
          <div class="text-xs text-gray-500">
            Menampilkan <span class="font-semibold text-gray-700">{{ showingStart }}</span> -
            <span class="font-semibold text-gray-700">{{ showingEnd }}</span> dari
            <span class="font-semibold text-gray-700">{{ sortedTokens.length }}</span> token
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <ChevronLeft class="w-4 h-4 text-gray-600" />
            </button>

            <span class="text-xs font-semibold text-gray-700 px-3 py-1">
              Halaman {{ currentPage }} dari {{ totalPages }}
            </span>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="p-2 border border-gray-200 rounded-xl hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <ChevronRight class="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
