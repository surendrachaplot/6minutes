// avatar.mjs — the soundcheck avatar: the sun IS the disc, with a horizon across it.
//
// WHY THIS AND NOT THE APP ICON
// The app icon is a SCENE — a sun set into a dark ground, composed for a rounded
// square whose corners carry that ground. Masked into a circular avatar it spends
// most of the frame on ground, and at 24px in a comment thread the mark is a
// small striped dot under a dark band.
//
// Here the sun runs edge to edge, so the disc edge and the sun edge are the same
// edge and nothing is lost at any size. The horizon stays because without a line
// across it this is a sun at noon, not a sunset — it is the difference between
// the brand mark and an orange circle.
//
// EVERY SIZE IS RENDERED FROM THE VECTOR, never downsampled from the big one.
// Rasterising 1024 and shrinking to 24 collapses the horizon to a fraction of a
// pixel and antialiasing eats it. Strokes are also floored, because a hairline
// that holds at 1000px is invisible at 24 — optical scaling, not arithmetic.
import { createRequire } from "module";
import { mkdir } from "node:fs/promises";
const sharp = createRequire("/Users/surendrachaplot/gitrepo/soundcheck-api/")("sharp");
const OUT = process.argv[2] || ".";

const HORIZON = 0.72;        // of the height — the dark ground is a crescent, not a third
const SCAN = 8 / 1024;       // scanline bar height; pitch is 4x that
const LINE = 10 / 1024;      // orange horizon bar
const HI = 5 / 1024;         // cream highlight sitting on it

export function svg(S, { transparent = false } = {}) {
  // 1px floors: below these the stripes turn to grey mush and the line disappears,
  // which is exactly where the mark most needs both to read.
  const scan = Math.max(1, Math.round(SCAN * S));
  const line = Math.max(1.5, LINE * S);
  const hi = Math.max(0.75, HI * S);
  const c = S / 2, hz = S * HORIZON;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF5E7E"/><stop offset="100%" stop-color="#FF9A3D"/>
    </linearGradient>
    <pattern id="sc" width="${scan}" height="${scan * 4}" patternUnits="userSpaceOnUse">
      <rect width="${scan}" height="${scan}" fill="#16102A" fill-opacity="0.55"/>
    </pattern>
    <clipPath id="d"><circle cx="${c}" cy="${c}" r="${c}"/></clipPath>
  </defs>
  <g clip-path="url(#d)">
    ${transparent ? "" : `<rect width="${S}" height="${S}" fill="#0E0A1C"/>`}
    <circle cx="${c}" cy="${c}" r="${c}" fill="url(#g)"/>
    <circle cx="${c}" cy="${c}" r="${c}" fill="url(#sc)"/>
    <rect x="0" y="${hz}" width="${S}" height="${S}" fill="#0E0A1C"/>
    <rect x="0" y="${hz - line}" width="${S}" height="${line}" fill="#FF9A3D"/>
    <rect x="0" y="${hz - line - hi - hi}" width="${S}" height="${hi}" fill="#FFE9A8" fill-opacity=".7"/>
  </g>
</svg>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await mkdir(OUT, { recursive: true });
  // Square canvases with the corners filled: Spotify, Instagram, X and YouTube all
  // take a square and mask it themselves, and a transparent-cornered PNG gets
  // composited onto their background first — so corners can flash white in light
  // mode behind the mask. Here the disc already fills the square edge to edge.
  const SIZES = [1024, 1000, 800, 400, 320, 200, 120, 64];
  for (const px of SIZES) {
    await sharp(Buffer.from(svg(px))).png().toFile(`${OUT}/soundcheck-avatar-${px}.png`);
  }
  await sharp(Buffer.from(svg(1024, { transparent: true }))).png()
    .toFile(`${OUT}/soundcheck-avatar-1024-transparent.png`);

  for (const [bg, tag] of [["#FDF3EC", "light"], ["#121212", "dark"]]) {
    const at = async (px) => sharp(Buffer.from(svg(px))).png().toBuffer();
    await sharp({ create: { width: 700, height: 260, channels: 4, background: bg } })
      .composite([
        { input: await at(180), left: 30, top: 40 },
        { input: await at(120), left: 250, top: 70 },
        { input: await at(64), left: 400, top: 98 },
        { input: await at(40), left: 490, top: 110 },
        { input: await at(24), left: 555, top: 118 },
      ]).png().toFile(`${OUT}/proof-${tag}.png`);
  }
  console.log("avatar:", SIZES.join(", "), "+ transparent + 2 proofs");
}
