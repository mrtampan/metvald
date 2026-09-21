<script setup>
import { computed } from "vue";
import { Clock, Trash2 } from "@lucide/vue";
import { useRouter } from "vue-router";
import { useScreeningStore } from "../stores/screeningStore";
import { storeToRefs } from "pinia";

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "Screening History",
  },
});

const emit = defineEmits(["clear", "select"]);

const router = useRouter();
const screeningStore = useScreeningStore();
const { screeningHistory: storeHistory } = storeToRefs(screeningStore);

// Use props if provided, otherwise fallback to Pinia store
const displayList = computed(() => {
  if (props.history && props.history.length > 0) {
    return props.history;
  }
  return storeHistory.value || [];
});

const defaultIcon =
  "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";

const handleImageError = (event) => {
  event.target.src = defaultIcon;
};

const truncateAddress = (addr) => {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
};

const onClear = () => {
  emit("clear");
};

const onSelectItem = (item, event) => {
  emit("select", item);
  // If no custom navigation prevent, router push to screening page
  if (router && item?.address) {
    event.preventDefault();
    router.push({ path: "/screening", query: { token: item.address } });
  }
};
</script>

<template>
  <div
    v-if="displayList && displayList.length > 0"
    class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-blue-600" />
        <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {{ title }}
        </span>
        <span
          class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full"
        >
          {{ displayList.length }}
        </span>
      </div>
      <button
        type="button"
        @click="onClear"
        class="text-[11px] text-gray-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1 font-medium"
        title="Clear screening history"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Clear History
      </button>
    </div>

    <!-- Horizontal Scroll Container Item History -->
    <div class="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
      <a
        v-for="item in displayList"
        :key="item.address"
        :href="`/screening?token=${item.address}`"
        @click="onSelectItem(item, $event)"
        class="flex items-center gap-2.5 px-3 py-2 bg-gray-50 hover:bg-blue-50/80 border border-gray-200 hover:border-blue-300 rounded-xl transition flex-shrink-0 group shadow-2xs cursor-pointer"
        :title="`Screening ${item.name || 'Token'} (${item.address})`"
      >
        <!-- 1. Gambar Logo Token -->
        <img
          :src="item.icon || defaultIcon"
          :alt="item.name || 'Token'"
          class="w-6 h-6 rounded-full object-cover bg-gray-200 ring-1 ring-black/5 flex-shrink-0"
          @error="handleImageError"
        />

        <div class="flex flex-col text-left">
          <!-- 2. Nama Token -->
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
</template>