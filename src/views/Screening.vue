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
const submittedAddress = ref("");

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
  } catch (error) {
    message.value = `Error: ${error.message}`;
    rugcheckData.value = null;
    tokenMeta.value = null;
    riskDetails.value = null;
    dexscreenerData.value = null;
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

        <!-- TradingView Chart iFrame -->
        <div
          v-if="submittedAddress"
          class="rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
        >
          <iframe
            :src="`https://dexscreener.com/solana/${submittedAddress}?embed=1&theme=light&trades=0&info=0`"
            style="width: 100%; height: 520px; border: none"
            allowfullscreen
          ></iframe>
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

      <!-- BubbleMaps Data Card -->
      <div
        v-if="submittedAddress"
        class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
      >
        <h2 class="text-xl font-bold text-gray-900 mb-4">BubbleMaps Data</h2>
        <div class="rounded-xl overflow-hidden border border-gray-200">
          <iframe
            :src="`https://v2.bubblemaps.io/map?address=${submittedAddress}&chain=solana`"
            style="width: 100%; height: 650px; border: none"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
