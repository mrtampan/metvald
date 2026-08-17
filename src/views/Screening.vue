<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const token = computed(() => route.query.token || "");
const tokenInput = ref(token.value);
const isLoading = ref(false);
const message = ref("");
const rugcheckData = ref(null);
const tokenMeta = ref(null);
const riskDetails = ref(null);
const dexscreenerData = ref(null);
const meteoraData = ref(null);
const holderProfiles = ref([]);
const submittedAddress = ref("");
const holdersData = ref([]);
const totalHoldersCount = ref(0);
const top10Percentage = ref(0);

const insiderWalletsCount = ref(0);
const insiderSupplyPct = ref(0);

const selectedChart = ref("dexscreener");

const chartPlatforms = [
  { id: "dexscreener", name: "DexScreener" },
  { id: "gmgn", name: "GMGN.ai" },
  { id: "geckoterminal", name: "GeckoTerminal" },
];

const currentChartEmbedUrl = computed(() => {
  if (!submittedAddress.value) return "";
  if (selectedChart.value === "gmgn") {
    return `https://www.gmgn.cc/kline/sol/${submittedAddress.value}?theme=light`;
  }
  if (selectedChart.value === "geckoterminal") {
    return `https://www.geckoterminal.com/solana/tokens/${submittedAddress.value}?embed=1&info=0&swaps=0`;
  }
  return `https://dexscreener.com/solana/${submittedAddress.value}?embed=1&theme=light&trades=0&info=0`;
});

const currentChartExternalUrl = computed(() => {
  if (!submittedAddress.value) return "#";
  if (selectedChart.value === "gmgn") {
    return `https://gmgn.ai/sol/token/${submittedAddress.value}`;
  }
  if (selectedChart.value === "geckoterminal") {
    return `https://www.geckoterminal.com/solana/tokens/${submittedAddress.value}`;
  }
  return `https://dexscreener.com/solana/${submittedAddress.value}`;
});

const formattedHolderProfiles = computed(() => {
  if (!holderProfiles.value) return [];

  const dataObj = holderProfiles.value;
  const tags =
    dataObj.tags || dataObj.holder_summary || dataObj.items || dataObj;

  const rawSummary = dataObj.holder_summary || dataObj.holderSummary || {};
  const totalHolding = Number(
    rawSummary.total_holding ||
      rawSummary.totalHolding ||
      dataObj.total_holding ||
      dataObj.totalSupply ||
      100,
  );

  const targets = [
    { tag: "bundler", label: "Bundler", color: "amber" },
    { tag: "sniper", label: "Sniper", color: "purple" },
    { tag: "insider", label: "Insider", color: "red" },
    { tag: "dev", label: "Dev", color: "blue" },
    { tag: "smart_trader", label: "Smart Trader", color: "emerald" },
  ];

  return targets.map((target) => {
    let count = 0;
    let holdAmount = 0;
    let explicitTotal = totalHolding;
    let pct = 0;

    const tagKey = target.tag;
    const altKey = tagKey.replace("_", " ");

    if (Array.isArray(tags)) {
      const found = tags.find(
        (t) =>
          t.tag?.toLowerCase() === tagKey ||
          t.tag?.toLowerCase() === altKey ||
          t.name?.toLowerCase() === tagKey ||
          t.name?.toLowerCase() === altKey,
      );
      if (found) {
        count = found.holder_count ?? found.count ?? found.amount ?? 0;
        holdAmount = found.hold_amount ?? found.amount ?? 0;
        pct = found.percentage ?? found.pct ?? 0;
        if (found.total_holding) explicitTotal = Number(found.total_holding);
      }
    } else if (typeof tags === "object" && tags !== null) {
      const item = tags[tagKey] || tags[altKey] || {};
      count =
        item.holder_count ??
        item.count ??
        item.amount ??
        (typeof item === "number" ? item : 0);
      holdAmount =
        item.hold_amount ??
        item.amount ??
        (typeof item === "number" ? item : 0);
      pct = item.percentage ?? item.pct ?? 0;
      if (item.total_holding) explicitTotal = Number(item.total_holding);

      const summaryItem = rawSummary[tagKey] || rawSummary[altKey] || {};
      if (typeof summaryItem === "object") {
        if (!holdAmount && summaryItem.hold_amount)
          holdAmount = summaryItem.hold_amount;
        if (!count && summaryItem.count) count = summaryItem.count;
        if (!pct && summaryItem.percentage) pct = summaryItem.percentage;
        if (summaryItem.total_holding)
          explicitTotal = Number(summaryItem.total_holding);
      }
    }

    if (!pct && explicitTotal > 0 && holdAmount > 0) {
      pct = (Number(holdAmount) / Number(explicitTotal)) * 100;
    }

    return {
      tag: target.tag,
      label: target.label,
      color: target.color,
      holder_count: Number(count),
      hold_amount: Number(holdAmount),
      percentage: Number(Number(pct).toFixed(2)),
    };
  });
});

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "N/A";
  return (
    "$" + Number(val).toLocaleString("en-US", { maximumFractionDigits: 2 })
  );
};

