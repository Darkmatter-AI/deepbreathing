import { delayRender, continueRender } from "remotion";
import { INTER_700, INTER_400 } from "./font-data";

// Inter embedded as base64 data URIs -> no network fetch at render time, so
// FontFace.load() resolves instantly and can never hang a render tab.
export const fontFamily = "InterLocal";

if (typeof window !== "undefined" && typeof FontFace !== "undefined") {
  const handle = delayRender("loading Inter");
  const bold = new FontFace(fontFamily, `url(${INTER_700}) format('woff2')`, { weight: "700" });
  const reg = new FontFace(fontFamily, `url(${INTER_400}) format('woff2')`, { weight: "400" });
  Promise.all([bold.load(), reg.load()])
    .then(([b, r]) => { document.fonts.add(b); document.fonts.add(r); continueRender(handle); })
    .catch(() => continueRender(handle));
}
