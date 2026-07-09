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


/* --------- Rincón acogedor: sillón + mesa + lámpara con luz cálida ---------
   Muebles estilizados (primitivas) detrás del tablero, para que la escena
   se sienta como un living al atardecer. La lámpara emite luz cálida real.
   NOTA: son placeholders; se pueden reemplazar por GLB dedicados. */
function Sofa({ pos = [0, 0, 0] }) {
  const fabric = "#b06a44", cushion = "#c78a63", wood = "#5c3d27";
  return (
    <group position={pos}>
      {/* asiento */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow><boxGeometry args={[17, 1.8, 6.5]} /><meshStandardMaterial color={fabric} roughness={0.95} /></mesh>
      {/* respaldo */}
      <mesh position={[0, 3.6, -2.9]} castShadow receiveShadow><boxGeometry args={[17, 4.4, 1.4]} /><meshStandardMaterial color={fabric} roughness={0.95} /></mesh>
      {/* apoyabrazos */}
      {[-8.3, 8.3].map((x) => (
        <mesh key={x} position={[x, 2.4, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 3.4, 6.5]} /><meshStandardMaterial color={fabric} roughness={0.95} /></mesh>
      ))}
      {/* almohadones */}
      {[-5.4, 0, 5.4].map((x) => (
        <mesh key={x} position={[x, 2.3, 0.3]} castShadow><boxGeometry args={[4.9, 1.3, 5]} /><meshStandardMaterial color={cushion} roughness={0.95} /></mesh>
      ))}
      {/* patas */}
      {[[-7.6, -2.4], [7.6, -2.4], [-7.6, 2.4], [7.6, 2.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow><cylinderGeometry args={[0.35, 0.28, 0.7, 10]} /><meshStandardMaterial color={wood} roughness={0.7} /></mesh>
      ))}
    </group>
  );
}
function LampTable({ pos = [0, 0, 0] }) {
  const wood = "#6e4a2f";
  return (
    <group position={pos}>
      {/* mesita redonda */}
      <mesh position={[0, 3.1, 0]} castShadow receiveShadow><cylinderGeometry args={[2.4, 2.4, 0.35, 24]} /><meshStandardMaterial color={wood} roughness={0.6} /></mesh>
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]} castShadow><cylinderGeometry args={[0.2, 0.2, 3, 8]} /><meshStandardMaterial color={wood} roughness={0.6} /></mesh>
      ))}
      {/* lámpara: base + fuste + pantalla emisiva + luz cálida */}
      <mesh position={[0, 3.7, 0]} castShadow><cylinderGeometry args={[0.7, 0.9, 0.5, 16]} /><meshStandardMaterial color="#4a3524" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 5.2, 0]} castShadow><cylinderGeometry args={[0.12, 0.12, 2.6, 8]} /><meshStandardMaterial color="#4a3524" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 6.9, 0]}><cylinderGeometry args={[1.15, 1.7, 2.1, 24, 1, true]} /><meshStandardMaterial color="#ffe0ad" emissive="#ffb85e" emissiveIntensity={0.9} roughness={0.6} side={THREE.DoubleSide} /></mesh>
      {/* luz cálida de la lámpara */}
      <pointLight position={[0, 6.8, 0]} color="#ffca82" intensity={55} distance={46} decay={2} castShadow={false} />
    </group>
  );
}
function CozyRoom({ layout }) {
  const { minZ } = boardBounds(layout);
  // detrás del tablero (-z): aparece en la parte alta de la vista vertical
  return (
    <group name="cozy-room">
      <Sofa pos={[-1, 0, minZ - 11]} />
      <LampTable pos={[13.5, 0, minZ - 5]} />
    </group>
  );
}

export function Scenery({ layout }) {
  const slots = useMemo(() => decorationSlots(layout), [layout]);
  return (
    <group name="scenery">
      <WarmRoomBackground />
      <EnvironmentBase layout={layout} />
      <CozyRoom layout={layout} />
      {/* Capa de decoraciones — vacía por ahora, lista para poblar.
          slots disponibles: {slots.length} (perímetro del tablero). */}
      <group name="decorations" userData={{ slots }} />
    </group>
  );
}
