import React, { Suspense, useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EnvironmentProps } from "./EnvironmentProps.jsx";

/* ============================================================
   ESCENARIO — entorno del archivo (envoirment3.0.glb) + una sala
   de estar sencilla CONSTRUIDA ALREDEDOR (sin tocar el GLB):
   piso de parquet, 4 paredes crema con zócalos, dos ventanas con
   cielo de atardecer, cuadros, un estante y un reloj. Geometría
   simple + texturas en canvas: liviano para móvil.

   Medidas en coordenadas de MUNDO (la mesa tiene la tapa en y=0):
   piso ≈ -17.6, mesa x±32.6 z±18.3, living hasta z≈-80.
   ============================================================ */

const FLOOR_Y = -17.6;
const ROOM_X = 46;            // paredes laterales en x = ±ROOM_X
const BACK_Z = -90;           // pared del fondo (detrás del living)
const FRONT_Z = 46;           // pared frontal (detrás de la cámara)
const WALL_TOP = 33;          // altura superior de las paredes
const WALL_H = WALL_TOP - FLOOR_Y;
const WALL_CY = (WALL_TOP + FLOOR_Y) / 2;
const BACK_LEN = ROOM_X * 2;
const SIDE_LEN = FRONT_Z - BACK_Z;
const SIDE_CZ = (BACK_Z + FRONT_Z) / 2;

