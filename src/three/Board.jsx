import React, { useMemo, useLayoutEffect, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MODELS, modelForAvatar } from "./models.js";
import { Model } from "./Model.jsx";
import { buildBoardLayout, teamXZ, CELL } from "./boardLayout.js";
import { CAT_META, colorAt } from "../game/constants.js";
import { Sound } from "../audio/sound.js";
import masksUrl from "../../assets/board/mascaras-teatro.png";

/* ============================================================
   TABLERO 3D — suelo (ground.glb instanciado) + casilleros
   (tile.glb, baldosas finas integradas al suelo) + fichas.
   Los casilleros sobresalen apenas unos mm sobre el suelo para
   parecer un camino integrado al escenario (estilo Monopoly GO).
   ============================================================ */

export const SURFACE_Y = 0.06;   // altura del tope del casillero (superficie útil)
const TILE_FOOT = CELL * 0.99;   // footprint del casillero (casi toca al vecino)
const GROUND_FOOT = CELL;        // el módulo de suelo tapa la celda completa
const TILE_RISE = SURFACE_Y;     // cuánto sobresale la baldosa sobre el suelo (mundo)
// Proporcionales al nuevo tamaño de tablero (CELL 2→1.5, factor 0.75) para
// que avatares, saltos y separación se vean coherentes con casilleros más chicos.
const BOARD_SCALE = CELL / 2;
const PIECE_SIZE = 1.4 * BOARD_SCALE;   // alto de las fichas (protagonistas)
const MATE_OFFSET = 0.5 * BOARD_SCALE;  // separación de fichas en el mismo casillero
const GROUND_MARGIN = 3;         // celdas de suelo extra alrededor (para decoraciones futuras)

/* Salto: lento y cinematográfico (~50% más lento) */
const JUMP_H = 0.75 * BOARD_SCALE;
const JUMP_DUR = 0.68; // salto pesado y claramente visible

/* Curva de impacto del casillero: se hunde apenas y rebota (amortiguado). */
function tileImpact(t) {
  if (t < 0 || t > 0.55) return 0;
  return -0.085 * Math.exp(-7 * t) * Math.sin(13 * t);
}

function firstGeometry(object) {
  let geo = null;
  object.traverse((o) => { if (!geo && o.isMesh) geo = o.geometry; });
  return geo;
}

/* Borde más claro que la cara de arriba (truco de juegos de mesa físicos):
   se oscurece un poco la cara SUPERIOR (normal hacia arriba) vía vertex color,
   así los cantos/biseles quedan ~12% más claros y la ficha gana volumen y
   legibilidad SIN subir el brillo. El vertex color se multiplica con el color
   por instancia (cada casillero conserva su color saturado). */
function addRimShade(geo, topShade = 0.88) {
  const norm = geo.attributes.normal; const n = norm.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const up = Math.max(0, Math.min(1, (norm.getY(i) - 0.2) / 0.7)); // 0 cantos → 1 cara arriba
    const s = 1 - (1 - topShade) * up;
    col[i * 3] = s; col[i * 3 + 1] = s; col[i * 3 + 2] = s;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return geo;
}

/* Normaliza una geometría GLB: centra en XZ, escala al footprint y
   deja el TOPE en y=0 (para apoyar cosas encima). Devuelve alto real. */
function normalizeToFoot(srcGeo, foot, anchorTop = true) {
  const g = srcGeo.clone();
  g.computeBoundingBox();
  const bb = g.boundingBox; const size = new THREE.Vector3(); bb.getSize(size);
  const s = foot / Math.max(size.x, size.z || size.x);
  const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  g.translate(-cx, anchorTop ? -bb.max.y : -bb.min.y, -cz);
  g.scale(s, s, s);
  g.computeVertexNormals();
  return { geometry: g, height: size.y * s };
}

/* --------- Máscaras de teatro dibujadas en DORADO brillante ---------
   Comedia + tragedia con relleno metálico, borde de definición, brillo
   superior, un remolino dorado detrás y destellos. Sin foto. --------- */
/* Recorta el PNG de máscaras: quita el fondo negro por luminancia y deja
   el dorado (máscaras + remolino + estrellas + un glow cálido tenue). */
