# soundcheck creatives

Everything the brand needs outside the app itself — the things you upload to
somebody else's platform. Lives here because this repo already holds the binary
brand assets the build pulls from.

**The design comes from Paper first, always.** These files are renders of boards
in the Soundcheck Paper file, not the other way round. Change the board, then
re-run the script in `source/`.

## banners/

Reddit community banner: the profile poster-wall, at banner shape.

| file | use |
|---|---|
| `soundcheck-banner-desktop-1072x128.png` | Reddit desktop banner |
| `soundcheck-banner-mobile-1080x128.png` | Reddit mobile banner |
| `...desktop@3x-3216x384.png` | retina master |
| `...mobile@3x-3240x384.png` | retina master |

The @3x files are RENDERED at 3x, not upscaled — the wall photos are re-fetched
at full size, the type redrawn, the QR redrawn from vector.

Values are copied from `.pfh-poster` in soundcheck-api/index.html, not
approximated: wall = 8 columns at `opacity .16`, veil =
`rgba(22,16,42,.28) → .62 at 55% → .88`, CRT = `rgba(255,154,61,.025)` 1px in 8.

## avatars/

Circular avatar — the sun IS the disc, with a horizon across it. Upload the
SQUARE files: Spotify, Instagram, X and YouTube all take a square and mask it
themselves, and a transparent-cornered PNG gets composited onto their background
first, so corners can flash white in light mode behind the mask.

`1000` Spotify · `800` YouTube · `400` X · `320` Instagram, Facebook.
`soundcheck-disc-1024-transparent.png` is for decks and known backgrounds only.

## app-icon/

The sunset disc. `1024` is the master. **App Store Connect rejects any alpha
channel** — use `soundcheck-icon-1024-appstore-noalpha.png` there or the upload
fails with an unhelpful error. `512` is the Play Store listing icon.

## source/

The scripts that render the above. Re-run any of them with an output directory:

```
node banner.mjs ./out
```

Two things they all get right and that are easy to get wrong by hand:

- **Brand fonts.** `ensureFonts()` must run BEFORE `require("sharp")` — librsvg
  reads `FONTCONFIG_FILE` once, when sharp first loads. Get the order wrong and
  it falls back to a system sans silently.
- **Never flat accent.** `#FF9A3D` alone is not the brand. Buttons, CTAs and the
  wordmark are the sunset gradient `#FF5E7E → #FF9A3D`. In SVG that means a
  `<linearGradient>` and `fill="url(#id)"`.

`qrread.swift` decodes a QR with Apple's own detector — the authority on whether
a phone can read one is the thing in the phone, and a JS decoder has said no to
codes every camera read fine. Build with `swiftc -O qrread.swift -o qrread`.
