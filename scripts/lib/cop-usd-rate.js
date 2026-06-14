require("dotenv").config();

const DEFAULT_API_URL = "https://open.er-api.com/v6/latest/USD";

function readEnvFallback() {
  const raw = process.env.COP_PER_USD;
  if (raw == null || raw === "") return null;
  try {
    const n = BigInt(raw.split(".")[0] ?? raw);
    return n > 0n ? n : null;
  } catch {
    return null;
  }
}

/** Fetch live COP per 1 USD; falls back to COP_PER_USD env. */
async function fetchCopPerUsd() {
  const url = process.env.EXCHANGE_RATE_API_URL ?? DEFAULT_API_URL;

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const cop = data.rates?.COP ?? data.conversion_rates?.COP;

    if (cop == null || !Number.isFinite(cop) || cop <= 0) {
      throw new Error("COP rate missing");
    }

    const rate = BigInt(Math.round(cop));
    console.log(`  Live COP/USD: ${rate.toString()} (${url})`);
    return rate;
  } catch (error) {
    const fallback = readEnvFallback();
    if (fallback) {
      console.warn("  FX fetch failed, using COP_PER_USD env:", error.message);
      return fallback;
    }
    throw error;
  }
}

module.exports = { fetchCopPerUsd };
