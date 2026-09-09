let cachedWalletsList = null;

export async function getSmartWallets(tokenAddress = "") {
  try {
    const url = tokenAddress
      ? `/api/smartwallet?token=${encodeURIComponent(tokenAddress)}`
      : "/api/smartwallet";

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API status: ${res.status}`);
    }

    const json = await res.json();
    if (json && json.success) {
      const wallets = json.wallets || json.data || [];
      const holders = json.holders || [];
      cachedWalletsList = wallets;
      return { wallets, holders };
    }

    throw new Error(json?.error || "Invalid response format");
  } catch (err) {
    console.error("Error fetching smart wallets from Vercel API:", err);
    return { wallets: cachedWalletsList || [], holders: [] };
  }
}

export default getSmartWallets;