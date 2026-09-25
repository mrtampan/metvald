import https from "node:https";

export default function handler(req, res) {
  // CORS Headers agar bisa diakses dari browser tanpa kendala
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Ambil token dari Authorization header, body, atau query
    let rawToken =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.body?.token ||
      req.query?.token ||
      "";

    if (!rawToken || !rawToken.trim()) {
      return res.status(400).json({
        success: false,
        error: "Bearer token diperlukan. Harap sertakan Authorization header.",
      });
    }

    let token = rawToken.trim();
    if (!token.toLowerCase().startsWith("bearer ")) {
      token = `Bearer ${token}`;
    }

    // Panggil Fomo Family API menggunakan https.request native Node.js
    const fomoReq = https.request(
      "https://prod-api.fomo.family/proxy/trendingTokens",
      {
        method: "POST",
        headers: {
          Host: "prod-api.fomo.family",
          Accept: "*/*",
          Authorization: token,
          "Content-Type": "application/json",
          Origin: "https://fomo.family",
          Referer: "https://fomo.family/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
      },
      (fomoRes) => {
        let body = "";
        fomoRes.on("data", (chunk) => {
          body += chunk;
        });
        fomoRes.on("end", () => {
          try {
            const json = JSON.parse(body);
            return res.status(fomoRes.statusCode || 200).json(json);
          } catch (e) {
            return res.status(fomoRes.statusCode || 500).send(body);
          }
        });
      }
    );

    fomoReq.on("error", (err) => {
      console.error("Fomo request error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Gagal menghubungi API Fomo Family.",
      });
    });

    fomoReq.end();
  } catch (error) {
    console.error("API trendingTokens error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Gagal memproses request trending tokens.",
    });
  }
}
