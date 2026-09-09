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
    const dataPath = path.join(process.cwd(), "smartwallet", "data.json");
    const meteoraDataPath = path.join(
      process.cwd(),
      "smartwallet",
      "meteoraidn.json",
    );

    const metvaldRaw = fs.readFileSync(dataPath, "utf8");
    const meteoraidnRaw = fs.readFileSync(meteoraDataPath, "utf8");

    const metvaldData = JSON.parse(metvaldRaw);
    const meteoraidnData = JSON.parse(meteoraidnRaw);

    const formattedMetvald = metvaldData.map((item) => ({
      ...item,
      source: "metvald",
    }));

    const formattedMeteoraidn = meteoraidnData.map((item) => ({
      ...item,
      source: "meteoraidn-discord",
    }));

    const wallets = [...formattedMetvald, ...formattedMeteoraidn];

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