const formatSol = (val) => {
  if (val === undefined || val === null || isNaN(val)) return "N/A";
  return (
    Number(val).toLocaleString("en-US", { maximumFractionDigits: 4 }) + " SOL"
  );
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

const fetchScreeningData = async () => {
  const address = token.value.trim();

  if (!address) {
    message.value = "Token not found in URL";
    return;
  }

  isLoading.value = true;
  message.value = "";
  rugcheckData.value = null;
  tokenMeta.value = null;
  riskDetails.value = null;
  dexscreenerData.value = null;
  meteoraData.value = null;
  holderProfiles.value = [];
  holdersData.value = [];
  totalHoldersCount.value = 0;
  top10Percentage.value = 0;
  submittedAddress.value = address;

  try {
    const response = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${address}/report`,
    );

    if (!response.ok) {
      throw new Error("Token not found or invalid address");
    }

    const data = await response.json();

    rugcheckData.value = {
      score: data.score_normalised || 0,
      risk: data.risks || [],
    };

    tokenMeta.value = data.tokenMeta || {
      name: "Unknown",
      symbol: "Unknown",
    };

    riskDetails.value = {
      freezeAuthority: data.freezeAuthority || "N/A",
      rugged: data.rugged || false,
      score: data.score || 0,
    };

    // Simple Holders Data Population
    holdersData.value = (data.topHolders || []).map((item, idx) => ({
      owner: item.owner || item.address,
      uiAmount: item.uiAmount || item.amount || 0,
      pct: item.pct || 0,
      rank: idx + 1,
      insider: Boolean(item.insider),
    }));

    totalHoldersCount.value = data.totalHolders;

    if (holdersData.value.length > 0) {
      const top10Sum = holdersData.value
        .slice(0, 10)
        .reduce((acc, h) => acc + (h.pct || 0), 0);
      top10Percentage.value = Number(top10Sum.toFixed(2));
    }

    // Extract Insider Networks Data
    let rawInsiderCount = Number(data.graphInsidersDetected) || 0;

    const ownerCountsMap = {};
    holdersData.value.forEach((h) => {
      if (h.owner) {
        ownerCountsMap[h.owner] = (ownerCountsMap[h.owner] || 0) + 1;
      }
    });

    const insiderHolders = holdersData.value.filter(
      (h) =>
        h.insider || (ownerCountsMap[h.owner] && ownerCountsMap[h.owner] > 1),
    );

    const rawInsiderSupply = insiderHolders.reduce(
      (acc, h) => acc + (h.pct || 0),
      0,
    );

    insiderWalletsCount.value = Math.max(
      rawInsiderCount,
      insiderHolders.length,
    );
    insiderSupplyPct.value = Number(rawInsiderSupply.toFixed(2));

    // Fetch Birdeye Holder Profile API (Simple Format)
    try {
      const apiKey =
        (typeof process !== "undefined" && process.env?.BirdeyeApiKey) ||
        import.meta.env?.VITE_Birdeye_Api_Key ||
        "";

      const options = {
        method: "GET",
        headers: {
          "x-chain": "solana",
          accept: "application/json",
          "X-API-KEY": apiKey,
        },
      };

      const res = await fetch(
        `https://public-api.birdeye.so/token/v1/holder-profile?token_address=${address}&interval=1h&ui_amount_mode=raw&include_zero_balance=true`,
        options,
      );

      if (res.ok && res.status !== 204) {
        const json = await res.json();
        holderProfiles.value = json.data;
      }
    } catch (err) {
      console.error("Birdeye holder profile fetch error:", err);
    }

    if (!holderProfiles.value) {
      holderProfiles.value = data;
    }

    try {
      const dexResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      );
      if (dexResponse.ok) {
        const dexDataResponse = await dexResponse.json();
        if (dexDataResponse.pairs && dexDataResponse.pairs.length > 0) {
          const pair = dexDataResponse.pairs[0];
          dexscreenerData.value = {
            name: pair.baseToken?.name || "Unknown",
            symbol: pair.baseToken?.symbol || "Unknown",
            mcap: pair.marketCap || 0,
            liquidity: pair.liquidity?.usd || 0,
            volume24h: pair.volume?.h24 || 0,
            dexId: pair.dexId || "Unknown",
            imageUrl: pair.info?.imageUrl || "",
          };
        }
      }
    } catch (err) {
      console.log("DEX Screener fetch (non-critical):", err);
    }

    // Fetch Meteora Data
    try {
      const filterByQuery = `(token_x=${address}||token_y=${address})`;
      const meteoraUrl = `https://pool-discovery-api.datapi.meteora.ag/pools?page_size=50&timeframe=2h&category=top&filter_by=${encodeURIComponent(filterByQuery)}`;
      const meteoraRes = await fetch(meteoraUrl);
      if (meteoraRes.ok) {
        const meteoraJson = await meteoraRes.json();
        const pools = meteoraJson.data || meteoraJson.pools || [];
        if (pools.length > 0) {
          const item = pools[0];
          const targetToken =
            item.token_x?.address?.toLowerCase() === address.toLowerCase()
              ? item.token_x
              : item.token_y?.address?.toLowerCase() === address.toLowerCase()
                ? item.token_y
                : item.token_x;

          const createdAt =
            targetToken?.created_at || item.pool_created_at || null;
          let ageInHours = null;
          if (createdAt) {
            ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
          }

          meteoraData.value = {
            positionsCreated: item.positions_created ?? 0,
            totalLps: item.total_lps ?? 0,
            createdAt: createdAt,
            ageInHours: ageInHours,
            fees: item.fee ?? 0,
            marketcap: targetToken?.market_cap ?? 0,
            tvl: item.tvl ?? 0,
            volume: item.volume ?? 0,
          };
        }
      }
    } catch (err) {
      console.log("Meteora fetch (non-critical):", err);
    }
  } catch (error) {
    message.value = `Error: ${error.message}`;
    rugcheckData.value = null;
    tokenMeta.value = null;
    riskDetails.value = null;
    dexscreenerData.value = null;
    meteoraData.value = null;
    holderProfiles.value = null;
    holdersData.value = [];
    totalHoldersCount.value = 0;
    top10Percentage.value = 0;
    submittedAddress.value = "";
  } finally {
    isLoading.value = false;
  }
};

