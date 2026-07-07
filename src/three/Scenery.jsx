import React, { useMemo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CELL } from "./boardLayout.js";

/* Fondo procedural: habitación cálida y moderna, MUY desenfocada
   (bokeh), como si el tablero estuviera sobre una mesa en una casa.
   Sin objetos reconocibles; solo ambiente. */
function makeRoomBackground() {
  const W = 2048, H = 1024;
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  // habitación clara y cálida de atardecer (pared arriba → mesa de madera abajo)
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#d8b48a"); g.addColorStop(0.42, "#c79a6e"); g.addColorStop(0.72, "#a97a54"); g.addColorStop(1, "#7c5638");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // VENTANA con luz de atardecer (a un lado, muy suave)
  const wx = W * 0.60, wy = H * 0.10, ww = W * 0.30, wh = H * 0.40;
  x.save();
  x.filter = "blur(48px)";
  x.fillStyle = "rgba(255,196,128,.55)"; x.fillRect(wx - 60, wy - 60, ww + 120, wh + 120);
  x.filter = "blur(10px)";
  let wg = x.createLinearGradient(0, wy, 0, wy + wh);
  wg.addColorStop(0, "#fff2d4"); wg.addColorStop(0.5, "#ffd79a"); wg.addColorStop(1, "#ffab73");
  x.fillStyle = wg; x.fillRect(wx, wy, ww, wh);
  // marco/cruz de la ventana (tenue)
  x.filter = "blur(4px)"; x.strokeStyle = "rgba(90,58,38,.5)"; x.lineWidth = 10; x.strokeRect(wx, wy, ww, wh);
  x.lineWidth = 7; x.beginPath();
  x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh);
  x.moveTo(wx, wy + wh / 2); x.lineTo(wx + ww, wy + wh / 2); x.stroke();
  x.restore();
  // bokeh cálido, luminoso y muy desenfocado
  x.filter = "blur(26px)";
  const cols = [[255, 214, 150], [244, 186, 120], [216, 156, 100], [255, 226, 170], [200, 150, 110], [235, 190, 140]];
  for (let i = 0; i < 42; i++) {
    const bx = Math.random() * W, by = Math.random() * H * 0.85, r = 70 + Math.random() * 240;
    const col = cols[i % cols.length];
    const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.2 + Math.random() * 0.16})`);
    rg.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    x.fillStyle = rg; x.beginPath(); x.arc(bx, by, r, 0, Math.PI * 2); x.fill();
  }
  x.filter = "none";
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function WarmRoomBackground() {
  const { scene } = useThree();
  useEffect(() => {
    const tex = makeRoomBackground();
    const prev = scene.background;
    scene.background = tex;
    return () => { scene.background = prev; tex.dispose(); };
  }, [scene]);
  return null;
}

/* ============================================================
   ESCENARIO — estructura del entorno alrededor del tablero.
   Deja preparada la arquitectura para incorporar más adelante
   decoraciones (árboles, faroles, bancos, piedras, flores,
   arbustos, carteles) y un fondo inmersivo, SIN rediseñar la
   escena. Hoy: base ambiental + grupos/slots vacíos listos.
   ============================================================ */

/* Bordes del área del tablero (en mundo). */
function boardBounds(layout) {
  const xs = layout.cells.map((c) => c.x), zs = layout.cells.map((c) => c.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}

/* Puntos preparados alrededor del tablero para futuras props.
   Cada slot: { pos:[x,y,z], zona:'exterior' }. Poblar luego con
   <Decoration position={slot.pos} tipo="arbol|farol|..." />. */
export function decorationSlots(layout) {
  const { minX, maxX, minZ, maxZ } = boardBounds(layout);
  const m = 2.2 * CELL; // margen exterior
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const xs = [minX - m, cx, maxX + m], zs = [minZ - m, cz, maxZ + m];
  const slots = [];
  for (const sx of xs) for (const sz of zs) {
    if (sx === cx && sz === cz) continue; // el centro es del tablero
    slots.push({ pos: [sx, 0, sz], zona: "exterior" });
  }
  return slots;
}

/* Base ambiental: suelo grande alrededor del parquet + neblina de
   borde, para que el tablero se sienta dentro de un entorno mayor
   (y no flotando). Reemplazable luego por un escenario completo. */
function EnvironmentBase({ layout }) {
  const { minX, maxX, minZ, maxZ } = boardBounds(layout);
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  return (
    <group name="environment-base">
      {/* mesa de madera cálida y clara, apenas por debajo del tablero */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.08, cz]} receiveShadow>
        <circleGeometry args={[70, 48]} />
        <meshStandardMaterial color="#8a6440" roughness={0.9} metalness={0} />
      </mesh>
      {/* aro perimetral suave (transición tablero → mesa) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.04, cz]}>
        <ringGeometry args={[Math.max(maxX - minX, maxZ - minZ) * 0.62, Math.max(maxX - minX, maxZ - minZ) * 0.62 + 3.5, 64]} />
        <meshStandardMaterial color="#9a744e" roughness={0.9} metalness={0} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* --------- Props sobre la mesa (juegos alrededor del tablero) ---------
   Piezas simples con primitivas: dan vida al entorno sin pesar.
   NOTA: son placeholders; se pueden reemplazar por GLB dedicados. */
function JengaTower({ pos = [0, 0, 0], rot = 0 }) {
  const layers = 8, bw = 1.7, bh = 0.32, bd = 0.55, gap = 0.03, items = [];
  for (let l = 0; l < layers; l++) {
    const y = bh / 2 + l * bh, horiz = l % 2 === 0;
    for (let k = -1; k <= 1; k++) {
      const px = horiz ? 0 : k * (bd + gap), pz = horiz ? k * (bd + gap) : 0;
      const sx = horiz ? bw : bd, sz = horiz ? bd : bw;
      items.push(
        <mesh key={`${l}-${k}`} position={[px, y, pz]} castShadow receiveShadow>
          <boxGeometry args={[sx, bh, sz]} />
          <meshStandardMaterial color={(l + k) % 2 ? "#d3a468" : "#c1904f"} roughness={0.85} />
        </mesh>
      );
    }
  }
  return <group position={pos} rotation={[0, rot, 0]}>{items}</group>;
}
function TableDice({ pos = [0, 0, 0], rot = 0 }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.35, 0]} rotation={[0.3, 0.5, 0]} castShadow><boxGeometry args={[0.7, 0.7, 0.7]} /><meshStandardMaterial color="#f6ecd6" roughness={0.5} /></mesh>
      <mesh position={[0.95, 0.32, 0.55]} rotation={[0.6, 1.1, 0.2]} castShadow><boxGeometry args={[0.64, 0.64, 0.64]} /><meshStandardMaterial color="#e24b4b" roughness={0.5} /></mesh>
    </group>
  );
}
function CardsStack({ pos = [0, 0, 0], rot = 0 }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.26, 2.1]} /><meshStandardMaterial color="#f7efe0" roughness={0.6} /></mesh>
      <mesh position={[1.35, 0.03, 0.35]} rotation={[0, -0.5, 0]} castShadow><boxGeometry args={[1.5, 0.05, 2.1]} /><meshStandardMaterial color="#6f52c2" roughness={0.6} /></mesh>
      <mesh position={[2.05, 0.04, -0.45]} rotation={[0, 0.3, 0]} castShadow><boxGeometry args={[1.5, 0.05, 2.1]} /><meshStandardMaterial color="#8869d8" roughness={0.6} /></mesh>
    </group>
  );
}
function DeskDoodles({ pos = [0, 0, 0], rot = 0 }) {
  const pencils = [["#e6b422", 0.0], ["#d1495b", 0.16], ["#3a86ff", -0.14]];
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow><planeGeometry args={[3, 4]} /><meshStandardMaterial color="#f3ecdd" roughness={0.9} /></mesh>
      {pencils.map(([col, rz], i) => (
        <mesh key={i} position={[-0.6 + i * 0.6, 0.11, 0.5]} rotation={[0, 0, Math.PI / 2 + rz]} castShadow><cylinderGeometry args={[0.09, 0.09, 3, 8]} /><meshStandardMaterial color={col} roughness={0.5} /></mesh>
      ))}
    </group>
  );
}
function TableProps({ layout }) {
  const { minX, maxX, minZ, maxZ } = boardBounds(layout);
  return (
    <group name="table-props" position={[0, -0.04, 0]}>
      <JengaTower pos={[minX - 6, 0, maxZ - 3]} rot={0.35} />
      <TableDice pos={[minX - 4.5, 0, maxZ - 8.5]} rot={0.6} />
      <CardsStack pos={[maxX + 4, 0, minZ + 5]} rot={-0.45} />
      <DeskDoodles pos={[maxX + 5.5, 0, maxZ - 6]} rot={-0.5} />
    </group>
  );
}

export function Scenery({ layout }) {
  const slots = useMemo(() => decorationSlots(layout), [layout]);
  return (
    <group name="scenery">
      <WarmRoomBackground />
      <EnvironmentBase layout={layout} />
      <TableProps layout={layout} />
      {/* Capa de decoraciones — lista para poblar con más props.
          slots disponibles: {slots.length} (perímetro del tablero). */}
      <group name="decorations" userData={{ slots }} />
    </group>
  );
}