function processMasks(img) {
  const iw = img.width, ih = img.height;
  const t = document.createElement("canvas"); t.width = iw; t.height = ih;
  const tx = t.getContext("2d"); tx.drawImage(img, 0, 0);
  const im = tx.getImageData(0, 0, iw, ih); const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    let a = (L - 52) / 120;                 // negro→transparente, dorado→opaco
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    d[i + 3] = Math.round(255 * a);
  }
  tx.putImageData(im, 0, 0);
  return t;
}

/* estrella de 5 puntas (canvas) para la decoración dorada sutil */
function goldStar(x, cx, cy, r, fill) {
  x.save(); x.translate(cx, cy); x.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.44 : r; const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.closePath(); x.fillStyle = fill; x.fill(); x.restore();
}

/* --------- Textura del tablero PREMIUM: marfil/crema + decoración
   dorada muy sutil (círculos, estrellas) + máscaras doradas al centro.
   Devuelve 3 mapas: color, metalness y roughness. Así las MÁSCARAS se
   renderizan como ORO METÁLICO (responden a la luz/entorno, con relieve)
   mientras el resto del marfil queda MATE. Acabado de juego premium. --------- */
function makeBoardSurface() {
  const S = 1024;
  const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
  // mapas auxiliares: metalness (negro=mate, blanco=metal) y roughness
  const mC = document.createElement("canvas"); mC.width = S; mC.height = S; const mx = mC.getContext("2d");
  mx.fillStyle = "#000"; mx.fillRect(0, 0, S, S);                 // todo mate por defecto
  const rC = document.createElement("canvas"); rC.width = S; rC.height = S; const rx = rC.getContext("2d");
  rx.fillStyle = "#d9d9d9"; rx.fillRect(0, 0, S, S);              // marfil rugoso (mate)

  // base marfil radial (cálida, muy clara)
  let g = x.createRadialGradient(S / 2, S * 0.46, S * 0.05, S / 2, S / 2, S * 0.78);
  g.addColorStop(0, "#F8F1E0"); g.addColorStop(0.6, "#F1E7CE"); g.addColorStop(1, "#E7DABB");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // viñeta cálida apenas perceptible (da volumen sin ensuciar)
  g = x.createRadialGradient(S / 2, S / 2, S * 0.52, S / 2, S / 2, S * 0.80);
  g.addColorStop(0, "rgba(120,92,40,0)"); g.addColorStop(1, "rgba(120,92,40,.12)");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // grano/manchas muy sutiles (imperfección natural, evita el plano perfecto)
  for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(150,120,70,${Math.random() * 0.02})`; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
  // círculos dorados MUY sutiles alrededor del centro
  x.lineWidth = 2;
  for (let r = S * 0.14; r < S * 0.32; r += 24) { x.beginPath(); x.arc(S / 2, S / 2, r, 0, Math.PI * 2); x.strokeStyle = "rgba(196,158,74,.10)"; x.stroke(); }
  x.beginPath(); x.arc(S / 2, S / 2, S * 0.315, 0, Math.PI * 2); x.strokeStyle = "rgba(198,158,70,.18)"; x.lineWidth = 3; x.stroke();
  // estrellas del MISMO dorado de la foto, repartidas alrededor del centro
  const starGold = "#F6C93E";
  const stars = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.35; const rad = 0.30 + (i % 3) * 0.035; stars.push([0.5 + Math.cos(a) * rad, 0.5 + Math.sin(a) * rad * 0.92, 0.7 + (i % 2) * 0.4]); }
  for (const [sx, sy, rr] of stars) {
    x.save(); x.shadowColor = "rgba(255,214,110,.85)"; x.shadowBlur = S * 0.014;
    goldStar(x, S * sx, S * sy, S * 0.015 * rr, starGold);
    x.restore();
  }

  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const metalTex = new THREE.CanvasTexture(mC); metalTex.anisotropy = 4;
  const roughTex = new THREE.CanvasTexture(rC); roughTex.anisotropy = 4;

  // máscaras (PNG): se cargan async → color dorado en la superficie + silueta
  // metálica (blanca) en el mapa de metalness y oscura en el de roughness.
  const img = new Image();
  img.onload = () => {
    const em = processMasks(img);
    const w = S * 0.78, h = w * (img.height / img.width);
    const dx = S / 2 - w / 2, dy = S / 2 - h / 2;
    x.drawImage(em, dx, dy, w, h);
    // silueta a partir del alpha del recorte
    const sil = document.createElement("canvas"); sil.width = em.width; sil.height = em.height;
    const scx = sil.getContext("2d");
    scx.drawImage(em, 0, 0); scx.globalCompositeOperation = "source-in";
    scx.fillStyle = "#fff"; scx.fillRect(0, 0, sil.width, sil.height);
    mx.drawImage(sil, dx, dy, w, h);                                  // metal = blanco en las máscaras
    scx.globalCompositeOperation = "source-in"; scx.fillStyle = "#3a3a3a"; scx.fillRect(0, 0, sil.width, sil.height);
    rx.drawImage(sil, dx, dy, w, h);                                  // roughness baja (brillante) en las máscaras
    tex.needsUpdate = true; metalTex.needsUpdate = true; roughTex.needsUpdate = true;
  };
  img.src = masksUrl;
  return { map: tex, metalnessMap: metalTex, roughnessMap: roughTex };
}

/* Textura de madera clara con veta MARCADA (para el marco). */
function makeWoodTexture() {
  const W = 512, H = 128; const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  // base con leve variación de tono a lo largo de la tabla
  const bg = x.createLinearGradient(0, 0, W, 0);
  bg.addColorStop(0, "#c6a566"); bg.addColorStop(0.5, "#cdaa6a"); bg.addColorStop(1, "#c2a061");
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  // vetas onduladas más oscuras (más y más marcadas)
  for (let i = 0; i < 46; i++) {
    const y = Math.random() * H, amp = 2 + Math.random() * 6, a = 0.10 + Math.random() * 0.20;
    x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= W; px += 14) x.lineTo(px, y + Math.sin(px * 0.018 + i) * amp);
    x.lineWidth = 1 + Math.random() * 2.2; x.strokeStyle = `rgba(120,84,40,${a})`; x.stroke();
  }
  // algunos nudos/streaks más oscuros
  for (let i = 0; i < 5; i++) { const y = Math.random() * H; x.strokeStyle = "rgba(96,64,28,.22)"; x.lineWidth = 2 + Math.random() * 2; x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= W; px += 20) x.lineTo(px, y + Math.sin(px * 0.03 + i) * 4); x.stroke(); }
  // reflejos claros de la fibra
  for (let i = 0; i < 14; i++) { const y = Math.random() * H; x.strokeStyle = "rgba(244,228,190,.14)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + Math.sin(i) * 3); x.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 1); tex.anisotropy = 8;
  return tex;
}

/* Textura de veta NEUTRA para los casilleros: gris claro con fibra sutil.
   Se tiñe con el color del casillero (instanceColor la multiplica) → parece
   madera pintada de ese color, con poco brillo. */
function makeTileWoodTexture() {
  const W = 256, H = 256; const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  x.fillStyle = "#efefef"; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * H, amp = 1 + Math.random() * 4, a = 0.05 + Math.random() * 0.10;
    x.beginPath(); x.moveTo(0, y);
    for (let px = 0; px <= W; px += 12) x.lineTo(px, y + Math.sin(px * 0.03 + i) * amp);
    x.lineWidth = 1 + Math.random() * 1.4; x.strokeStyle = `rgba(120,110,96,${a})`; x.stroke();
  }
  for (let i = 0; i < 10; i++) { const y = Math.random() * H; x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + Math.sin(i) * 2); x.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8;
  return tex;
}

/* --------- Marco de madera clara con veta (fino, apenas elevado) --------- */
function WoodFrame({ half, y = 0.12 }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: makeWoodTexture(), color: "#ffffff", roughness: 0.66, metalness: 0 }), []);
  const fw = 1.2, h = 0.32, len = half * 2 + fw * 2, mid = half + fw / 2;
  const boxes = [
    [0, -mid, len, fw], [0, mid, len, fw],           // arriba / abajo (a lo largo de X)
    [-mid, 0, fw, half * 2], [mid, 0, fw, half * 2],  // izquierda / derecha (a lo largo de Z)
  ];
  return (
    <group>
      {boxes.map(([px, pz, sx, sz], i) => (
        <mesh key={i} position={[px, y, pz]} material={mat} castShadow receiveShadow>
          <boxGeometry args={[sx, h, sz]} />
        </mesh>
      ))}
    </group>
  );
}

/* Rectángulo con esquinas redondeadas (THREE.Shape). */
function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* --------- Tablero: base de madera redondeada + superficie marfil --------- */
function GroundField({ layout }) {
  const surf = useMemo(() => makeBoardSurface(), []);

  const { pos, size } = useMemo(() => {
    const xs = layout.cells.map((c) => c.x), zs = layout.cells.map((c) => c.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const spanX = (maxX - minX) + CELL, spanZ = (maxZ - minZ) + CELL;
    const size = Math.max(spanX, spanZ) + 3.2;
    return { pos: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2], size };
  }, [layout]);

  // superficie marfil con esquinas redondeadas (UV remapeadas a 0..1)
  const creamGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedRectShape(size, size, size * 0.085), 16);
    g.computeBoundingBox();
    const bb = g.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
    const uv = g.attributes.uv, ps = g.attributes.position;
    for (let i = 0; i < ps.count; i++) uv.setXY(i, (ps.getX(i) - bb.min.x) / w, (ps.getY(i) - bb.min.y) / h);
    uv.needsUpdate = true;
    return g;
  }, [size]);

  // base/marco de madera redondeado (un poco más grande, con bisel)
  const baseGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRectShape(size + 2.4, size + 2.4, (size + 2.4) * 0.085),
      { depth: 0.38, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); g.computeBoundingBox(); g.translate(0, -g.boundingBox.max.y, 0);
    return g;
  }, [size]);

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* base de madera redondeada */}
      <mesh geometry={baseGeo} position={[0, 0.05, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cdb083" roughness={0.62} metalness={0} />
      </mesh>
      {/* superficie marfil (mate) con MÁSCARAS metálicas doradas (oro real) */}
      <mesh geometry={creamGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} receiveShadow>
        <meshStandardMaterial
          map={surf.map}
          metalnessMap={surf.metalnessMap} metalness={1}
          roughnessMap={surf.roughnessMap} roughness={1}
          bumpMap={surf.metalnessMap} bumpScale={0.014}
          envMapIntensity={0.55}
        />
      </mesh>
    </group>
  );
}

/* --------- Casilleros (baldosas de color, instanciados) --------- */
function BoardTiles({ layout, impact }) {
  const { scene } = useGLTF(MODELS.tile);
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const anims = useRef([]); // impactos activos: { index, t0 }

  const { geometry, height } = useMemo(() => {
    const base = normalizeToFoot(firstGeometry(scene), TILE_FOOT, false);
    return { geometry: addRimShade(base.geometry), height: base.height };
  }, [scene]);
  // Casilleros: plástico mate de juego de mesa (estilo Azul/Ticket to Ride).
  // roughness máximo → NADA de reflejo especular ("mojado"); metalness 0;
  // envMapIntensity 0 → SIN reflejo del entorno (nada "metálico").
  // vertexColors: borde ~12% más claro que el tope (volumen sin brillo).
  // AUTOILUMINACIÓN: three.js filtra las luces por CÁMARA, no por objeto, así
  // que no se puede tener una luz que ilumine solo los casilleros. En cambio,
  // se les suma un emissive proporcional a su PROPIO color (instanceColor, que
  // three funde en vColor) → colores vivos y legibles aunque la sala esté en
  // penumbra de atardecer, sin tocar la iluminación del resto de la escena.
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#ffffff", roughness: 1.0, metalness: 0.0, envMapIntensity: 0.0, vertexColors: true,
    });
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += vColor.rgb * 0.42;"
      );
    };
    return m;
  }, []);

  const setTile = (mesh, i, dy = 0) => {
    const c = layout.cells[i];
    dummy.position.set(c.x, 0.002 + dy, c.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };

  useLayoutEffect(() => {
    const mesh = ref.current; if (!mesh) return;
    layout.cells.forEach((cell, i) => { setTile(mesh, i, 0); mesh.setColorAt(i, new THREE.Color(CAT_META[colorAt(cell.n)].hex)); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [layout, geometry]);

  // API de impacto: al aterrizar una ficha, hundir+rebotar el casillero.
  if (impact) impact.hit = (x, z) => {
    let best = -1, bd = Infinity;
    layout.cells.forEach((c, i) => { const dx = c.x - x, dz = c.z - z; const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd < (CELL * 0.7) ** 2) anims.current.push({ index: best, t0: performance.now() / 1000 });
  };

  useFrame(() => {
    const mesh = ref.current; if (!mesh || anims.current.length === 0) return;
    const now = performance.now() / 1000;
    let changed = false;
    anims.current = anims.current.filter((a) => {
      const t = now - a.t0; const dy = tileImpact(t);
      setTile(mesh, a.index, dy); changed = true;
      if (t > 0.55) { setTile(mesh, a.index, 0); return false; }
      return true;
    });
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  });

  BoardTiles.tileHeight = height;
  return <instancedMesh ref={ref} args={[geometry, material, 60]} castShadow receiveShadow frustumCulled={false} />;
}

/* --------- SALIDA --------- */
function StartPad({ layout, surface }) {
  const { x, z } = layout.start;
  return (
    <mesh position={[x, surface + 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[CELL * 0.34, 6]} />
      <meshStandardMaterial color="#c9a15a" roughness={0.6} metalness={0.1} emissive="#6b4c14" emissiveIntensity={0.2} />
    </mesh>
  );
}

/* --------- Estrella de meta (casillero 60) --------- */
function FinishStar({ layout, surface }) {
  const cell = layout.cells[59];
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const spikes = 5, outer = 0.34, inner = 0.16;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    s.closePath(); return s;
  }, []);
  const geo = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 }), [shape]);
  return (
    <mesh geometry={geo} position={[cell.x, surface + 0.7, cell.z]} castShadow>
      <meshStandardMaterial color="#F5C518" emissive="#8a5e06" emissiveIntensity={0.4} roughness={0.3} metalness={0.4} />
    </mesh>
  );
}

/* --------- Salto por código (idle + jump con rebote) --------- */
function jumpProfile(p) {
  if (p < 0.15) { // anticipación: agacharse antes de despegar
    const k = p / 0.15;
    return { y: 0, sy: 1 - 0.22 * Math.sin(k * Math.PI * 0.5) };
  }
  if (p < 0.80) { // vuelo
    const t = (p - 0.15) / 0.65;
    const y = JUMP_H * Math.sin(t * Math.PI);
    let sy = 1 + 0.18 * Math.sin(t * Math.PI);   // estira en el aire
    if (t > 0.9) sy = 1 - 0.30 * ((t - 0.9) / 0.1); // aplasta al aterrizar (impacto marcado)
    return { y, sy };
  }
  // rebote final pequeño
  const t = (p - 0.80) / 0.20;
  const y = JUMP_H * 0.17 * Math.sin(t * Math.PI);
  const sy = 1 - 0.10 * (1 - Math.sin(t * Math.PI));
  return { y, sy };
}

function AnimatedPiece({ avatarId, targetX, targetZ, surface, active, moving, onLand }) {
  const group = useRef();
  const model = useRef();
  const dust = useRef();
  const dustMat = useRef();
  const s = useRef({
    x: targetX, z: targetZ, queue: [],
    jumping: false, from: { x: targetX, z: targetZ }, to: { x: targetX, z: targetZ }, t: 0,
    phase: Math.random() * Math.PI * 2, facing: 0, heading: 0, dustT: 999,
    turning: false, turnT: 0,
  }).current;
  const prev = useRef({ x: targetX, z: targetZ });

  useEffect(() => {
    if (prev.current.x !== targetX || prev.current.z !== targetZ) {
      s.queue.push({ x: targetX, z: targetZ });
      prev.current = { x: targetX, z: targetZ };
    }
  }, [targetX, targetZ]);

  useFrame((rf, dt) => {
    // Salta apenas hay un destino en cola y GIRA hacia la dirección DURANTE el
    // vuelo. Antes había una pausa de giro previa al salto que, en las esquinas,
    // trababa el movimiento y desincronizaba la cadencia (los pasos llegan cada
    // 680ms y el salto dura 680ms: no hay margen para pausas extra).
    if (!s.jumping && s.queue.length) {
      const nxt = s.queue[0];
      s.heading = Math.atan2(nxt.x - s.x, nxt.z - s.z);
      s.jumping = true; s.from = { x: s.x, z: s.z }; s.to = s.queue.shift(); s.t = 0;
    }
    if (s.jumping) {
      s.t += dt / JUMP_DUR; const p = Math.min(1, s.t);
      const e = p * p * (3 - 2 * p);
      s.x = s.from.x + (s.to.x - s.from.x) * e;
      s.z = s.from.z + (s.to.z - s.from.z) * e;
      const { y, sy } = jumpProfile(p);
      const sxz = 1 / Math.sqrt(sy);
      if (model.current) { model.current.position.y = y; model.current.scale.set(sxz, sy, sxz); }
      if (p >= 1) { s.jumping = false; s.x = s.to.x; s.z = s.to.z; if (model.current) { model.current.position.y = 0; model.current.scale.set(1, 1, 1); } s.dustT = 0; Sound.move(); if (onLand) onLand(s.to.x, s.to.z); }
    } else if (model.current) {
      // idle EXTREMADAMENTE sutil: respiración apenas perceptible, no distrae
      // la mirada del tablero (amplitud ~1/3 y velocidad menor que antes).
      const t = rf.clock.elapsedTime;
      const breathe = 1 + Math.sin(t * 1.5 + s.phase) * 0.008;
      model.current.position.y = Math.sin(t * 1.5 + s.phase) * 0.012;
      model.current.scale.set(1, breathe, 1);
    }
    // Giro: mira hacia la dirección mientras salta o quedan pasos; al terminar, al frente.
    const facingTarget = (s.jumping || s.queue.length > 0) ? s.heading : 0;
    let d = facingTarget - s.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    s.facing += d * (1 - Math.exp(-11 * dt));
    if (model.current) model.current.rotation.y = s.facing;
    if (group.current) group.current.position.set(s.x, surface, s.z);
    // polvo al aterrizar: un anillo que se expande y se desvanece
    if (s.dustT < 0.45) {
      s.dustT += dt; const q = s.dustT / 0.45;
      if (dust.current && dustMat.current) {
        dust.current.visible = true;
        dust.current.scale.setScalar(0.3 + q * 1.1);
        dustMat.current.opacity = 0.5 * (1 - q);
      }
    } else if (dust.current && dust.current.visible) { dust.current.visible = false; }
  });

  return (
    <group ref={group}>
      {/* halo del equipo activo, alrededor de la base */}
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[PIECE_SIZE * 0.6, PIECE_SIZE * 0.74, 40]} />
          <meshStandardMaterial color="#5FCF5B" emissive="#5FCF5B" emissiveIntensity={0.9} transparent opacity={0.92} />
        </mesh>
      )}
      {/* el modelo se apoya con su pedestal dentro de la base de color */}
      <group ref={model} position={[0, 0, 0]}>
        <Model url={modelForAvatar(avatarId)} targetSize={PIECE_SIZE} anchor="bottom" env={0.8} sat={0.12} />
      </group>
      {/* polvo de aterrizaje */}
      <mesh ref={dust} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.24, 0]} visible={false}>
        <ringGeometry args={[PIECE_SIZE * 0.42, PIECE_SIZE * 0.64, 24]} />
        <meshBasicMaterial ref={dustMat} color="#efe6d2" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Pieces({ teams, activeIndex, layout, surface, moving, impact }) {
  return (
    <group>
      {teams.map((t, i) => {
        const base = teamXZ(layout, t.position);
        const mates = teams.filter((tt) => tt.position === t.position);
        const k = mates.length;
        const myOrder = mates.findIndex((tt) => tt === t);
        const off = k > 1 ? (myOrder - (k - 1) / 2) * MATE_OFFSET : 0;
        return (
          <AnimatedPiece key={i} avatarId={t.avatarId} targetX={base.x + off} targetZ={base.z} surface={surface}
            active={i === activeIndex} moving={i === activeIndex && moving}
            onLand={(x, z) => impact && impact.hit && impact.hit(x, z)} />
        );
      })}
    </group>
  );
}

/* --------- Tablero completo --------- */
export function Board({ teams = [], activeIndex = 0, moving = false, layout: layoutProp }) {
  const layoutLocal = useMemo(() => buildBoardLayout(CELL), []);
  const layout = layoutProp || layoutLocal;
  const impact = useMemo(() => ({ hit: null }), []);

  // altura del casillero (para apoyar fichas justo sobre su tope)
  const { scene } = useGLTF(MODELS.tile);
  const tileHeight = useMemo(() => normalizeToFoot(firstGeometry(scene), TILE_FOOT, false).height, [scene]);
  const surface = tileHeight + 0.002; // las fichas se apoyan sobre el tope del casillero

  return (
    <group>
      <GroundField layout={layout} />
      <BoardTiles layout={layout} impact={impact} />
      <StartPad layout={layout} surface={surface} />
      <FinishStar layout={layout} surface={surface} />
      <Pieces teams={teams} activeIndex={activeIndex} layout={layout} surface={surface} moving={moving} impact={impact} />
    </group>
  );
}
