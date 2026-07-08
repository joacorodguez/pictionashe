import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { teamXZ } from "./boardLayout.js";
import { cameraBus } from "./cameraBus.js";

/* ============================================================
   CÁMARA CINEMATOGRÁFICA (perspectiva) manejada por cameraBus.
   La lógica pide un encuadre; la cámara va suave y, cuando llega,
   avisa (markArrived) para que la secuencia continúe. Ninguna
   acción arranca mientras la cámara se mueve.
   Encuadres pensados para PANTALLA VERTICAL (celular):
   - MAIN: vista principal del tablero (todo el circuito).
   - DICE_REVEAL: acercamiento cenital al dado (se lee la cara).
   - CHASE: sigue de cerca a la ficha activa durante el salto.
   - OVERVIEW: botón manual "vista general".
   Cada encuadre define offset [x,y,z], FOV y a qué mira (focus).
   ============================================================ */

const VIEWS = {
  MAIN:        { off: [0, 25, 31], fov: 46, focus: "center" },
  DICE_REVEAL: { off: [0, 8.5, 10], fov: 30, focus: "center" },
  CHASE:       { off: [0, 11.5, 16], fov: 42, focus: "active" },
  OVERVIEW:    { off: [0, 34, 47], fov: 47, focus: "center" },
};

const PAN_LIMIT = 6;      // límite del arrastre manual (no pierde el tablero)
const LOOK_Y = 0.4;

export function CameraRig({ layout, teams, activeIndex, overview }) {
  const { camera, gl } = useThree();
  const off = useRef(new THREE.Vector3(...VIEWS.MAIN.off));
  const tgt = useRef(new THREE.Vector3(0, LOOK_Y, 0));   // punto que sigue el encuadre
  const look = useRef(new THREE.Vector3(0, LOOK_Y, 0));  // hacia dónde mira (suavizado)
  const fov = useRef(VIEWS.MAIN.fov);
  const pan = useRef({ x: 0, z: 0, tx: 0, tz: 0, dragging: false, lx: 0, ly: 0, moved: 0 });

  // arrastre con el dedo/mouse para mirar el tablero
  useEffect(() => {
    const el = gl.domElement;
    const down = (e) => { const p = pan.current; p.dragging = true; p.lx = e.clientX; p.ly = e.clientY; p.moved = 0; };
    const move = (e) => {
      const p = pan.current; if (!p.dragging) return;
      const dx = e.clientX - p.lx, dy = e.clientY - p.ly; p.lx = e.clientX; p.ly = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
      const sc = 0.028;
      p.tx = THREE.MathUtils.clamp(p.tx - dx * sc, -PAN_LIMIT, PAN_LIMIT);
      p.tz = THREE.MathUtils.clamp(p.tz - dy * sc, -PAN_LIMIT, PAN_LIMIT);
    };
    const up = () => { pan.current.dragging = false; };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [gl]);

  useFrame((_, dt) => {
    dt = Math.min(dt, 1 / 30);
    // encuadre pedido: el botón "vista general" tiene prioridad manual
    const key = overview ? "OVERVIEW" : (VIEWS[cameraBus.state] ? cameraBus.state : "MAIN");
    const view = VIEWS[key];

    // punto a seguir según el encuadre
    let fx = 0, fz = 0;
    if (view.focus === "active") {
      const active = teams[activeIndex];
      const axz = active ? teamXZ(layout, active.position) : { x: 0, z: 0 };
      fx = axz.x; fz = axz.z;
    }

    // pan manual: al soltar, vuelve suave al centro
    const p = pan.current;
    if (!p.dragging) { const e = Math.min(1, 3 * dt); p.tx *= (1 - e); p.tz *= (1 - e); }
    const pk = 1 - Math.exp(-8 * dt);
    p.x += (p.tx - p.x) * pk; p.z += (p.tz - p.z) * pk;

    // suavizado del encuadre (rápido pero cinematográfico)
    const k = 1 - Math.exp(-3.2 * dt);
    tgt.current.x += (fx + p.x - tgt.current.x) * k;
    tgt.current.z += (fz + p.z - tgt.current.z) * k;
    off.current.x += (view.off[0] - off.current.x) * k;
    off.current.y += (view.off[1] - off.current.y) * k;
    off.current.z += (view.off[2] - off.current.z) * k;

    camera.position.set(tgt.current.x + off.current.x, off.current.y, tgt.current.z + off.current.z);
    look.current.x += (tgt.current.x - look.current.x) * k;
    look.current.z += (tgt.current.z - look.current.z) * k;
    camera.lookAt(look.current.x, LOOK_Y, look.current.z);

    // FOV animado (parte del encuadre; ayuda a leer en vertical)
    if (Math.abs(fov.current - view.fov) > 0.01) {
      fov.current += (view.fov - fov.current) * k;
      camera.fov = fov.current; camera.updateProjectionMatrix();
    }

    // ¿llegó? el encuadre (offset + foco + FOV) está en su lugar y el pan quieto.
    if (!overview) {
      const dOff = Math.hypot(view.off[0] - off.current.x, view.off[1] - off.current.y, view.off[2] - off.current.z);
      const dFocus = view.focus === "center" ? Math.hypot(tgt.current.x - p.x, tgt.current.z - p.z) : 0;
      const dFov = Math.abs(view.fov - fov.current);
      if (dOff < 0.4 && dFocus < 0.5 && dFov < 1.0) cameraBus.markArrived();
    }
  });

  return null;
}
