import fetch from "node-fetch";

export async function searchOffers() {
  const url = "https://console.vast.ai/api/v0/bundles/";

  const body = {
    limit: 200,
    type: "on-demand",
    rentable: { eq: true },
    rented: { eq: false },

    // Unicorn defaults
    gpu_name: { in: ["RTX_4090", "RTX 4090"] }, // keep both, Vast naming can vary
    num_gpus: { eq: 1 },
    reliability: { gte: 0.98 },
    // Vast uses dph_total in the bundles search response (see docs sample fields)
    dph_total: { lte: 0.55 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAST_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const ct = res.headers.get("content-type") || "";

  if (!res.ok) {
    throw new Error(`Vast error ${res.status}: ${text.slice(0, 400)}`);
  }
  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON, got ${ct}: ${text.slice(0, 200)}`);
  }

  return JSON.parse(text);
}

