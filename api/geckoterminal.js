import https from "node:https";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const pool = req.query?.pool || req.query?.address || "";
    if (!pool || !pool.trim()) {
      return res.status(400).json({
        success: false,
        error: "Pool address is required. Use ?pool=<address>",
      });
    }

    const poolAddress = encodeURIComponent(pool.trim());
    const targetPath = `/api/p1/solana/pools/${poolAddress}?include=dex%2Cdex.network.explorers%2Cdex_link_services%2Cnetwork_link_services%2Cpairs%2Ctoken_link_services%2Ctag_link_services%2Ctokens.token_security_metric%2Ctokens.token_developer_detail%2Ctokens.tags%2Cpool_locked_liquidities%2Claunchpad_dex&base_token=0`;

    const gtReq = https.request(
      `https://app.geckoterminal.com${targetPath}`,
      {
        method: "GET",
        headers: {
          Host: "app.geckoterminal.com",
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          Origin: "https://www.geckoterminal.com",
          Referer: "https://www.geckoterminal.com/",
          "Accept-Language": "en-US,en;q=0.9",
        },
      },
      (gtRes) => {
        let body = "";
        gtRes.on("data", (chunk) => {
          body += chunk;
        });
        gtRes.on("end", () => {
          try {
            const json = JSON.parse(body);
            return res.status(gtRes.statusCode || 200).json(json);
          } catch (e) {
            return res.status(gtRes.statusCode || 500).send(body);
          }
        });
      }
    );

    gtReq.on("error", (err) => {
      console.error("GeckoTerminal request error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to fetch GeckoTerminal data",
      });
    });

    gtReq.end();
  } catch (error) {
    console.error("GeckoTerminal API handler error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
