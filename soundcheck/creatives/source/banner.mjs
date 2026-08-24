// banner.mjs — the soundcheck banner: the profile poster-wall, at banner shape.
//
// Every value is COPIED from the shipped web header (.pfh-poster in index.html),
// not approximated:
//   .pfh-wall   8 equal columns of seen-artist photos, opacity .16, saturate(.85)
//   .pfh-veil   linear-gradient(180deg, rgba(22,16,42,.28), .62 at 55%, .88)
//   CRT         linear-gradient(rgba(255,154,61,.025) 1px, transparent 1px) / 100% 8px
//               — the app's global body::before overlay, 1px in every 8
//   surface     #211840   border #2A2050
//
// The sunset bar along the bottom is the one addition: a banner has no app around
// it, so it needs its own edge or it dissolves into whatever sits below it.
import { createRequire } from "module";
import { mkdir, writeFile } from "node:fs/promises";
const req = createRequire("/Users/surendrachaplot/gitrepo/soundcheck-api/");

// BRAND FONTS FIRST, BEFORE sharp IS EVEN REQUIRED.
//
// librsvg initialises fontconfig the first time sharp loads, and it reads
// FONTCONFIG_FILE exactly once at that moment. card.js says so in a comment
// right above ensureFonts — "MUST run before sharp/librsvg first initializes
// fontconfig" — and I called it from main() anyway, after the require at the top
// of this file. So the whole banner rendered in a system sans and looked almost
// right, which is the worst way for this to fail.
//
// Hence the require order here, and hence the assertion at the bottom of this
// file: the check is that Bricolage MEASURES differently from the fallback, not
// that it looks fine.
const { ensureFonts } = await import("/Users/surendrachaplot/gitrepo/soundcheck-api/card.js");
ensureFonts();

const sharp = req("sharp");
const qr = req("qrcode");
const OUT = process.argv[2] || ".";

const PHOTOS = [
  "https://static.ra.co/images/profiles/square/theillustriousblacks.jpg",
  "https://static.ra.co/images/profiles/prunk.jpg",
  "https://static.ra.co/images/profiles/square/kuko-de.jpg",
  "https://static.ra.co/images/profiles/square/gerardoniva.jpg",
  "https://static.ra.co/images/profiles/square/blackcoffee.jpg",
  "https://static.ra.co/images/profiles/square/dusky.jpg",
  "https://static.ra.co/images/profiles/square/chrisstussy.jpg",
  "https://static.ra.co/images/profiles/square/ihatemodels.jpg",
];

// The QR, cream modules on nothing, exactly as card.js draws it. Cream and not
// white: #FDF3EC is the app's ink, and a pure-white QR on this ground reads as a
// borrowed asset rather than part of the brand.
async function qrMarkup(size, x, y) {
  const svg = await qr.toString("https://soundcheck.club", {
    type: "svg", errorCorrectionLevel: "M", margin: 0,
    color: { dark: "#FDF3ECff", light: "#00000000" },
  });
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  const scale = size / (vb ? Number(vb[1]) : 33);
  return `<g transform="translate(${x}, ${y}) scale(${scale})">${inner}</g>`;
}

export async function banner(W, H) {
  const cols = PHOTOS.length;
  const colW = Math.ceil(W / cols);

  // The wall, built as a real image strip rather than 8 SVG <image> tags: sharp
  // composites once and the saturation filter applies per photo the way the CSS
  // filter does.
  const cells = [];
  for (let i = 0; i < cols; i++) {
    try {
      const r = await fetch(PHOTOS[i], { signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue;
      const buf = await sharp(Buffer.from(await r.arrayBuffer()))
        .resize(colW, H, { fit: "cover" })
        .modulate({ saturation: 0.85 })          // filter: saturate(.85)
        .toBuffer();
      cells.push({ input: buf, left: i * colW, top: 0 });
    } catch { /* a missing photo leaves surface showing, same as the web */ }
  }
  const wall = await sharp({ create: { width: W, height: H, channels: 4, background: "#211840" } })
    .composite(cells).png().toBuffer();

  // opacity .16 — NOT via ensureAlpha, which sets the channel but did not blend:
  // the photos came out at nearly full strength. Painting the surface colour OVER
  // the wall at 84% is exactly equivalent (wall at 16% over surface == surface at
  // 84% over wall) and is one rect in the overlay below, where it can be seen.
  const base = wall;

  // "check" IS THE GRADIENT, never flat orange. The web paints it with
  // background:var(--accent-grad) + background-clip:text (.logo-wm .ac,
  // index.html L224); #wordmark below is that gradient at the same 135deg.
  // The note lives here and not in the SVG because "--" inside an XML comment is
  // illegal and librsvg rejects the whole document for it.
  // The QR sits in the right margin, square, with the same 34px gutter as the
  // wordmark and 16px of air top and bottom so the veil does not crowd it.
  const qrSize = H - 32;
  const qrTag = await qrMarkup(qrSize, W - 34 - qrSize, 16);

  const over = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#16102A" stop-opacity="0.28"/>
        <stop offset="0.55" stop-color="#16102A" stop-opacity="0.62"/>
        <stop offset="1" stop-color="#16102A" stop-opacity="0.88"/>
      </linearGradient>
      <pattern id="crt" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="1" fill="#FF9A3D" fill-opacity="0.025"/>
      </pattern>
      <linearGradient id="sun" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#FF5E7E"/><stop offset="1" stop-color="#FF9A3D"/>
      </linearGradient>
      <linearGradient id="wordmark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#FF5E7E"/><stop offset="1" stop-color="#FF9A3D"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#211840" fill-opacity="0.84"/>
    <rect width="${W}" height="${H}" fill="url(#veil)"/>
    <rect width="${W}" height="${H}" fill="url(#crt)"/>
    <text x="34" y="${H / 2 - 4}" font-family="Bricolage Grotesque" font-size="44" font-weight="800"
          letter-spacing="-1.94" fill="url(#wordmark)">soundcheck.club</text>
    <text x="36" y="${H / 2 + 26}" font-family="Archivo" font-size="15" font-weight="700"
          letter-spacing="2.4" fill="#FDF3EC">FIND YOUR MUSIC FOR TONIGHT</text>
    ${qrTag}
    <rect x="0" y="${H - 4}" width="${W}" height="4" fill="url(#sun)"/>
  </svg>`;

  return sharp(base).composite([{ input: Buffer.from(over) }]).png().toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(OUT, { recursive: true });
  // 1x for the upload fields, and a 3x master because Reddit's own banner is
  // shown on retina and anything sized exactly to the minimum is soft there.
  // Rendered at the real pixel size rather than upscaled — the wall photos are
  // re-fetched at 3x, the type is redrawn, the QR is redrawn from the vector.
  const sizes = [
    [1072, 128, "desktop"],
    [1080, 128, "mobile"],
    [3216, 384, "desktop@3x"],
    [3240, 384, "mobile@3x"],
  ];
  for (const [w, h, name] of sizes) {
    await writeFile(`${OUT}/soundcheck-banner-${name}-${w}x${h}.png`, await banner(w, h));
    console.log(`  ${name.padEnd(12)} ${w}×${h}`);
  }
}
