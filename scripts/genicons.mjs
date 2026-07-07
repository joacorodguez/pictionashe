import sharp from "sharp";

const SRC = "assets/icon/icon.png";
const out = "public/icons";

// iconos "any" (conservan las esquinas redondeadas propias del arte)
for (const s of [192, 512]) {
  await sharp(SRC).resize(s, s).png().toFile(`${out}/icon-${s}.png`);
}
// apple-touch-icon 180 (iOS aplica su propia máscara)
await sharp(SRC).resize(180, 180).png().toFile(`public/apple-touch-icon.png`);
// favicon 32
await sharp(SRC).resize(32, 32).png().toFile(`public/favicon-32.png`);
// maskable 512: arte con padding para respetar la safe-zone de Android
const bg = { r: 0x3a, g: 0x1d, b: 0x6e, alpha: 1 };
const inner = Math.round(512 * 0.78);
const art = await sharp(SRC).resize(inner, inner).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
  .composite([{ input: art, gravity: "center" }])
  .png().toFile(`${out}/maskable-512.png`);

console.log("iconos generados");
