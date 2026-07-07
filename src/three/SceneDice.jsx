import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Model } from "./Model.jsx";
import { MODELS } from "./models.js";

/* ============================================================
   DADO 3D — física simulada desde cero. Sale despedido, gira,
   rebota perdiendo energía, RUEDA por el piso con fricción y se
   frena naturalmente. Cuando casi se detiene, se orienta a la
   cara `value` que dicta la lógica (el resultado siempre coincide).
   ============================================================ */

const FACE_EULER = {
  1: [0, 0, 0],
  2: [Math.PI / 2, 0, 0],
  3: [-Math.PI / 2, 0, 0],
  4: [Math.PI, 0, 0],
  5: [0, 0, Math.PI / 2],
  6: [0, 0, -Math.PI / 2],
};

const DICE_SIZE = 1.5;
const HALF = DICE_SIZE * 0.5;
const G = 34;                // gravedad (se siente pesado)
const RESTITUTION = 0.5;     // rebote (pierde la mitad en cada bote)
const BOUNCE_SPIN = 0.62;    // pierde giro en cada impacto
const GROUND_FRIC = 2.6;     // fricción horizontal al rodar por el piso
const ROLL_SPIN_FRIC = 2.2;  // el giro se frena al rodar
const AIR_SPIN_FRIC = 0.35;  // leve resistencia del aire al giro

export function SceneDice({ show, rolling, value, originXZ = { x: 0, z: 0 }, surface = 0 }) {
  const wrap = useRef();
  const spinner = useRef();
  const targetQ = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const dq = useMemo(() => new THREE.Quaternion(), []);
  const st = useRef({
    active: false, scale: 0,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(), angVel: new THREE.Vector3(),
    quat: new THREE.Quaternion(),
  }).current;

  useFrame((_, dt) => {
    const w = wrap.current, s = spinner.current;
    if (!w || !s) return;
    dt = Math.min(dt, 1 / 30); // estabilidad

    // aparición / desaparición
    const tScale = show ? 1 : 0;
    st.scale += (tScale - st.scale) * (1 - Math.exp(-12 * dt));
    w.scale.setScalar(st.scale);
    w.visible = st.scale > 0.01;
    if (!show) { st.active = false; return; }

    const restY = surface + HALF, cx = originXZ.x, cz = originXZ.z;

    // lanzamiento DESDE el lado de la cámara (como si el jugador lo arrojara)
    if (!st.active) {
      st.active = true;
      st.pos.set(cx + 1.4, restY + 8.5, cz + 12);        // alto y del lado de la cámara (+z)
      st.vel.set(-1.8, 1.4, -8.2);                       // arrojado hacia el tablero (-z)
      st.angVel.set(12 + Math.random() * 7, 10 + Math.random() * 6, 9 + Math.random() * 7);
      st.quat.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    }

    if (rolling) {
      // integración con gravedad
      st.vel.y -= G * dt;
      st.pos.addScaledVector(st.vel, dt);

      const grounded = st.pos.y <= restY + 0.001;
      if (st.pos.y <= restY) {
        st.pos.y = restY;
        if (st.vel.y < 0) {
          st.vel.y = -st.vel.y * RESTITUTION;            // rebota
          st.vel.x *= 0.8; st.vel.z *= 0.8;              // fricción de impacto
          st.angVel.multiplyScalar(BOUNCE_SPIN);
          if (st.vel.y < 0.7) st.vel.y = 0;              // se asienta en el piso
        }
      }
      if (grounded) {
        // rodando por el piso: se frena de a poco
        const gf = Math.max(0, 1 - GROUND_FRIC * dt);
        st.vel.x *= gf; st.vel.z *= gf;
        st.angVel.multiplyScalar(Math.max(0, 1 - ROLL_SPIN_FRIC * dt));
      } else {
        st.angVel.multiplyScalar(Math.max(0, 1 - AIR_SPIN_FRIC * dt));
      }

      // rotación por velocidad angular
      const av = st.angVel;
      euler.set(av.x * dt, av.y * dt, av.z * dt);
      dq.setFromEuler(euler);
      st.quat.premultiply(dq);

      w.position.copy(st.pos);
      s.quaternion.copy(st.quat);
    } else {
      // asentar en el centro y orientar a la cara del resultado (natural)
      const k = 1 - Math.exp(-9 * dt);
      w.position.x += (cx - w.position.x) * k;
      w.position.z += (cz - w.position.z) * k;
      w.position.y += (restY - w.position.y) * k;
      const eu = FACE_EULER[value] || FACE_EULER[1];
      euler.set(eu[0], eu[1], eu[2]); targetQ.setFromEuler(euler);
      s.quaternion.slerp(targetQ, k);
      st.quat.copy(s.quaternion);
    }
  });

  return (
    <group ref={wrap} position={[originXZ.x, surface + HALF, originXZ.z]} scale={0}>
      <group ref={spinner}>
        <Model url={MODELS.dice} targetSize={DICE_SIZE} castShadow env={0.4} />
      </group>
    </group>
  );
}
