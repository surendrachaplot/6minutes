import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
const sharp = createRequire('/Users/surendrachaplot/gitrepo/soundcheck-api/')('sharp');

// ANDROID ADAPTIVE IS NOT THE SQUARE ICON SCALED DOWN. The launcher masks the
// foreground to a circle and parallaxes it, so the layer must be the MARK on
// transparent — a shrunken rounded square inside a circle reads as a sticker.
// Android's safe zone is the central 66 of 108dp: at 432 that is a 264 circle.
const S = 432, CX = 216, CY = 216, SUN_R = 112;
const fg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF5E7E"/><stop offset="100%" stop-color="#FF9A3D"/></linearGradient>
    <radialGradient id="h" cx="50%" cy="50%" r="50%"><stop offset="35%" stop-color="#FF5E7E" stop-opacity=".38"/><stop offset="100%" stop-color="#FF5E7E" stop-opacity="0"/></radialGradient>
    <pattern id="sc" width="4" height="12" patternUnits="userSpaceOnUse"><rect width="4" height="3" fill="#16102A" fill-opacity=".55"/></pattern>
    <clipPath id="sun"><circle cx="${CX}" cy="${CY}" r="${SUN_R}"/></clipPath>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="200" fill="url(#h)"/>
  <circle cx="${CX}" cy="${CY}" r="${SUN_R}" fill="url(#s)"/>
  <g clip-path="url(#sun)"><rect x="${CX - SUN_R}" y="${CY - SUN_R}" width="${SUN_R * 2}" height="${SUN_R * 2}" fill="url(#sc)"/></g>
  <rect x="40" y="${CY + SUN_R - 6}" width="${S - 80}" height="5" rx="2.5" fill="#FF9A3D"/>
</svg>`;

// Themed icons get a flat silhouette — the launcher recolours it, so any
// gradient in here is thrown away and only the shape survives.
const mono = `
<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${CX}" cy="${CY}" r="${SUN_R}" fill="#FFFFFF"/>
  <rect x="40" y="${CY + SUN_R - 6}" width="${S - 80}" height="5" rx="2.5" fill="#FFFFFF"/>
</svg>`;

mkdirSync('ship', { recursive: true });
writeFileSync('ship/fg.svg', fg);
await sharp(Buffer.from(fg)).png().toFile('ship/android-icon-foreground.png');
await sharp(Buffer.from(mono)).png().toFile('ship/android-icon-monochrome.png');
await sharp({ create: { width: S, height: S, channels: 4, background: '#16102A' } }).png().toFile('ship/android-icon-background.png');

// square icons, all from the one A source
for (const [name, px] of [['icon.png', 1024], ['splash-icon.png', 1024], ['icon-512.png', 512], ['icon-192.png', 192], ['favicon.png', 48]])
  await sharp('A.svg').resize(px, px).png().toFile('ship/' + name);
for (const px of [16, 48, 128]) await sharp('A.svg').resize(px, px).png().toFile(`ship/icon-${px}.png`);
console.log('ship/ ready');
