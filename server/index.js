import express from "express";
import fs from "fs";
import { searchOffers } from "./vast.js";
import { scoreOffer } from "./score.js";

const PORT = process.env.PORT || 3000;
const STATE_FILE = "./state.json";

const app = express();
let state = { updated_at: null, unicorns: [] };

// Load previous state if present
if (fs.existsSync(STATE_FILE)) {
  state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

async function pollVast() {
  try {
    const data = await searchOffers();
    // console.log("RAW VAST RESPONSE:", Object.keys(data));1

    const offers = Array.isArray(data?.offers) ? data.offers : (data?.offers ? [data.offers] : []);


    const scored = offers.map(o => ({
      offer_id: o.id ?? o.ask_contract_id ?? o.contract_id,
      gpu: o.gpu_name,
      dph: o.dph_total ?? o.dph ?? o.dph_base,
      vram: o.gpu_ram,
      reliability: o.reliability,
      location: o.datacenter || o.country || "unknown",
      score: Number(scoreOffer({
        reliability: o.reliability,
        dph: o.dph_total ?? o.dph ?? 999,
        gpu_ram: o.gpu_ram
      }).toFixed(2))
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 20);

    const previousIds = new Set(state.unicorns.map(u => u.offer_id));
    top.forEach(u => (u.is_new = !previousIds.has(u.offer_id)));

    state = {
      updated_at: new Date().toISOString(),
      unicorns: top
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`[poll] updated ${top.length} unicorns`);
  } catch (err) {
    console.error("[poll] error:", err.message);
  }
}

// Initial + interval poll
pollVast();
setInterval(pollVast, 60_000);

// API endpoint for Framer
app.get("/api/unicorns", (_, res) => {
  res.json(state);
});

app.listen(PORT, () =>
  console.log(`🦄 Unicorn Finder running on :${PORT}`)
);

