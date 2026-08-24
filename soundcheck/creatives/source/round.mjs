// round.mjs — the sunset disc as a circular avatar, at every size that matters.
//
// NOT a crop of the app icon. That artwork is composed for a rounded SQUARE —
// the sun sits low and the horizon runs edge to edge, because the corners carry
// the dark ground. Masked to a circle, the mark sinks and the ground eats the
// bottom third. So the scene is rebuilt and reframed: the visible mark (sun top
// down to the horizon) is optically centred, and the horizon terminates ON the
// circle's edge rather than being sliced by it.
//
// EVERY SIZE IS RENDERED FROM THE VECTOR, NOT DOWNSAMPLED FROM THE BIG ONE.
// The geometry was always identical — what was not identical was the result.
// Rasterising 1024 and shrinking to 24 collapses the 4px horizon line to 0.09px
// and antialiasing eats it, so the small avatars lost the line that makes it a
// SUNSET rather than a dot. Rendering each size natively fixes the crispness but
// not the arithmetic — a proportional line is still sub-pixel at 24 — so the two
// horizon strokes are clamped to a floor. Optical scaling: a hairline that holds
// at 512 has to become proportionally heavier as the canvas shrinks, or it stops
// existing. That is why the 64px proof read better than the 220px one.
import { createRequire } from "module";
import { mkdir } from "node:fs/promises";
const sharp = createRequire("/Users/surendrachaplot/gitrepo/soundcheck-api/")("sharp");

const OUT = process.argv[2] || ".";

// Proportions, as fractions of the canvas — the single source of the composition.
const P = {
  sunY: 570 / 1024,      // sun centre
  sunR: 336 / 1024,      // sun radius  → 66% of the width
  glowR: 580 / 1024,
  horizon: 730 / 1024,   // the line the sun sets behind
  line: 8 / 1024,        // orange stroke
  hi: 4 / 1024,          // cream highlight above it
  hiGap: 16 / 1024,
  scanH: 8 / 1024,       // scanline pitch: bar height, then the same again as gap
};

function svgAt(S, { round = false } = {}) {
  const p = (k) => P[k] * S;
  // THE FLOOR. Below about 96px a proportional stroke is thinner than a pixel and
  // antialiasing turns it into a smudge, so the horizon fades out exactly where
  // the mark most needs it to read. 1.25px is the thinnest that still holds.
  const line = Math.max(1.25, p("line"));
  const hi = Math.max(0.75, p("hi"));
  const scan = Math.max(1, p("scanH"));
  const cx = S / 2, hz = p("horizon");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="sun" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF5E7E"/><stop offset="100%" stop-color="#FF9A3D"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="35%" stop-color="#FF5E7E" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#FF5E7E" stop-opacity="0"/>
    </radialGradient>
    <pattern id="scan" width="${scan}" height="${scan * 4}" patternUnits="userSpaceOnUse">
      <rect width="${scan}" height="${scan}" fill="#16102A" fill-opacity="0.55"/>
    </pattern>
    <clipPath id="disc"><circle cx="${cx}" cy="${cx}" r="${S / 2}"/></clipPath>
  </defs>
  <g${round ? ' clip-path="url(#disc)"' : ""}>
    <rect width="${S}" height="${S}" fill="#16102A"/>
    <circle cx="${cx}" cy="${p("sunY")}" r="${p("glowR")}" fill="url(#glow)"/>
    <circle cx="${cx}" cy="${p("sunY")}" r="${p("sunR")}" fill="url(#sun)"/>
    <circle cx="${cx}" cy="${p("sunY")}" r="${p("sunR")}" fill="url(#scan)"/>
    <rect x="0" y="${hz + line / 2}" width="${S}" height="${S}" fill="#0E0A1C"/>
    <rect x="0" y="${hz - line / 2}" width="${S}" height="${line}" fill="#FF9A3D"/>
    <rect x="0" y="${hz - p("hiGap")}" width="${S}" height="${hi}" fill="#FFE9A8" fill-opacity=".55"/>
  </g>
</svg>`;
}

await mkdir(OUT, { recursive: true });

// Upload the SQUARE ones. Spotify, Instagram, X and YouTube all take a square and
// mask it themselves; a transparent-cornered PNG gets composited onto their
// background first, so the corners can flash white in light mode behind the mask.
// Filled corners cannot do that, and still look right anywhere the mask is skipped.
const SIZES = [1024, 1000, 800, 400, 320, 200, 120, 64];
for (const px of SIZES) {
  await sharp(Buffer.from(svgAt(px))).png().toFile(`${OUT}/soundcheck-round-${px}.png`);
}
await sharp(Buffer.from(svgAt(1024, { round: true }))).png()
  .toFile(`${OUT}/soundcheck-disc-1024-transparent.png`);

// Proof at the sizes these are actually seen at, each one the NATIVE render.
const masked = async (px) => {
  const art = await sharp(Buffer.from(svgAt(px))).png().toBuffer();
  const circle = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
  return sharp(art).composite([{ input: circle, blend: "dest-in" }]).png().toBuffer();
};
for (const [bg, name] of [["#FDF3EC", "light"], ["#121212", "dark"]]) {
  const sheet = sharp({ create: { width: 760, height: 300, channels: 4, background: bg } });
  await sheet.composite([
    { input: await masked(220), left: 30, top: 40 },
    { input: await masked(120), left: 290, top: 40 },
    { input: await masked(64), left: 450, top: 40 },
    { input: await masked(40), left: 540, top: 40 },
    { input: await masked(24), left: 605, top: 40 },
  ]).png().toFile(`${OUT}/proof-on-${name}.png`);
}
console.log("native renders:", SIZES.join(", "), "+ transparent disc + 2 proofs");
