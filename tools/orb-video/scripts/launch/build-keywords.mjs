// build-keywords.mjs — transform a DataForSEO volume dump (from the
// mass-translate-backend get_keyword_volumes MCP tool) into out/launch/keywords.json
// in the shape gen-launch-package.mjs consumes:
//   { "<slug>": { "_base":[{keyword,volume}], "5min":[...], ... }, ... }
//
// Usage: node scripts/launch/build-keywords.mjs <raw-tool-result.json>
// The raw file is the MCP tool result: [{ "type":"text", "text":"<json string>" }]
// whose inner JSON is { data: { keywords: [{ keyword, search_volume }] } }.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../../out/launch/keywords.json");
const raw = process.argv[2];
if (!raw) { console.error("usage: build-keywords.mjs <raw-tool-result.json>"); process.exit(1); }

const outer = JSON.parse(fs.readFileSync(raw, "utf8"));
const text = Array.isArray(outer) ? outer.find((p) => p.type === "text").text : JSON.stringify(outer);
const parsed = JSON.parse(text);
const kws = parsed.data.keywords;

function slugOf(k) {
  if (/box breathing|square breathing/.test(k)) return "box";
  if (/coherent breathing|resonance breathing|5\.5 breathing/.test(k)) return "coherent";
  if (/4-7-8|478 breathing|4 7 8 breathing/.test(k)) return "4-7-8";
  if (/physiological sigh|double inhale|cyclic sighing/.test(k)) return "physiological-sigh";
  if (/belly breathing|diaphragmatic|abdominal|deep belly/.test(k)) return "belly";
  return null;
}
function bucketOf(k) {
  if (/1 minute/.test(k)) return "1min";
  if (/2 minutes/.test(k)) return "2min";
  if (/5 minutes/.test(k)) return "5min";
  if (/10 minutes/.test(k)) return "10min";
  if (/30 seconds/.test(k)) return "30s";
  if (/60 seconds/.test(k)) return "60s";
  return "_base";
}

const result = {};
for (const { keyword, search_volume } of kws) {
  const slug = slugOf(keyword);
  if (!slug) continue;
  const bucket = bucketOf(keyword);
  result[slug] ||= {};
  result[slug][bucket] ||= [];
  result[slug][bucket].push({ keyword, volume: search_volume || 0 });
}
for (const slug of Object.keys(result))
  for (const b of Object.keys(result[slug]))
    result[slug][b].sort((a, c) => c.volume - a.volume);

fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
const total = kws.length;
console.log(`Wrote ${OUT}: ${Object.keys(result).length} techniques, ${total} keywords.`);
for (const slug of Object.keys(result)) {
  const base = (result[slug]._base || [])[0];
  console.log(`  ${slug}: top base "${base?.keyword}" vol=${base?.volume}`);
}