/* ---------- Texturas ---------- */
/* Parquet moderno de madera clara: tablas trabadas, vetas suaves, mate. */
function makeParquetTexture() {
  const S = 512; const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
  const rows = 7, plankH = S / rows;
  // roble claro / parquet nórdico: tablas rubias y claritas
  const tones = ["#ecdcc0", "#f0e3ca", "#e7d5b6", "#f3e8d2", "#eaddc0", "#efe4ca", "#e4d3b2"];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * (S / 5);   // traba entre filas
    for (let k = -1; k < 6; k++) {
      const px = k * (S / 5) + off, py = row * plankH, pw = S / 5;
      x.fillStyle = tones[(row * 3 + k * 2 + 9) % tones.length];
      x.fillRect(px, py, pw, plankH);
      // vetas suaves
      for (let v = 0; v < 6; v++) {
        x.strokeStyle = `rgba(120,90,55,${0.04 + Math.random() * 0.06})`; x.lineWidth = 0.6;
        x.beginPath(); const vy = py + 4 + Math.random() * (plankH - 8);
        x.moveTo(px + 2, vy); x.bezierCurveTo(px + pw * 0.33, vy + (Math.random() - 0.5) * 4, px + pw * 0.66, vy + (Math.random() - 0.5) * 4, px + pw - 2, vy); x.stroke();
      }
      // reflejo tenue de fibra
      x.strokeStyle = "rgba(245,228,196,0.10)"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(px + 2, py + plankH * 0.4); x.lineTo(px + pw - 2, py + plankH * 0.4 + (Math.random() - 0.5) * 3); x.stroke();
      // junta suave entre tablas (tenue, para no ensuciar el tono claro)
      x.strokeStyle = "rgba(120,92,58,0.16)"; x.lineWidth = 1; x.strokeRect(px, py, pw, plankH);
    }
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 9); tex.anisotropy = 8;
  return tex;
}
function makeWallPaintTexture() {
  const S = 512; const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, "#efe7d8"); g.addColorStop(1, "#e2d6c2");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(120,100,70,${Math.random() * 0.02})`; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeWindowSkyTexture() {
  const W = 512, H = 640; const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#ffe7b8"); g.addColorStop(0.45, "#ffb877"); g.addColorStop(0.75, "#e58a5c"); g.addColorStop(1, "#8a5a72");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const sunX = W * 0.62, sunY = H * 0.4;
  let rg = x.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
  rg.addColorStop(0, "rgba(255,244,214,.95)"); rg.addColorStop(1, "rgba(255,244,214,0)");
  x.fillStyle = rg; x.beginPath(); x.arc(sunX, sunY, 150, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#fff7e0"; x.beginPath(); x.arc(sunX, sunY, 46, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgba(255,255,255,.25)";
  for (const [cx, cy, r] of [[120, 120, 60], [210, 155, 40], [90, 430, 50], [190, 470, 68]]) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.5, 0, 0, Math.PI * 2); x.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeFrameArtTexture(seed) {
  const S = 256; const c = document.createElement("canvas"); c.width = S; c.height = S; const x = c.getContext("2d");
  const palettes = [["#6F49E8", "#8458FF", "#F6C93E"], ["#5AB44E", "#F5B429", "#E24B4B"], ["#2E8FD4", "#8458FF", "#F6C93E"]];
  const pal = palettes[seed % palettes.length];
  x.fillStyle = "#F8F1E0"; x.fillRect(0, 0, S, S);
  let rnd = seed * 91 + 7; const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 5; i++) { x.fillStyle = pal[i % pal.length]; x.globalAlpha = 0.75; x.beginPath(); x.ellipse(rand() * S, rand() * S, 40 + rand() * 60, 30 + rand() * 50, rand() * Math.PI, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* Fondo cálido tenue (evita el vacío negro por encima de las paredes). */
function WarmRoomBackground() {
  const { scene } = useThree();
  useEffect(() => {
    const cnv = document.createElement("canvas"); cnv.width = 4; cnv.height = 256; const cx = cnv.getContext("2d");
    const g = cx.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, "#d9c2c8"); g.addColorStop(1, "#7c6478");
    cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(cnv); tex.colorSpace = THREE.SRGBColorSpace; tex.mapping = THREE.EquirectangularReflectionMapping;
    const prev = scene.background; scene.background = tex;
    return () => { scene.background = prev; tex.dispose(); };
  }, [scene]);
  return null;
}

/* ---------- Piezas de decoración ---------- */
function FramePicture({ position, rotationY = 0, w = 12, h = 15, tex, frame = "#1f1d24" }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* marco (negro moderno o madera oscura) con leve bisel */}
      <mesh position={[0, 0, -0.18]} castShadow><boxGeometry args={[w + 1.8, h + 1.8, 0.6]} /><meshStandardMaterial color={frame} roughness={0.5} metalness={0.15} /></mesh>
      {/* passe-partout claro */}
      <mesh position={[0, 0, 0.1]}><planeGeometry args={[w + 0.6, h + 0.6]} /><meshStandardMaterial color="#f4efe4" roughness={0.9} /></mesh>
      <mesh position={[0, 0, 0.16]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>
    </group>
  );
}
function WindowTrim({ w, h, thickness = 2.2, color = "#f3ead9" }) {
  const strips = [
    [0, h / 2 + thickness / 2, w + thickness * 2, thickness],
    [0, -h / 2 - thickness / 2, w + thickness * 2, thickness],
    [-w / 2 - thickness / 2, 0, thickness, h],
    [w / 2 + thickness / 2, 0, thickness, h],
  ];
  return (
    <group>
      {strips.map(([px, py, sx, sy], i) => (
        <mesh key={i} position={[px, py, 0.2]} castShadow><boxGeometry args={[sx, sy, 0.6]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      ))}
      <mesh position={[0, 0, 0.15]}><boxGeometry args={[w, 0.7, 0.4]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      <mesh position={[0, 0, 0.15]}><boxGeometry args={[0.7, h, 0.4]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
    </group>
  );
}
function WallClock({ position }) {
  return (
    <group position={position}>
      <mesh castShadow><cylinderGeometry args={[4.2, 4.2, 0.6, 28]} /><meshStandardMaterial color="#efe7d8" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[3.6, 3.6, 0.1, 28]} /><meshStandardMaterial color="#fffdf7" roughness={0.4} /></mesh>
      <mesh position={[0, 1.1, 0.4]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 2.8, 8]} /><meshStandardMaterial color="#2a2233" /></mesh>
      <mesh position={[0.9, 0, 0.4]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.14, 0.14, 3.6, 8]} /><meshStandardMaterial color="#2a2233" /></mesh>
    </group>
  );
}
function Shelf({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[24, 1.1, 5]} /><meshStandardMaterial color="#8a5a34" roughness={0.6} /></mesh>
      {[["#6F49E8", -7.5], ["#5AB44E", -3], ["#E24B4B", 1.5], ["#F5B429", 6]].map(([col, px], i) => (
        <mesh key={i} position={[px, 3.2, 0]} castShadow><boxGeometry args={[1.3, 5 - (i % 2), 3.4]} /><meshStandardMaterial color={col} roughness={0.55} /></mesh>
      ))}
    </group>
  );
}
function Baseboard({ length, position, rotationY = 0 }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} receiveShadow>
      <boxGeometry args={[length, 3, 1.2]} /><meshStandardMaterial color="#f3ead9" roughness={0.7} />
    </mesh>
  );
}
function PlainWall({ position, rotationY, length, tex, children }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[length, WALL_H]} />
        <meshStandardMaterial map={tex} roughness={0.96} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
}
/* Pared con hueco de ventana (ShapeGeometry) + cielo detrás. */
function WindowWall({ position, rotationY, length, tex, skyTex, winW, winH, winX, winY, children }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-length / 2, -WALL_H / 2); s.lineTo(length / 2, -WALL_H / 2);
    s.lineTo(length / 2, WALL_H / 2); s.lineTo(-length / 2, WALL_H / 2); s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(winX - winW / 2, winY - winH / 2); hole.lineTo(winX + winW / 2, winY - winH / 2);
    hole.lineTo(winX + winW / 2, winY + winH / 2); hole.lineTo(winX - winW / 2, winY + winH / 2); hole.closePath();
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s);
  }, [length, winW, winH, winX, winY]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.96} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[winX, winY, -1]}><planeGeometry args={[winW + 2, winH + 2]} /><meshBasicMaterial map={skyTex} /></mesh>
      <group position={[winX, winY, 0]}><WindowTrim w={winW} h={winH} /></group>
      {children}
    </group>
  );
}

function RoomBackdrop() {
  const parquet = useMemo(() => makeParquetTexture(), []);
  const wallTex = useMemo(() => makeWallPaintTexture(), []);
  const skyA = useMemo(() => makeWindowSkyTexture(), []);
  const skyB = useMemo(() => makeWindowSkyTexture(), []);
  const arts = [useMemo(() => makeFrameArtTexture(0), []), useMemo(() => makeFrameArtTexture(1), []), useMemo(() => makeFrameArtTexture(2), []), useMemo(() => makeFrameArtTexture(3), [])];
  const baseY = FLOOR_Y + 1.5;
  return (
    <group name="room">
      {/* PISO de parquet de madera clara (mate) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, SIDE_CZ]} receiveShadow>
        <planeGeometry args={[BACK_LEN + 8, SIDE_LEN + 8]} />
        <meshStandardMaterial map={parquet} roughness={0.82} metalness={0} envMapIntensity={0.12} />
      </mesh>

      {/* PARED DEL FONDO: ventana GRANDE (detrás del sofá, entra luz) + cuadro + reloj */}
      <WindowWall position={[0, WALL_CY, BACK_Z]} rotationY={0} length={BACK_LEN} tex={wallTex} skyTex={skyA}
        winW={56} winH={36} winX={-2} winY={2}>
        <FramePicture position={[35, 6, 0.1]} w={12} h={15} tex={arts[0]} frame="#3a2a1c" />
        <WallClock position={[35, -13, 0.4]} />
      </WindowWall>

      {/* PARED IZQUIERDA: ventana + cuadro */}
      <WindowWall position={[-ROOM_X, WALL_CY, SIDE_CZ]} rotationY={Math.PI / 2} length={SIDE_LEN} tex={wallTex} skyTex={skyB}
        winW={40} winH={30} winX={-28} winY={3}>
        <FramePicture position={[22, 7, 0.1]} w={12} h={14} tex={arts[2]} />
      </WindowWall>

      {/* PARED DERECHA: cuadros + estante */}
      <PlainWall position={[ROOM_X, WALL_CY, SIDE_CZ]} rotationY={-Math.PI / 2} length={SIDE_LEN} tex={wallTex}>
        <FramePicture position={[-22, 8, 0.1]} w={12} h={14} tex={arts[1]} />
        <FramePicture position={[-4, 9, 0.1]} w={9} h={9} tex={arts[3]} frame="#3a2a1c" />
        <Shelf position={[16, -1, 2.6]} />
      </PlainWall>

      {/* PARED FRONTAL (detrás de la cámara; cierra la sala) */}
      <PlainWall position={[0, WALL_CY, FRONT_Z]} rotationY={Math.PI} length={BACK_LEN} tex={wallTex} />

      {/* ZÓCALOS */}
      <Baseboard length={BACK_LEN} position={[0, baseY, BACK_Z + 0.6]} />
      <Baseboard length={SIDE_LEN} position={[-ROOM_X + 0.6, baseY, SIDE_CZ]} rotationY={Math.PI / 2} />
      <Baseboard length={SIDE_LEN} position={[ROOM_X - 0.6, baseY, SIDE_CZ]} rotationY={Math.PI / 2} />
    </group>
  );
}

/* React.memo: la sala/muebles son estáticos (solo dependen de `layout`, que es
   estable). Evita reconciliar todo este árbol cuando el HUD/dado provocan
   re-renders del GameCanvas (p. ej. el parpadeo del dado) → menos micro-tirones. */
export const Scenery = React.memo(function Scenery({ layout }) {
  return (
    <group name="scenery">
      <WarmRoomBackground />
      <RoomBackdrop />
      <Suspense fallback={null}>
        <EnvironmentProps />
      </Suspense>
    </group>
  );
});
