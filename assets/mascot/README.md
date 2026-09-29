# Neatify companion — brand master v1

An original woodland housekeeper: folded sage hood, cream linen tunic, forest outline, warm brown boots and a square satchel. The single cream stitch on the viewer-left hood fold is the identifying detail. The character is calm, curious, and quietly helpful. It has no horns, animal ears, or Viking elements.

## Deliverables

| File | Purpose | PNG dimensions |
| --- | --- | --- |
| `neatify-mascot.png` | Primary full-body brand master | 1024 × 1024 |
| `neatify-mascot-head.png` | Head/face portrait | 1024 × 1024 |
| `neatify-mascot-icon.png` | Mascot on a stepped circular cream badge; transparent outside | 1024 × 1024 |
| `neatify-mascot-folder.png` | Same companion carrying a folder | 1024 × 1024 |
| `neatify-mascot-silhouette.png` | Single forest-green silhouette | 1024 × 1024 |
| `neatify-expression-sheet.png` | Ten poses, transparent, consistent baseline | 3200 × 1408 |
| `windows/neatify-app-icon.png` | Dedicated head-and-collar composition | 1024 × 1024 |
| `windows/neatify.ico` | Seven embedded PNG icon sizes | 16, 24, 32, 48, 64, 128, 256 |
| `windows/{size}x{size}.png` | Individual Windows icon exports | Each size above |
| `sizes/full-{size}.png` | Full-character reduction references | Each size above |

`gallery.html` presents every variant, expression, and the Windows icons at their actual display sizes. PNGs are transparent, with no labels, background scenes, watermark, or external shadows. The expression sheet's blank space is transparent, not black.

## Expression sheet order

Read left to right. Top row: **idle, happy, curious, working, carrying a folder**.
Bottom row: **scanning files, organizing files, confused, sleepy, celebrating**.

Each cell is 640 × 704 pixels. Individual 512 × 512 expression PNGs are in `expressions/`; 64 × 64 application sprites are in `runtime/`. `manifest.json` records exact cell rectangles and dimensions.

These are pose references, not completed walk-cycle or action animations. The application component supports occasional idle blinking and one brief success reaction, and respects reduced motion.

## Consistency rules

- Keep the hood silhouette, left-side cream stitch, skin/linen colors, cape, viewer-right satchel, strap direction, and boots unchanged.
- Alter only facial expression, arm pose, and task props. Props never introduce additional colors.
- Full-body master: 64 × 64 logical canvas. Head master: 32 × 32. Scale with **nearest-neighbor** only.
- For 16–32 px UI and shortcuts, use the dedicated icon exports, not a resized full body. The 16 px icon is separately pixel-hinted; the 24 and 32 px grids preserve more face detail.
- Do not smooth the outlines, add gradients, make the hood neon, or introduce external drop shadows.
- Main UI text remains a readable system font. Pixel art provides the personality; it is not a reason to pixelate file names or controls.

## Palette

| Role | Hex |
| --- | --- |
| Forest outline | `#2A4134` |
| Sage cloth | `#5D7960` |
| Sage highlight | `#97AD80` |
| Warm cream | `#F0E6C5` |
| Off-white linen | `#FAF7E8` |
| Soft beige | `#C2A97E` |
| Warm brown leather | `#8D6C4B` |
| Deep brown | `#534531` |

There are exactly eight opaque colors plus fully transparent pixels. No intermediate alpha values are used.

## Source and reproducibility

`source/build-mascot.mjs` is the editable pixel master and PNG/ICO exporter. It uses only integer pixel coordinates and Node's built-in modules. It regenerates the assets and the UI copies in `public/mascot/`:

```sh
node assets/mascot/source/build-mascot.mjs
node assets/mascot/source/verify-mascot.mjs
```

The image-generation service returned a usage-limit error before producing an image. These final assets were therefore authored directly as original pixel grids; they are not AI-generated image outputs. No API credentials, paid fallback, or third-party artwork were used. `source/design-brief.md` records the design brief and attempted prompt direction.

## Tauri / Windows integration

The Windows ICO is ready for later Tauri integration. The existing shipped bundle icons are preserved. When adopting the new brand for a release, copy `windows/neatify.ico` into the bundle's configured icon location and use the supplied 32/128/256 PNGs for the matching desktop sizes. Do not copy an ICO to an ICNS filename; generate macOS packaging separately if needed.

The master images can be used in a README, installer, website, or store artwork. Store-specific tile dimensions, backgrounds, and submission rules should be prepared for the intended listing separately; this pack is the brand source, not a complete Microsoft Store submission.
