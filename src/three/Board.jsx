import React, { useMemo, useLayoutEffect, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MODELS, modelForAvatar } from "./models.js";
import { Model } from "./Model.jsx";
import { buildBoardLayout, teamXZ, CELL } from "./boardLayout.js";
import { CAT_META, colorAt } from "../game/constants.js";
import masksUrl from "../../Mascaras.teatro.png";

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
const PIECE_SIZE = 1.4;          // alto de las fichas (protagonistas)
const MATE_OFFSET = 0.5;         // separación de fichas en el mismo casillero
const GROUND_MARGIN = 3;         // celdas de suelo extra alrededor (para decoraciones futuras)

/* Salto: lento y cinematográfico (~50% más lento) */
const JUMP_H = 0.75;
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

/* --------- Emblema de máscaras (PNG): recorta el fondo rosa dejando
   solo el dorado. El dorado tiene G-B alto; el rosa/oscuro no. --------- */
function processEmblem(img) {
  const iw = img.width, ih = img.height;
  const t = document.createElement("canvas"); t.width = iw; t.height = ih;
  const tx = t.getContext("2d"); tx.drawImage(img, 0, 0);
  const im = tx.getImageData(0, 0, iw, ih); const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i + 1], b = d[i + 2];
    let a = (g - b - 26) / 34;              // dorado/naranja → opaco; rosa/oscuro → 0
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    if (g < 95) a = 0;                      // descarta tonos oscuros
    d[i + 3] = Math.round(d[i + 3] * a);
  }
  tx.putImageData(im, 0, 0);
  return t;
}

/* --------- Textura del tablero premium: lila claro + anillos dorados
   + emblema de máscaras (doradas) al centro. --------- */
function makeBoardSurface() {
  const S = 1024; const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
  // base radial lila (clara y cálida)
  let g = x.createRadialGradient(S / 2, S * 0.44, S * 0.06, S / 2, S / 2, S * 0.75);
  g.addColorStop(0, "#a487ec"); g.addColorStop(0.55, "#8869d8"); g.addColorStop(1, "#6f52c2");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // viñeta muy suave (no oscurece de más)
  g = x.createRadialGradient(S / 2, S / 2, S * 0.44, S / 2, S / 2, S * 0.76);
  g.addColorStop(0, "rgba(45,25,90,0)"); g.addColorStop(1, "rgba(45,25,90,.26)");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // anillos concéntricos DORADOS (resaltan)
  for (let idx = 0, r = S * 0.15; r < S * 0.56; r += 30, idx++) {
    x.beginPath(); x.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    x.strokeStyle = idx % 2 ? "rgba(245,197,24,.16)" : "rgba(247,201,44,.32)";
    x.lineWidth = idx % 2 ? 2 : 4; x.stroke();
  }
  // resplandor cálido central (atardecer)
  g = x.createRadialGradient(S / 2, S * 0.44, 0, S / 2, S / 2, S * 0.42);
  g.addColorStop(0, "rgba(255,226,172,.16)"); g.addColorStop(1, "rgba(255,226,172,0)");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // emblema de máscaras — se carga async, se recorta y se dibuja al centro
  const img = new Image();
  img.onload = () => {
    const em = processEmblem(img);
    const w = S * 0.62, h = w * (img.height / img.width);
    x.save();
    x.shadowColor = "rgba(60,20,10,.4)"; x.shadowBlur = 22; x.shadowOffsetY = 6;
    x.drawImage(em, S / 2 - w / 2, S / 2 - h / 2, w, h);
    x.restore();
    tex.needsUpdate = true;
  };
  img.src = masksUrl;
  return tex;
}

/* --------- Suelo: superficie premium del tablero --------- */
function GroundField({ layout }) {
  const tex = useMemo(() => makeBoardSurface(), []);

  const { pos, size } = useMemo(() => {
    const xs = layout.cells.map((c) => c.x), zs = layout.cells.map((c) => c.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const w = (maxX - minX) + (2 * GROUND_MARGIN + 1) * CELL;
    const d = (maxZ - minZ) + (2 * GROUND_MARGIN + 1) * CELL;
    return { pos: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2], size: Math.max(w, d) };
  }, [layout]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos[0], 0, pos[2]]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={tex} roughness={0.62} metalness={0.05} envMapIntensity={0.22} />
    </mesh>
  );
}

/* --------- Casilleros (baldosas de color, instanciados) --------- */
function BoardTiles({ layout, impact }) {
  const { scene } = useGLTF(MODELS.tile);
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const anims = useRef([]); // impactos activos: { index, t0 }

  const { geometry, height } = useMemo(() => normalizeToFoot(firstGeometry(scene), TILE_FOOT, false), [scene]);
  // Plástico premium mate-satinado: SIN environment (envMapIntensity 0) y
  // bastante rugoso → los colores nunca se lavan a blanco por reflejos.
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.72, metalness: 0.0, envMapIntensity: 0.0 }), []);

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
  }).current;
  const prev = useRef({ x: targetX, z: targetZ });

  useEffect(() => {
    if (prev.current.x !== targetX || prev.current.z !== targetZ) {
      s.queue.push({ x: targetX, z: targetZ });
      prev.current = { x: targetX, z: targetZ };
    }
  }, [targetX, targetZ]);

  useFrame((rf, dt) => {
    if (!s.jumping && s.queue.length) {
      s.jumping = true; s.from = { x: s.x, z: s.z }; s.to = s.queue.shift(); s.t = 0;
      // mira hacia la dirección del próximo casillero
      s.heading = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z);
    }
    if (s.jumping) {
      s.t += dt / JUMP_DUR; const p = Math.min(1, s.t);
      const e = p * p * (3 - 2 * p);
      s.x = s.from.x + (s.to.x - s.from.x) * e;
      s.z = s.from.z + (s.to.z - s.from.z) * e;
      const { y, sy } = jumpProfile(p);
      const sxz = 1 / Math.sqrt(sy);
      if (model.current) { model.current.position.y = y; model.current.scale.set(sxz, sy, sxz); }
      if (p >= 1) { s.jumping = false; s.x = s.to.x; s.z = s.to.z; if (model.current) { model.current.position.y = 0; model.current.scale.set(1, 1, 1); } s.dustT = 0; if (onLand) onLand(s.to.x, s.to.z); }
    } else if (model.current) {
      const t = rf.clock.elapsedTime;
      const breathe = 1 + Math.sin(t * 2.1 + s.phase) * 0.02;
      model.current.position.y = Math.sin(t * 2.1 + s.phase) * 0.03;
      model.current.scale.set(1, breathe, 1);
    }
    // Giro: la ficha mira hacia la dirección del próximo casillero; en reposo, a la cámara.
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
