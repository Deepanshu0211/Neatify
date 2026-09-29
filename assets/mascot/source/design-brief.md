# Design brief and generation record

The supplied Neatify brief calls for an original woodland/home companion: cozy, curious, helpful, quietly intelligent and slightly mischievous. It must be recognizable as a brand character before it becomes UI decoration. The character must not resemble Duo, a corporate blob, or an explicitly Viking figure.

## Base design

A compact woodland housekeeper with a squared, folded sage hood leaning to viewer-left; one cream stitch on the fold; cream face framed by a forest rim; square dark eyes; restrained friendly mouth; linen tunic; short sage cape; diagonal warm-brown strap; square viewer-right satchel; sturdy brown boots. The head occupies under half the standing character height. No giant-head/tiny-body treatment.

## Attempted built-in image prompt direction

Use case: logo-brand. Single full-body Neatify mascot, 1024 × 1024 transparent PNG. Original woodland housekeeper with the design above. Deliberate low-resolution pixel grid enlarged with nearest-neighbor. Eight flat colors: forest, sage, light sage, cream, off-white, beige, warm brown and deep brown. Hard stepped outlines, no antialiasing, gradients, external shadows, text, scenery, UI, or watermark. Center the complete silhouette and preserve it across all variants and expressions.

The built-in image service returned `usage_limit_reached` and produced no asset. The final pack was authored directly with a 64 × 64 pixel master, a separate 32 × 32 portrait master, and pixel-hinted 16/24 px icon masters. No CLI image API was used.

## Variant directions

1. Full mascot: relaxed hands, neutral smile.
2. Portrait: same hood/face, a short matching cape collar; no legs or satchel.
3. Circular icon: portrait on a simple stepped cream circular disk with sage rim; transparent outside.
4. Folder: exact base character carrying a beige folder in front, same satchel retained.
5. Silhouette: all occupied base-character pixels in forest green.
6. Windows: dedicated hood/face composition with clear eyes and folded tip; simplify at 16 px.
7. Expression sheet: idle, happy, curious, working, carrying, scanning, organizing, confused, sleepy, celebrating; shared body and head drawing functions, same palette and proportions.
