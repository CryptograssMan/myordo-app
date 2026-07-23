// scripts/generate-icons.mjs
//
// Generates the PWA icon set from the master brand asset (offline-pwa
// spec §4). Re-run after any rebrand: node scripts/generate-icons.mjs
//
//   public/icons/icon-192.png           192  Android/Chrome minimum
//   public/icons/icon-512.png           512  splash + install dialog
//   public/icons/icon-512-maskable.png  512  artwork inside the 80% safe
//                                            zone, brand cream bleeding to
//                                            the edges (Android masks crop)
//   public/apple-touch-icon.png         180  flattened, NO transparency
//                                            (iOS renders alpha as black)

import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "public/brand/myordo-icon-light.svg";
const BG = "#F1ECE0"; // brand cream — matches the SVG's own background rect

await mkdir("public/icons", { recursive: true });

// Plain sizes: the SVG is already full-bleed on the cream background.
for (const size of [192, 512]) {
  await sharp(SRC, { density: 300 })
    .resize(size, size)
    .flatten({ background: BG })
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png`);
}

// Maskable: artwork scaled to the inner 80% safe zone, composited on a
// full-bleed cream square so circular/squircle masks never crop the mark.
{
  const inner = Math.round(512 * 0.8);
  const art = await sharp(SRC, { density: 300 }).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: BG },
  })
    .composite([{ input: art, gravity: "center" }])
    .png()
    .toFile("public/icons/icon-512-maskable.png");
  console.log("icon-512-maskable.png");
}

// apple-touch-icon: 180×180, flattened (no alpha).
await sharp(SRC, { density: 300 })
  .resize(180, 180)
  .flatten({ background: BG })
  .png()
  .toFile("public/apple-touch-icon.png");
console.log("apple-touch-icon.png");
