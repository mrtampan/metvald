import fs from "node:fs";
import path from "node:path";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  try {
    const loadWallets = (fileName, defaultSource) => {
      const filePath = path.join(process.cwd(), "smartwallet", fileName);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            source: item.source || defaultSource,
          }));
        }
      } catch (err) {
        console.error(`Failed to load ${fileName}:`, err);
      }
      return [];
    };

    const formattedMetvald = loadWallets("data.json", "metvald");
    const formattedMeteoraidn = loadWallets("meteoraidn.json", "meteoraidn-discord");
    const formattedUwuuai = loadWallets("uwuuai.json", "uwuuai");
    const formattedGmgn = loadWallets("gmgndata.json", "gmgn");

    const wallets = [
      ...formattedMetvald,
      ...formattedMeteoraidn,
      ...formattedUwuuai,
      ...formattedGmgn,
    ];

    const token = req.query.token || req.query.address || "";
    let holders = [];

    if (token && token.trim()) {
      const tokenAddress = token.trim();
      const uniqueAddresses = [
        ...new Set(wallets.map((w) => w.address).filter(Boolean)),
      ];

      if (uniqueAddresses.length > 0) {
        const CHUNK_SIZE = 50;
        const chunks = [];
        for (let i = 0; i < uniqueAddresses.length; i += CHUNK_SIZE) {
          chunks.push(uniqueAddresses.slice(i, i + CHUNK_SIZE).join(","));
        }

        const results = await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const jupRes = await fetch(
                `https://datapi.jup.ag/v1/holders/${tokenAddress}?addresses=${chunk}`,
              );
              if (jupRes.ok) {
                const json = await jupRes.json();
                return json.holders || [];
              }
            } catch (err) {
              console.error("Error fetching chunk from Jupiter API:", err);
            }
            return [];
          }),
        );
        holders = results.flat();
      }
    }

    return res.status(200).json({
      success: true,
      totalWallets: wallets.length,
      totalHolders: holders.length,
      data: wallets,
      wallets,
      holders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process smart wallet request",
    });
  }
}
