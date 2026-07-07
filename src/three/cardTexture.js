import * as THREE from "three";
import { CAT_META } from "../game/constants.js";

/* ============================================================
   TEXTURAS DE CARTA generadas por código (nunca imágenes).
   El lienzo respeta la relación de la cara del modelo 3D (~0.68)
   y el diseño llega casi al borde para amoldarse a la carta.
   Colores de categoría MÁS SATURADOS.
   ============================================================ */

const W = 660, H = 970;                 // relación ≈ 0.68 (cara del modelo)
const R = 66;                            // radio de esquina (acompaña la carta)
export const OPTION_REGIONS = [
  { cy: 0.40, h: 0.275 },
  { cy: 0.715, h: 0.275 },
];

/* --- saturación de color (HSL) --- */
function hexToRgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function toHex(v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); }
function saturate(hex, addS = 0.22, dL = 0) {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2;
  if (mx === mn) { h = s = 0; } else {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6;
  }
  s = Math.min(1, s + addS); l = Math.min(1, Math.max(0, l + dL));
  const hue = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let R2, G2, B2; if (s === 0) { R2 = G2 = B2 = l; } else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; R2 = hue(p, q, h + 1 / 3); G2 = hue(p, q, h); B2 = hue(p, q, h - 1 / 3); }
  return "#" + toHex(R2 * 255) + toHex(G2 * 255) + toHex(B2 * 255);
}

function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

function star(x, cx, cy, R2, r, fill) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r : R2; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.closePath(); x.fillStyle = fill; x.fill();
}

function triangleBadge(x, cx, cy) {
  const w = 196, h = 46; const X = cx - w / 2, Y = cy - h / 2;
  roundRect(x, X, Y, w, h, 23); x.fillStyle = "#1c1630"; x.fill();
  x.beginPath(); x.moveTo(X + 25, Y + 32); x.lineTo(X + 40, Y + 32); x.lineTo(X + 32, Y + 13); x.closePath(); x.fillStyle = "#F5C518"; x.fill();
  x.fillStyle = "#fff"; x.font = "700 22px 'Trebuchet MS', sans-serif"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText("Todos juegan", X + 52, Y + h / 2);
}

function wrapText(x, text, cx, cy, maxW, lh) {
  const words = text.split(" "); let line = ""; const lines = [];
  for (const w of words) { const t = line ? line + " " + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  lines.push(line);
  const startY = cy - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => x.fillText(l, cx, startY + i * lh));
}

export function makeCardFront(card) {
  const meta = CAT_META[card.category];
  const hot = saturate(meta.hex, 0.24, 0.02);   // color de categoría vívido
  const hotD = saturate(meta.dark, 0.28, -0.02);
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  // cuerpo crema, casi al borde, con doble filo de categoría
  roundRect(x, 10, 10, W - 20, H - 20, R); x.fillStyle = "#FCF5E7"; x.fill();
  x.lineWidth = 26; x.strokeStyle = hot; x.stroke();
  roundRect(x, 30, 30, W - 60, H - 60, R - 18); x.lineWidth = 4; x.strokeStyle = hotD; x.stroke();
  // ribbon de categoría
  x.save(); roundRect(x, 52, 46, W - 104, 128, 34); x.shadowColor = "rgba(0,0,0,.3)"; x.shadowBlur = 12; x.shadowOffsetY = 5; x.fillStyle = hot; x.fill(); x.restore();
  const grad = x.createLinearGradient(0, 46, 0, 174); grad.addColorStop(0, saturate(meta.light, 0.2, 0.04)); grad.addColorStop(1, hot);
  roundRect(x, 52, 46, W - 104, 128, 34); x.fillStyle = grad; x.fill();
  x.fillStyle = meta.ink; x.font = "800 42px 'Trebuchet MS', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(card.category === "rojo" ? "TODOS JUEGAN" : meta.label.toUpperCase(), W / 2, 110);
  // hint
  x.fillStyle = hotD; x.font = "700 23px 'Trebuchet MS', sans-serif"; x.fillText("· TOCÁ UNA OPCIÓN ·", W / 2, 214);

  card.options.forEach((o, i) => {
    const cy = OPTION_REGIONS[i].cy * H, bh = OPTION_REGIONS[i].h * H;
    roundRect(x, 60, cy - bh / 2, W - 120, bh, 34);
    x.fillStyle = "#ffffff"; x.fill(); x.lineWidth = 8; x.strokeStyle = hot; x.stroke();
    x.fillStyle = "#1e2138"; x.font = "800 48px 'Trebuchet MS', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
    wrapText(x, o.text, W / 2, cy - (o.allPlay ? 28 : 0), W - 210, 56);
    if (o.allPlay) triangleBadge(x, W / 2, cy + bh / 2 - 46);
  });
  const midY = ((OPTION_REGIONS[0].cy + OPTION_REGIONS[1].cy) / 2) * H;
  x.save(); x.fillStyle = hot; x.beginPath(); x.arc(W / 2, midY, 30, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff"; x.font = "900 34px 'Trebuchet MS', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("ó", W / 2, midY + 2); x.restore();

  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

export function makeCardBack(card) {
  const meta = CAT_META[card.category];
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  roundRect(x, 10, 10, W - 20, H - 20, R);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, saturate(meta.light, 0.22, 0.03)); g.addColorStop(1, saturate(meta.dark, 0.26, -0.02)); x.fillStyle = g; x.fill();
  x.lineWidth = 22; x.strokeStyle = "#FCF5E7"; x.stroke();
  for (const [sx, sy, r] of [[130, 200, 28], [540, 260, 22], [160, 760, 24], [520, 780, 30], [340, 140, 20]]) star(x, sx, sy, r, r * 0.45, "rgba(255,255,255,.34)");
  x.fillStyle = "rgba(0,0,0,.18)"; x.font = "900 320px 'Trebuchet MS', sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("?", W / 2, H / 2 + 20);
  x.fillStyle = "#fff"; x.font = "900 320px 'Trebuchet MS', sans-serif"; x.fillText("?", W / 2, H / 2);
  x.fillStyle = "#fff"; x.font = "800 34px 'Trebuchet MS', sans-serif"; x.fillText(card.category === "rojo" ? "MIX" : meta.label.toUpperCase(), W / 2, H - 96);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
