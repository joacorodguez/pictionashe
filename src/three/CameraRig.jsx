import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { teamXZ } from "./boardLayout.js";

/* ============================================================
   CÁMARA CINEMATOGRÁFICA (perspectiva) — un solo mundo, misma
   luz e inclinación. Estados suaves + arrastre para mirar el
   tablero (con límites y regreso suave al centro).
   Secuencia del dado: al tirar la cámara va a la vista de tiro,
   el dado se lanza desde el lado de la cámara, rueda y para, y
   la cámara se ACERCA al dado para mostrar el número.
   ============================================================ */

const OFF_OVERVIEW = [0, 33, 50];      // botón: todo el tablero
const OFF_REST = [0, 13, 21];          // reposo: sigue la ficha activa (algo más lejos)
const OFF_DICE_THROW = [0, 14.5, 23];  // tiro: vista general para ver el lanzamiento
const OFF_DICE_REVEAL = [0, 6.5, 10];  // resultado: acercamiento al dado
const OFF_CHASE = [0, 7, 13];          // sigue de cerca el recorrido
const PAN_LIMIT = 6;                   // límite del arrastre (nunca pierde el tablero)

export function CameraRig({ layout, teams, activeIndex, rolling, moving, showDice, overview }) {
  const { camera, gl } = useThree();
  const tgt = useRef(new THREE.Vector3(0, 0.4, 0));
  const off = useRef(new THREE.Vector3(...OFF_REST));
  const look = useRef(new THREE.Vector3(0, 0.4, 0));
  const pan = useRef({ x: 0, z: 0, tx: 0, tz: 0, dragging: false, lx: 0, ly: 0, moved: 0 });

  // arrastre con el dedo/mouse para mover la vista del tablero
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
    const active = teams[activeIndex];
    const axz = active ? teamXZ(layout, active.position) : { x: 0, z: 0 };

    let dTx = 0, dTz = 0, dOff;
    if (overview) { dOff = OFF_OVERVIEW; }
    else if (rolling) { dOff = OFF_DICE_THROW; }                  // ver el lanzamiento
    else if (showDice) { dOff = OFF_DICE_REVEAL; }               // acercarse al dado (resultado)
    else if (moving) { dTx = axz.x; dTz = axz.z; dOff = OFF_CHASE; } // seguir el recorrido
    else { dTx = axz.x; dTz = axz.z; dOff = OFF_REST; }           // reposo: ficha activa

    // pan: cuando no se arrastra, el objetivo vuelve suave al centro
    const p = pan.current;
    if (!p.dragging) { const e = Math.min(1, 3 * dt); p.tx *= (1 - e); p.tz *= (1 - e); }
    const pk = 1 - Math.exp(-8 * dt);
    p.x += (p.tx - p.x) * pk; p.z += (p.tz - p.z) * pk;

    const k = 1 - Math.exp(-1.4 * dt);   // transiciones lentas y cinematográficas
    tgt.current.x += (dTx + p.x - tgt.current.x) * k;
    tgt.current.z += (dTz + p.z - tgt.current.z) * k;
    off.current.x += (dOff[0] - off.current.x) * k;
    off.current.y += (dOff[1] - off.current.y) * k;
    off.current.z += (dOff[2] - off.current.z) * k;

    camera.position.set(tgt.current.x + off.current.x, off.current.y, tgt.current.z + off.current.z);
    look.current.x += (tgt.current.x - look.current.x) * k;
    look.current.z += (tgt.current.z - look.current.z) * k;
    camera.lookAt(look.current.x, 0.4, look.current.z);
  });

  return null;
}
