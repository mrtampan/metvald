import { defineStore } from "pinia";
import { ref } from "vue";

export const useScreeningStore = defineStore("screening", () => {
  const screeningHistory = ref([]);

  // Load history dari sessionStorage
  const loadScreeningHistory = () => {
    try {
      const raw = sessionStorage.getItem("metvald_screening_history");
      if (raw) {
        screeningHistory.value = JSON.parse(raw);
      } else {
        screeningHistory.value = [];
      }
    } catch (e) {
      console.error("Gagal membaca history screening dari sessionStorage:", e);
      screeningHistory.value = [];
    }
  };

  // Record / simpan token ke history
  const recordScreeningHistory = (tokenObj) => {
    if (!tokenObj || !tokenObj.address) return;
    try {
      const raw = sessionStorage.getItem("metvald_screening_history");
      let list = raw ? JSON.parse(raw) : [];

      // Filter token duplikat berdasarkan address
      list = list.filter(
        (item) =>
          item.address?.toLowerCase() !== tokenObj.address.toLowerCase(),
      );

      // Sisipkan item baru di depan list
      list.unshift({
        address: tokenObj.address,
        name: tokenObj.name || tokenObj.symbol || "Unknown",
        icon:
          tokenObj.icon ||
          tokenObj.image ||
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      });

      // Batasi maksimal 20 item
      if (list.length > 20) {
        list = list.slice(0, 20);
      }

      sessionStorage.setItem(
        "metvald_screening_history",
        JSON.stringify(list),
      );
      screeningHistory.value = list;
    } catch (e) {
      console.error("Gagal menyimpan history screening:", e);
    }
  };

  // Hapus semua history screening
  const clearScreeningHistory = () => {
    try {
      sessionStorage.removeItem("metvald_screening_history");
    } catch (e) {
      console.error("Gagal menghapus history screening:", e);
    }
    screeningHistory.value = [];
  };

  // Helper untuk record pool dari TokenList
  const recordPoolScreening = (pool, getBaseTokenFn) => {
    if (!pool) return;
    const baseToken = getBaseTokenFn ? getBaseTokenFn(pool) : (pool.token_x || pool.token_y || {});
    const address = baseToken?.address || pool.pool_address;
    if (!address) return;
    const name = baseToken?.symbol || baseToken?.name || pool.name || "Unknown";
    const icon = baseToken?.icon || pool.token_x?.icon || pool.token_y?.icon;
    recordScreeningHistory({ address, name, icon });
  };

  return {
    screeningHistory,
    loadScreeningHistory,
    recordScreeningHistory,
    clearScreeningHistory,
    recordPoolScreening,
  };
});
