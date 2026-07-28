// Generates public/en-card-prices.json from the TCGdex API for the English
// curated vendor cards. Run with: node scripts/gen-en-prices.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, "..", "public");

// English curated vendor card ids (use originalId when present).
// Japanese entries are intentionally excluded (priced via ja-card-prices.json).
const EN_IDS = [
  // vintageEng
  "base1-4", "base1-2", "neo1-9", "neo4-107", "base1-15", "base1-1", "fo1-5", "fo1-4",
  "pr-1", "base1-10", "fo1-15", "tr1-4", "tr1-5", "tr1-83", "gh1-14", "gh1-1", "gc1-4",
  "neo1-17", "neo1-12", "neo4-109", "neo4-106",
  // modernAlt
  "evs-215", "lor-186", "evs-218", "sit-186", "brs-154", "evs-212", "fst-271", "pgo-72",
  "fst-270", "evs-205", "evs-192", "lor-180", "obf-223", "meo-205",
  // tagTeams
  "sm9-170", "sm9-165", "sm9-161", "sm10-214", "sm11-222", "sm12-221", "sm12-216", "sm12-215",
  // goldStarsEx
  "ex8-107", "ex13-100", "ex15-101", "ex13-104", "ex7-108", "ex10-105", "xy8-164", "ex8-105", "ulp-151",
  // rawBinderSingles (English only)
  "sv2-203", "sv3pt5-168", "sv3pt5-170", "sv3pt5-166", "sv3pt5-181", "sv3-225",
  "sv3pt5-205", "sv3pt5-202", "sv3pt5-201", "sv3pt5-203", "sv3-223",
  "swsh5-155", "swsh5-146", "swsh7-192", "swsh7-196", "swsh7-175", "swsh8-245", "swsh3-20",
  "base1-63", "base1-46", "ju1-10", "fo1-6",
];

function toTcgdexId(scrydexId) {
  const idx = scrydexId.lastIndexOf("-");
  let set = scrydexId.slice(0, idx);
  const num = scrydexId.slice(idx + 1);
  const map = {
    evs: "swsh7", lor: "swsh11", sit: "swsh12", brs: "swsh9", fst: "swsh8",
    meo: "sv03.5", sv3pt5: "sv03.5", sv2: "sv02", sv3: "sv03", obf: "sv03",
    tr1: "base5", gh1: "gym1", gc1: "gym2", fo1: "base3", ju1: "base2",
  };
  if (map[set]) set = map[set];
  else if (/^sv\d+$/.test(set)) set = "sv0" + set.slice(2);
  else if (/^sv(\d+)pt5$/.test(set)) set = "sv0" + set.match(/^sv(\d+)pt5$/)[1] + ".5";
  return `${set}-${num}`;
}

function extractPrice(c) {
  const tp = c.tcgplayer || c.pricing?.tcgplayer;
  const cm = c.cardmarket || c.pricing?.cardmarket;
  const p =
    tp?.normal?.marketPrice ?? tp?.holofoil?.marketPrice ??
    tp?.reverseHolofoil?.marketPrice ?? cm?.trend ?? cm?.avg ?? cm?.avg30;
  return typeof p === "number" ? Number(p.toFixed(2)) : null;
}

async function fetchPrice(scrydexId) {
  const tcgId = toTcgdexId(scrydexId);
  for (const id of [tcgId, scrydexId]) {
    try {
      const r = await fetch(`https://api.tcgdex.net/v2/en/cards/${id}`);
      if (!r.ok) continue;
      const c = await r.json();
      const p = extractPrice(c);
      if (p != null) return { tcgId, price: p };
    } catch (e) { /* ignore */ }
  }
  return null;
}

(async () => {
  const out = {};
  let ok = 0, fail = 0;
  for (const id of EN_IDS) {
    const res = await fetchPrice(id);
    if (res) {
      out[id] = res.price;
      out[res.tcgId] = res.price;
      ok++;
      console.log(`OK  ${id} -> ${res.tcgId} = $${res.price}`);
    } else {
      fail++;
      console.log(`FAIL ${id}`);
    }
  }
  fs.writeFileSync(path.join(PUBLIC, "en-card-prices.json"), JSON.stringify(out, null, 0));
  console.log(`\nWrote en-card-prices.json: ${ok} OK, ${fail} failed (fallback to existing price).`);
})();