const getRiskLevel = (score) => {
  if (score == 1)
    return {
      level: "GOOD",
      color: "bg-green-100 text-green-800 border-green-300",
    };
  if (score > 10)
    return {
      level: "WARN",
      color: "bg-orange-100 text-orange-800 border-orange-300",
    };
  if (score > 50)
    return {
      level: "RISKY",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
  return {
    level: "HIGH RISK",
    color: "bg-red-100 text-red-800 border-red-300",
  };
};

const getRiskInsiderLevel = (count) => {
  if (count > 2000)
    return {
      level: "HIGH RISK",
      color: "text-red-600",
      cardColor: "bg-red-50 border-red-200",
      badgeColor: "bg-red-100 text-red-800 border-red-300",
      labelColor: "text-red-700",
    };
  if (count >= 700)
    return {
      level: "WARN",
      color: "text-amber-600",
      cardColor: "bg-amber-50 border-amber-200",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      labelColor: "text-amber-700",
    };
  return {
    level: "GOOD",
    color: "text-emerald-600",
    cardColor: "bg-emerald-50 border-emerald-200",
    badgeColor: "bg-green-100 text-green-800 border-green-300",
    labelColor: "text-emerald-700",
  };
};

const goBack = () => {
  router.push({ name: "list-token" });
};

const handleTokenSubmit = () => {
  const value = tokenInput.value.trim();

  if (!value) {
    message.value = "Please enter a Token address";
    return;
  }

  router.push({
    name: "screening",
    query: { token: value },
  });
};

onMounted(() => {
  tokenInput.value = token.value;
  fetchScreeningData();
});

watch(
  () => route.query.token,
  (newToken) => {
    tokenInput.value = newToken || "";
    fetchScreeningData();
  },
);
</script>

<template>
  <div class="bg-gray-100 p-3 md:p-5 min-h-screen">
    <div class="w-full max-w-[1700px] mx-auto space-y-5">
      <!-- Top Search & Navigation Bar (No outer card wrapper) -->
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
      >
        <!-- Search Form on the far left -->
        <form
          @submit.prevent="handleTokenSubmit"
          class="flex items-center gap-2 w-full sm:max-w-xl"
        >
          <div class="relative w-full">
            <input
              id="tokenAddress"
              v-model="tokenInput"
              type="text"
              placeholder="Enter token address..."
              class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-xs transition"
            />
            <svg
              class="w-4 h-4 text-gray-400 absolute left-3 top-3"
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
          <button
            type="submit"
            :disabled="isLoading"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 px-5 rounded-xl transition text-sm shadow-xs whitespace-nowrap"
          >
            {{ isLoading ? "Searching..." : "Search" }}
          </button>
        </form>

        <!-- Back to List on the far right -->
        <button
          type="button"
          @click="goBack"
          class="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 text-sm shadow-xs whitespace-nowrap"
        >
          ← Back to List
        </button>
      </div>

      <!-- Loading / Status Message Bar -->
      <div
        v-if="isLoading"
        class="bg-white rounded-xl p-4 text-center text-gray-600 font-medium flex items-center justify-center gap-2 border border-gray-200 shadow-xs"
      >
        <div
          class="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"
        ></div>
        Loading token screening...
      </div>

      <div
        v-if="message"
        :class="[
          'p-4 rounded-xl text-sm font-medium border shadow-xs',
          message.startsWith('Error')
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-green-50 text-green-800 border-green-200',
        ]"
      >
        {{ message }}
      </div>

      <!-- Token Header & TradingView Chart Combined Card -->
      <div
        v-if="tokenMeta || dexscreenerData || submittedAddress"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4"
      >
        <!-- Token Header (Image, Name & Symbol) -->
        <div class="flex items-center gap-3">
          <img
            :src="
              dexscreenerData?.imageUrl ||
              'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
            "
            :alt="tokenMeta?.name || dexscreenerData?.name"
            class="w-10 h-10 rounded-full border border-gray-200 object-cover bg-gray-100 flex-shrink-0"
            @error="
              (e) =>
                (e.target.src =
                  'https://cdn.dexscreener.com/assets/favicon.ico')
            "
          />
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-gray-900">
                {{
                  tokenMeta?.name || dexscreenerData?.name || "Unknown Token"
                }}
              </h2>
              <span
                class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md"
              >
                {{ tokenMeta?.symbol || dexscreenerData?.symbol || "N/A" }}
              </span>
            </div>
            <p class="text-xs text-gray-400 font-mono mt-0.5 break-all">
              {{ submittedAddress }}
            </p>
          </div>
        </div>

        <!-- Chart Header & Platform Selector -->
        <div v-if="submittedAddress" class="space-y-3 pt-2 border-t border-gray-100">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <!-- Embeddable Chart Tabs -->
            <div class="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                v-for="platform in chartPlatforms"
                :key="platform.id"
                @click="selectedChart = platform.id"
                :class="[
                  'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  selectedChart === platform.id
                    ? 'bg-white text-gray-900 shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60',
                ]"
              >
                <span>{{ platform.name }}</span>
              </button>
            </div>

            <!-- Open in Active Embed Chart -->
            <a
              :href="currentChartExternalUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              Open in
              {{ chartPlatforms.find((p) => p.id === selectedChart)?.name }}
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          <!-- Embedded Chart Container (DexScreener / GMGN / GeckoTerminal) -->
          <div
            class="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative"
          >
            <iframe
              :key="`${selectedChart}-${submittedAddress}`"
              :src="currentChartEmbedUrl"
              style="width: 100%; height: 530px; border: none"
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>

      <!-- Token Analytics Card (Market Cap, Liquidity, 24h Volume, DEX) -->
      <div
        v-if="dexscreenerData"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Token Analytics
        </h2>

        <!-- Metrics Grid (Market Cap, Liquidity, 24h Volume, DEX) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Market Cap
            </p>
            <p
              :class="[
                'text-sm font-semibold mt-0.5',
                (dexscreenerData?.mcap || 0) >= 250000
                  ? 'text-emerald-600 font-bold'
                  : 'text-gray-900',
              ]"
            >
              {{
                dexscreenerData?.mcap
                  ? "$" +
                    dexscreenerData.mcap.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })
                  : "N/A"
              }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Liquidity
            </p>
            <p class="text-sm font-semibold text-gray-900 mt-0.5">
              {{
                dexscreenerData?.liquidity
                  ? "$" +
                    dexscreenerData.liquidity.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })
                  : "N/A"
              }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              24h Volume
            </p>
            <p
              :class="[
                'text-sm font-semibold mt-0.5',
                (dexscreenerData?.volume24h || 0) >= 1000000
                  ? 'text-emerald-600 font-bold'
                  : 'text-gray-900',
              ]"
            >
              {{
                dexscreenerData?.volume24h
                  ? "$" +
                    dexscreenerData.volume24h.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })
                  : "N/A"
              }}
            </p>
          </div>

          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              DEX
            </p>
            <p class="text-sm font-semibold text-purple-600 mt-0.5 uppercase">
              {{ dexscreenerData?.dexId || "N/A" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Holder Profile Card -->
      <div
        v-if="formattedHolderProfiles.length || submittedAddress"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg
              class="w-5 h-5 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Holder profile
          </h2>
          <span
            class="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full"
          >
            Tag & Distribution
          </span>
        </div>

        <!-- Metrics Grid (bundler, sniper, insider, dev, smart trader) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            v-for="tg in formattedHolderProfiles"
            :key="tg.tag"
            class="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between hover:border-gray-200 transition"
          >
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <p
                  class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {{ tg.label }}
                </p>
                <span
                  :class="[
                    'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                    tg.color === 'amber'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : tg.color === 'purple'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : tg.color === 'red'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : tg.color === 'blue'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                  ]"
                >
                  Tag
                </span>
              </div>
              <p
                v-if="tg.tag === 'bundler'"
                class="text-base font-bold text-gray-900 mt-1"
              >
                {{ tg.holder_count.toLocaleString("en-US") }}
                <span class="text-xs font-normal text-gray-500">holders</span>
              </p>
              <p
                v-else-if="tg.tag === 'sniper'"
                class="text-base font-bold text-gray-900 mt-1"
              >
                {{ tg.holder_count.toLocaleString("en-US") }}
                <span class="text-xs font-normal text-gray-500">holders</span>
              </p>
              <p
                v-else-if="tg.tag === 'insider'"
                class="text-base font-bold text-gray-900 mt-1"
              >
                {{ tg.holder_count.toLocaleString("en-US") }}
                <span class="text-xs font-normal text-gray-500">holders</span>
              </p>
              <p
                v-else-if="tg.tag === 'dev'"
                class="text-base font-bold text-gray-900 mt-1"
              >
                {{ tg.holder_count.toLocaleString("en-US") }}
                <span class="text-xs font-normal text-gray-500">holders</span>
              </p>
              <p
                v-else-if="tg.tag === 'smart_trader'"
                class="text-base font-bold text-gray-900 mt-1"
              >
                {{ tg.holder_count.toLocaleString("en-US") }}
                <span class="text-xs font-normal text-gray-500">holders</span>
              </p>
            </div>

            <!-- Holding Percentage & Progress Bar -->
            <div class="mt-3 pt-2.5 border-t border-gray-200/70 space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 font-medium">Holding Share</span>
                <span class="font-bold text-gray-800">{{ tg.percentage }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  :class="[
                    'h-1.5 rounded-full transition-all duration-500',
                    tg.color === 'amber'
                      ? 'bg-amber-500'
                      : tg.color === 'purple'
                        ? 'bg-purple-500'
                        : tg.color === 'red'
                          ? 'bg-red-500'
                          : tg.color === 'blue'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500',
                  ]"
                  :style="{ width: Math.min(tg.percentage || 0, 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Meteora Data Card -->
      <div
        v-if="meteoraData"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-cyan-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Meteora data
        </h2>

        <!-- Metrics Grid (Position Created, Total LPs, Token Age, Fees, Marketcap, TVL, Volume) -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <!-- Position Created -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              meteoraData.positionsCreated < 50
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                meteoraData.positionsCreated < 50
                  ? 'text-red-600'
                  : 'text-emerald-600',
              ]"
            >
              Position Created
            </p>
            <p class="text-sm font-bold mt-0.5">
              {{ meteoraData.positionsCreated.toLocaleString("en-US") }}
            </p>
          </div>

          <!-- Total LPs -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              meteoraData.totalLps < 50
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                meteoraData.totalLps < 50 ? 'text-red-600' : 'text-emerald-600',
              ]"
            >
              Total LPs
            </p>
            <p class="text-sm font-bold mt-0.5">
              {{ meteoraData.totalLps.toLocaleString("en-US") }}
            </p>
          </div>

          <!-- Token Age -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              meteoraData.ageInHours === null || meteoraData.ageInHours < 10
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                meteoraData.ageInHours === null || meteoraData.ageInHours < 10
                  ? 'text-red-600'
                  : 'text-emerald-600',
              ]"
            >
              Token Age
            </p>
            <p class="text-sm font-bold mt-0.5">
              {{ formatAge(meteoraData.createdAt) }}
            </p>
          </div>

          <!-- Fees -->
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Fees
            </p>
            <p class="text-sm font-bold text-gray-900 mt-0.5">
              {{ formatCurrency(meteoraData.fees) }}
            </p>
          </div>

          <!-- Marketcap -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              meteoraData.marketcap < 250000
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                meteoraData.marketcap < 250000
                  ? 'text-red-600'
                  : 'text-emerald-600',
              ]"
            >
              Market Cap
            </p>
            <p class="text-sm font-bold mt-0.5">
              {{ formatCurrency(meteoraData.marketcap) }}
            </p>
          </div>

          <!-- TVL -->
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              TVL
            </p>
            <p class="text-sm font-bold text-gray-900 mt-0.5">
              {{ formatCurrency(meteoraData.tvl) }}
            </p>
          </div>

          <!-- Volume -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              meteoraData.volume < 1000
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700',
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                meteoraData.volume < 1000 ? 'text-red-600' : 'text-emerald-600',
              ]"
            >
              Volume
            </p>
            <p class="text-sm font-bold mt-0.5">
              {{ formatCurrency(meteoraData.volume) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Rugcheck Data Card -->
      <div
        v-if="rugcheckData"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-lg font-bold text-gray-900">Rugcheck Data</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <!-- Combined Score & Risk Status Card -->
          <div
            :class="[
              'p-3.5 rounded-xl border flex flex-col justify-between',
              getRiskLevel(rugcheckData.score).color,
            ]"
          >
            <div>
              <p
                class="text-[11px] font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Score & Risk Status
              </p>
              <div class="flex items-baseline justify-between mt-0.5">
                <div>
                  <span class="text-2xl font-bold">{{
                    rugcheckData.score
                  }}</span>
                  <span class="text-xs text-gray-500 ml-1">/ 100</span>
                </div>
                <span class="text-base font-bold">
                  {{ getRiskLevel(rugcheckData.score).level }}
                </span>
              </div>
            </div>
          </div>

          <!-- Risk List on the Right -->
          <div>
            <div v-if="rugcheckData.risk && rugcheckData.risk.length > 0">
              <h3 class="text-xs font-bold text-gray-700 mb-2">
                Detected Risks:
              </h3>
              <ul class="space-y-1.5">
                <li
                  v-for="(risk, index) in rugcheckData.risk"
                  :key="index"
                  class="flex items-start text-xs text-gray-700 bg-red-50/50 p-2 rounded-lg border border-red-100"
                >
                  <svg
                    class="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>{{
                    typeof risk === "string"
                      ? risk
                      : risk.name || "Unknown risk"
                  }}</span>
                </li>
              </ul>
            </div>
            <div
              v-else
              class="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold"
            >
              ✓ No risks detected
            </div>
          </div>
        </div>
      </div>

      <!-- Extend Analytics Card (Placed above Token Holders) -->
      <div
        v-if="submittedAddress"
        class="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
      >
        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Holder Analytics
        </h2>

        <!-- Metrics Grid (Count Bundled, Top 10 Supply Share, Total Holders) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Count Insiders -->
          <div
            :class="[
              'p-3 rounded-xl border transition-colors',
              getRiskInsiderLevel(insiderWalletsCount).cardColor,
            ]"
          >
            <p
              :class="[
                'text-[11px] font-semibold uppercase tracking-wider',
                getRiskInsiderLevel(insiderWalletsCount).labelColor,
              ]"
            >
              Total Insiders
            </p>
            <div class="flex items-center justify-between mt-0.5">
              <p
                :class="[
                  'text-base font-bold',
                  getRiskInsiderLevel(insiderWalletsCount).color,
                ]"
              >
                {{ insiderWalletsCount }}
              </p>
            </div>
          </div>

          <!-- Top 10 Supply Share -->
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Top 10 Supply Share
            </p>
            <p
              :class="[
                'text-base font-bold mt-0.5',
                top10Percentage > 60
                  ? 'text-red-600'
                  : top10Percentage > 30
                    ? 'text-amber-600'
                    : 'text-emerald-600',
              ]"
            >
              {{ top10Percentage }}%
            </p>
          </div>

          <!-- Total Holders Count -->
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p
              class="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Total Holders
            </p>
            <p class="text-base font-bold text-gray-900 mt-0.5">
              {{
                totalHoldersCount
                  ? totalHoldersCount.toLocaleString("en-US")
                  : "0"
              }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
